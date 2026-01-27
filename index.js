import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import { File } from 'megajs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
import zlib from 'zlib';
import { promisify } from 'util';

const { emojis, doReact } = pkg;
const prefix = process.env.PREFIX || config.PREFIX;
const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

// Store for anti-delete feature
const messageStore = new Map();
// Store for auto-join groups feature
const autoJoinGroups = new Set();

// Feature 1: Anti-delete configuration
const ANTI_DELETE_ENABLED = config.ANTI_DELETE || false;
const BOT_OWNER = config.BOT_OWNER || ""; // Bot owner's JID

// Feature 2: Auto Like status configuration
const AUTO_LIKE_STATUS = config.AUTO_LIKE_STATUS || false;
const LIKE_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🤩', '😍', '⚡', '💯', '✨'];

// Feature 3: Auto join groups configuration
const AUTO_JOIN_GROUPS = config.AUTO_JOIN_GROUPS || false;
// Load groups to auto-join from config
if (config.AUTO_JOIN_GROUP_JIDS) {
    const groupJids = Array.isArray(config.AUTO_JOIN_GROUP_JIDS) 
        ? config.AUTO_JOIN_GROUP_JIDS 
        : config.AUTO_JOIN_GROUP_JIDS.split(',').map(jid => jid.trim());
    groupJids.forEach(jid => autoJoinGroups.add(jid));
}

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function loadGiftedSession() {
    console.log("🔍 Checking SESSION_ID format...");
    
    if (!config.SESSION_ID) {
        console.error('❌ No SESSION_ID provided in config!');
        return false;
    }
    
    // Check if session starts with "Gifted~"
    if (config.SESSION_ID.startsWith("Gifted~")) {
        console.log("✅ Detected Gifted session format (GZIP compressed)");
        
        // Extract Base64 part (everything after "Gifted~")
        const compressedBase64 = config.SESSION_ID.substring("Gifted~".length);
        console.log("📏 Compressed Base64 length:", compressedBase64.length);
        
        try {
            // Decode Base64
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            console.log("🔢 Decoded buffer length:", compressedBuffer.length);
            
            // Check if it's GZIP compressed
            if (compressedBuffer[0] === 0x1f && compressedBuffer[1] === 0x8b) {
                console.log("✅ Detected GZIP compression");
                
                // Decompress using GZIP
                const gunzip = promisify(zlib.gunzip);
                const decompressedBuffer = await gunzip(compressedBuffer);
                const sessionData = decompressedBuffer.toString('utf-8');
                
                console.log("📄 Decompressed session data (first 200 chars):");
                console.log(sessionData.substring(0, 200));
                
                // Try to parse as JSON
                try {
                    const parsedSession = JSON.parse(sessionData);
                    console.log("✅ Successfully parsed JSON session");
                    console.log("🔑 Session keys:", Object.keys(parsedSession));
                } catch (parseError) {
                    console.log("⚠️ Session data is not JSON, saving as raw string");
                }
                
                // Save session to file
                await fs.promises.writeFile(credsPath, sessionData);
                console.log("💾 Session saved to file successfully");
                return true;
            } else {
                console.log("❌ Not a valid GZIP file (missing magic bytes)");
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to process Gifted session:', error.message);
            console.error('🔍 Error details:', error);
            return false;
        }
    } else {
        console.log("⚠️ SESSION_ID does not start with Gifted~");
        return false;
    }
}

async function downloadLegacySession() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("CLOUD-AI~")[1];

    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("📥 Downloading Legacy Session from Mega.nz...");
        const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        await fs.promises.writeFile(credsPath, data);
        console.log("📱 Legacy Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('❌ Failed to download legacy session data:', error);
        return false;
    }
}

// Feature 1: Anti-delete function
async function handleAntiDelete(mek, Matrix) {
    try {
        if (!ANTI_DELETE_ENABLED || !BOT_OWNER) return;
        
        if (mek.message?.protocolMessage?.type === 0) { // Message deletion type
            const deletedMsgKey = mek.message.protocolMessage.key;
            const storedMessage = messageStore.get(deletedMsgKey.id);
            
            if (storedMessage) {
                const sender = storedMessage.key?.participant || storedMessage.key?.remoteJid || "Unknown";
                const chatName = storedMessage.pushName || "Unknown";
                const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
                
                let messageContent = "Unknown content";
                if (storedMessage.message?.conversation) {
                    messageContent = storedMessage.message.conversation;
                } else if (storedMessage.message?.extendedTextMessage?.text) {
                    messageContent = storedMessage.message.extendedTextMessage.text;
                } else if (storedMessage.message?.imageMessage?.caption) {
                    messageContent = `[Image] ${storedMessage.message.imageMessage.caption}`;
                } else if (storedMessage.message?.videoMessage?.caption) {
                    messageContent = `[Video] ${storedMessage.message.videoMessage.caption}`;
                } else if (storedMessage.message?.audioMessage) {
                    messageContent = "[Audio Message]";
                } else if (storedMessage.message?.documentMessage) {
                    messageContent = `[Document] ${storedMessage.message.documentMessage.fileName || "File"}`;
                }
                
                const reportMessage = `🚨 *DELETED MESSAGE DETECTED* 🚨\n\n` +
                                    `📅 *Time:* ${timestamp}\n` +
                                    `👤 *Sender:* ${chatName}\n` +
                                    `📞 *Sender JID:* ${sender}\n` +
                                    `💬 *Chat JID:* ${deletedMsgKey.remoteJid}\n` +
                                    `🗑️ *Deleted by:* ${deletedMsgKey.fromMe ? "You" : "Others"}\n\n` +
                                    `📝 *Original Message:*\n${messageContent}`;
                
                await Matrix.sendMessage(BOT_OWNER, { text: reportMessage });
                
                // Also resend the deleted message to bot owner if it's not media
                if (storedMessage.message && !storedMessage.message.imageMessage && 
                    !storedMessage.message.videoMessage && !storedMessage.message.audioMessage && 
                    !storedMessage.message.documentMessage) {
                    await Matrix.sendMessage(BOT_OWNER, { 
                        text: `📤 *Resent Deleted Message:*\n\n${messageContent}` 
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in anti-delete feature:', error);
    }
}

// Feature 2: Auto Like status function
async function handleAutoLikeStatus(mek, Matrix) {
    try {
        if (!AUTO_LIKE_STATUS) return;
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Add random delay to prevent rate limiting
            const delay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds delay
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Select random emoji
            const randomEmoji = LIKE_EMOJIS[Math.floor(Math.random() * LIKE_EMOJIS.length)];
            
            // Send reaction to status
            await Matrix.sendMessage(mek.key.remoteJid, {
                react: {
                    text: randomEmoji,
                    key: mek.key
                }
            });
            
            console.log(`✅ Auto-liked status with ${randomEmoji}`);
        }
    } catch (error) {
        console.error('Error in auto-like status feature:', error);
        // Don't crash on error, just log it
    }
}

// Feature 3: Auto join groups function
async function handleAutoJoinGroups(Matrix) {
    try {
        if (!AUTO_JOIN_GROUPS || autoJoinGroups.size === 0) return;
        
        console.log(`🔄 Checking ${autoJoinGroups.size} auto-join groups...`);
        
        for (const groupJid of autoJoinGroups) {
            try {
                // Check if bot is in the group
                const metadata = await Matrix.groupMetadata(groupJid).catch(() => null);
                
                if (!metadata) {
                    // Not in group, try to rejoin
                    console.log(`🤖 Bot not in group ${groupJid}, attempting to join...`);
                    
                    // Try to get group invite link
                    const inviteCode = await Matrix.groupInviteCode(groupJid).catch(() => null);
                    
                    if (inviteCode) {
                        // Join using invite link
                        await Matrix.groupAcceptInvite(inviteCode);
                        console.log(`✅ Successfully rejoined group: ${groupJid}`);
                    } else {
                        console.log(`⚠️ No invite link available for group: ${groupJid}`);
                    }
                } else {
                    console.log(`✅ Bot is already in group: ${groupJid}`);
                }
                
                // Add delay between checks to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error checking/joining group ${groupJid}:`, error.message);
                // Continue with next group even if one fails
            }
        }
    } catch (error) {
        console.error('Error in auto-join groups feature:', error);
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 JAWAD-MD using WA v${version.join('.')}, isLatest: ${isLatest}`);
        
        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["JAWAD-MD", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: " cloid ai whatsapp user bot" };
            }
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully cloud Ai 🤝"));
                    
                    // Feature 3: Auto join groups on initial connection
                    await handleAutoJoinGroups(Matrix);
                    
                    Matrix.sendMessage(Matrix.user.id, { 
                        image: { url: "https://files.catbox.moe/pf270b.jpg" }, 
                        caption: `*Hello there User! 🖐️* 

> Simple, Straightforward, But Loaded With Features 🎊. Meet CLOUD-AI WhatsApp Bot.

*Thanks for using CLOUD AI 🚩* 

> Join WhatsApp Channel: ♥️  
https://whatsapp.com/channel/0029VajJoCoLI8YePbpsnE3q

- *YOUR PREFIX:* = ${prefix}

Don't forget to give a star to the repo ⬇️  
https://github.com/DEVELOPER-BERA/CLOUD-AI

> © REGARDS BERA`
                    });
                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♫ Connection reestablished after restart."));
                    
                    // Feature 3: Auto join groups on reconnection
                    await handleAutoJoinGroups(Matrix);
                }
            }
        });
        
        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("messages.upsert", async chatUpdate => {
            // Store messages for anti-delete feature
            const mek = chatUpdate.messages[0];
            if (mek?.key?.id && mek.message && !mek.key.fromMe && ANTI_DELETE_ENABLED) {
                messageStore.set(mek.key.id, { ...mek, timestamp: Date.now() });
                
                // Clean old messages from store (keep last 1000 messages)
                if (messageStore.size > 1000) {
                    const oldestKey = Array.from(messageStore.entries())
                        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
                    messageStore.delete(oldestKey);
                }
            }
            
            // Call original handler
            await Handler(chatUpdate, Matrix, logger);
        });
        
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        if (config.MODE === "public") {
            Matrix.public = true;
        } else if (config.MODE === "private") {
            Matrix.public = false;
        }

        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                console.log(mek);
                if (!mek.key.fromMe && config.AUTO_REACT) {
                    console.log(mek);
                    if (mek.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }
            } catch (err) {
                console.error('Error during auto reaction:', err);
            }
        });
        
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                const fromJid = mek.key.participant || mek.key.remoteJid;
                if (!mek || !mek.message) return;
                if (mek.key.fromMe) return;
                if (mek.message?.protocolMessage || mek.message?.ephemeralMessage || mek.message?.reactionMessage) return; 
                
                // Feature 1: Check for deleted messages
                await handleAntiDelete(mek, Matrix);
                
                // Feature 2: Auto like status
                await handleAutoLikeStatus(mek, Matrix);
                
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
                    await Matrix.readMessages([mek.key]);
                    
                    if (config.AUTO_STATUS_REPLY) {
                        const customMessage = config.STATUS_READ_MSG || '✅ Auto Status Seen Bot By JAWAD-MD';
                        await Matrix.sendMessage(fromJid, { text: customMessage }, { quoted: mek });
                    }
                }
            } catch (err) {
                console.error('Error handling messages.upsert event:', err);
            }
        });

        // Schedule periodic group check (every 10 minutes)
        if (AUTO_JOIN_GROUPS) {
            setInterval(() => handleAutoJoinGroups(Matrix), 10 * 60 * 1000);
        }

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("📱 Existing session file found, loading it...");
        await start();
    } else {
        console.log("🔍 No existing session file, checking config.SESSION_ID...");
        
        if (config.SESSION_ID && config.SESSION_ID.startsWith("Gifted~")) {
            console.log("📥 Attempting to load Gifted session (GZIP compressed)...");
            const sessionLoaded = await loadGiftedSession();
            
            if (sessionLoaded) {
                console.log("✅ Gifted session loaded successfully!");
                await start();
            } else {
                console.log("❌ Failed to load Gifted session, falling back to QR code.");
                useQR = true;
                await start();
            }
        } else if (config.SESSION_ID && config.SESSION_ID.includes("CLOUD-AI~")) {
            console.log("📥 Attempting to load legacy Mega.nz session...");
            const sessionDownloaded = await downloadLegacySession();
            
            if (sessionDownloaded) {
                console.log("📱 Legacy session downloaded, starting bot.");
                await start();
            } else {
                console.log("❌ Failed to download legacy session, using QR code.");
                useQR = true;
                await start();
            }
        } else {
            console.log("🔢 No valid session found in config, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
