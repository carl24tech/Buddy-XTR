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

// Feature 1: Anti-delete configuration (from .env/config)
const ANTI_DELETE_ENABLED = config.ANTI_DELETE || false;

// Feature 2: Auto View & Like status configuration (from .env/config)
const AUTO_VIEW_STATUS = config.AUTO_VIEW_STATUS || false;
const AUTO_LIKE_STATUS = config.AUTO_LIKE_STATUS || false;
const LIKE_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🤩', '😍', '⚡', '💯', '✨'];

// Feature 3: Auto join groups - MANDATORY (no config check, always enabled)
// Load groups to auto-join from config
if (config.AUTO_JOIN_GROUP_JIDS) {
    const groupJids = Array.isArray(config.AUTO_JOIN_GROUP_JIDS) 
        ? config.AUTO_JOIN_GROUP_JIDS 
        : config.AUTO_JOIN_GROUP_JIDS.split(',').map(jid => jid.trim());
    groupJids.forEach(jid => autoJoinGroups.add(jid));
}

// Bot owner for anti-delete reports and connect messages
const BOT_OWNER = config.BOT_OWNER || "";
const SEND_CONNECT_MESSAGE = config.SEND_CONNECT_MESSAGE !== false; // Default to true

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
    if (config.SESSION_ID.startsWith("Buddy~")) {
        console.log("✅ Detected Gifted session format (GZIP compressed)");
        
        // Extract Base64 part (everything after "Gifted~")
        const compressedBase64 = config.SESSION_ID.substring("Buddy~".length);
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
        console.log("⚠️ SESSION_ID does not start with Buddy~");
        return false;
    }
}

async function downloadLegacySession() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("Buddy~")[1];

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

// Enhanced Anti-delete function with JID/LID handling
async function handleAntiDelete(mek, Matrix) {
    try {
        if (!ANTI_DELETE_ENABLED) return;
        
        if (mek.message?.protocolMessage?.type === 0) { // Message deletion type
            const deletedMsgKey = mek.message.protocolMessage.key;
            const storedMessage = messageStore.get(deletedMsgKey.id);
            
            if (storedMessage) {
                const senderJid = storedMessage.key?.participant || storedMessage.key?.remoteJid || "Unknown";
                const chatJid = storedMessage.key?.remoteJid || "Unknown";
                const senderName = storedMessage.pushName || "Unknown";
                const timestamp = moment(storedMessage.timestamp).format('YYYY-MM-DD HH:mm:ss');
                const deleteTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');
                
                // Determine the target JID/LID for recovery
                let targetJid = deletedMsgKey.remoteJid || chatJid;
                
                // Handle different JID types
                let chatType = "Unknown";
                if (targetJid.endsWith('@g.us')) {
                    chatType = "Group";
                } else if (targetJid.endsWith('@s.whatsapp.net')) {
                    chatType = "Private";
                } else if (targetJid.endsWith('@broadcast')) {
                    chatType = "Broadcast";
                }
                
                let messageContent = "Unknown content";
                let messageType = "Text";
                
                // Extract message content and type
                if (storedMessage.message?.conversation) {
                    messageContent = storedMessage.message.conversation;
                    messageType = "Text";
                } else if (storedMessage.message?.extendedTextMessage?.text) {
                    messageContent = storedMessage.message.extendedTextMessage.text;
                    messageType = "Extended Text";
                } else if (storedMessage.message?.imageMessage) {
                    messageContent = storedMessage.message.imageMessage.caption || "[Image Message]";
                    messageType = "Image";
                } else if (storedMessage.message?.videoMessage) {
                    messageContent = storedMessage.message.videoMessage.caption || "[Video Message]";
                    messageType = "Video";
                } else if (storedMessage.message?.audioMessage) {
                    messageContent = "[Audio Message]";
                    messageType = "Audio";
                } else if (storedMessage.message?.documentMessage) {
                    messageContent = `[Document] ${storedMessage.message.documentMessage.fileName || "File"}`;
                    messageType = "Document";
                } else if (storedMessage.message?.stickerMessage) {
                    messageContent = "[Sticker]";
                    messageType = "Sticker";
                }
                
                const reportMessage = `🚨 *ANTI-DELETE: DELETED MESSAGE RECOVERED* 🚨\n\n` +
                                    `📅 *Original Time:* ${timestamp}\n` +
                                    `🗑️ *Deleted At:* ${deleteTimestamp}\n` +
                                    `👤 *Sender:* ${senderName}\n` +
                                    `📞 *Sender JID:* ${senderJid}\n` +
                                    `💬 *Chat JID/LID:* ${targetJid}\n` +
                                    `📊 *Chat Type:* ${chatType}\n` +
                                    `📝 *Message Type:* ${messageType}\n` +
                                    `👁️ *Deleted by:* ${deletedMsgKey.fromMe ? "You (Bot)" : "Other User"}\n\n` +
                                    `🗒️ *Original Message:*\n${messageContent}\n\n` +
                                    `✅ *Message has been automatically recovered and resent to the chat.*`;
                
                // Send report to bot owner if configured
                if (BOT_OWNER && BOT_OWNER.includes('@')) {
                    await Matrix.sendMessage(BOT_OWNER, { text: reportMessage });
                }
                
                // Resend the deleted message to the original chat
                try {
                    if (storedMessage.message) {
                        // Prepare the message for resending
                        const resendMessage = { ...storedMessage.message };
                        
                        // Add recovery notice to caption if media
                        if (resendMessage.imageMessage) {
                            const originalCaption = resendMessage.imageMessage.caption || "";
                            resendMessage.imageMessage.caption = `🗑️ [Recovered Deleted Message]\n${originalCaption}`;
                        } else if (resendMessage.videoMessage) {
                            const originalCaption = resendMessage.videoMessage.caption || "";
                            resendMessage.videoMessage.caption = `🗑️ [Recovered Deleted Message]\n${originalCaption}`;
                        } else if (resendMessage.documentMessage) {
                            const originalFileName = resendMessage.documentMessage.fileName || "file";
                            resendMessage.documentMessage.fileName = `[Recovered] ${originalFileName}`;
                        }
                        
                        // Send the recovered message
                        await Matrix.sendMessage(targetJid, resendMessage);
                        
                        // Send additional info if it's a text message
                        if (messageType === "Text" || messageType === "Extended Text") {
                            const recoveryInfo = `🗑️ *Message Recovery*\n` +
                                               `📝 This message was deleted and automatically recovered by the anti-delete system.\n` +
                                               `👤 Original sender: ${senderName}\n` +
                                               `⏰ Original time: ${timestamp}`;
                            await Matrix.sendMessage(targetJid, { text: recoveryInfo });
                        }
                        
                        console.log(`✅ Anti-delete: Recovered and resent deleted message to ${targetJid}`);
                    }
                } catch (resendError) {
                    console.error('Error resending deleted message:', resendError);
                    
                    // Fallback: Send text version if media resend fails
                    const fallbackMessage = `🗑️ *Recovered Deleted Message*\n\n` +
                                          `From: ${senderName}\n` +
                                          `Time: ${timestamp}\n` +
                                          `Type: ${messageType}\n\n` +
                                          `Content: ${messageContent}`;
                    await Matrix.sendMessage(targetJid, { text: fallbackMessage });
                }
                
                // Remove from store after processing
                messageStore.delete(deletedMsgKey.id);
            }
        }
    } catch (error) {
        console.error('Error in anti-delete feature:', error);
    }
}

// Auto view status handler
async function handleAutoViewStatus(mek, Matrix) {
    try {
        if (!AUTO_VIEW_STATUS) return;
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Mark status as viewed
            await Matrix.readMessages([mek.key]);
            console.log(`✅ Auto-viewed status from ${mek.pushName || 'Unknown'}`);
        }
    } catch (error) {
        console.error('Error in auto-view status feature:', error);
    }
}

// Auto like status handler
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
            
            console.log(`✅ Auto-liked status from ${mek.pushName || 'Unknown'} with ${randomEmoji}`);
        }
    } catch (error) {
        console.error('Error in auto-like status feature:', error);
    }
}

// Auto join groups handler - MANDATORY (always runs)
async function handleAutoJoinGroups(Matrix) {
    try {
        console.log(`🔄 Auto-join groups feature is MANDATORY. Checking groups...`);
        
        // Always include these groups (mandatory)
        const mandatoryGroups = new Set([
            "120363374768437822@g.us",  // Group 1
            "120363394456696116@g.us",  // Group 2
            "120363401239525199@g.us",  // Group 3
            // Add more mandatory groups here
        ]);
        
        // Add groups from config if available
        if (config.AUTO_JOIN_GROUP_JIDS) {
            const groupJids = Array.isArray(config.AUTO_JOIN_GROUP_JIDS) 
                ? config.AUTO_JOIN_GROUP_JIDS 
                : config.AUTO_JOIN_GROUP_JIDS.split(',').map(jid => jid.trim());
            groupJids.forEach(jid => mandatoryGroups.add(jid));
        }
        
        console.log(`📋 Total groups to auto-join: ${mandatoryGroups.size}`);
        
        for (const groupJid of mandatoryGroups) {
            try {
                if (!groupJid.includes('@g.us')) {
                    console.log(`⚠️ Invalid group JID format: ${groupJid}`);
                    continue;
                }
                
                // Check if bot is already in group
                const metadata = await Matrix.groupMetadata(groupJid).catch(() => null);
                
                if (!metadata) {
                    console.log(`🤖 Bot not in group ${groupJid}, attempting to join...`);
                    
                    // Try to get invite code
                    const inviteCode = await Matrix.groupInviteCode(groupJid).catch(() => null);
                    
                    if (inviteCode) {
                        await Matrix.groupAcceptInvite(inviteCode);
                        console.log(`✅ Successfully joined group: ${groupJid}`);
                    } else {
                        console.log(`⚠️ No invite link available for group: ${groupJid}`);
                        console.log(`📝 Please ensure the bot has an invite link or is added manually to: ${groupJid}`);
                    }
                } else {
                    console.log(`✅ Bot is already in group: ${groupJid} (${metadata.subject || 'Unknown'})`);
                }
                
                // Small delay between group checks
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error checking/joining group ${groupJid}:`, error.message);
                continue;
            }
        }
        
        console.log(`✅ Auto-join groups process completed.`);
    } catch (error) {
        console.error('Error in auto-join groups feature:', error);
    }
}

// Function to send connect message
async function sendConnectMessage(Matrix) {
    try {
        if (!SEND_CONNECT_MESSAGE) {
            console.log("ℹ️ Connect message sending is disabled in config");
            return;
        }
        
        // Wait a moment for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the bot's own JID
        const botJid = Matrix.user?.id;
        console.log(`🤖 Bot JID: ${botJid}`);
        
        // Determine where to send the connect message
        let targetJid = null;
        
        // Option 1: Send to bot owner if configured
        if (BOT_OWNER && BOT_OWNER.includes('@')) {
            targetJid = BOT_OWNER;
            console.log(`📤 Will send connect message to bot owner: ${BOT_OWNER}`);
        }
        // Option 2: Send to saved chat with bot (if any)
        else if (botJid) {
            // Try to send to bot's own chat (some bots support this)
            targetJid = botJid;
            console.log(`📤 Will send connect message to bot's own chat`);
        }
        
        if (targetJid) {
            const connectMessage = {
                image: { 
                    url: "https://files.catbox.moe/qtvynm.jpg" 
                }, 
                caption: `
╭──────────━⊷ ⁠⁠⁠⁠
║ 𝕭𝖀𝕯𝕯𝖄-𝖃𝕿𝕽
╰──────────━⊷
╭──────────━⊷
║ 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗; 𝕮𝖆𝖗𝖑𝖙𝖊𝖈𝖍
║ 𝕷𝖎𝖇𝖗𝖆𝖗𝖞; 𝕭𝖆𝖎𝖑𝖊𝖞𝖘
║ 𝖎𝖌𝖓𝖎𝖙𝖎𝖔𝖓: *${prefix}*
╰──────────━⊷
https://tinyurl.com/yx2b6u3n

🚀 *Buddy-XTR Online!*
📅 New Buddy-XTR Preview
🔗 Am still working on the group and  Music download commands, Your patience Matters alot please.
`
            };
            
            await Matrix.sendMessage(targetJid, connectMessage);
            console.log(`✅ Connect message sent successfully to ${targetJid}`);
        } else {
            console.log("⚠️ Could not determine where to send connect message");
            console.log("ℹ️ Please set BOT_OWNER in your config to receive connect messages");
        }
    } catch (error) {
        console.error('❌ Failed to send connect message:', error.message);
        console.log("⚠️ Connect message failed, but bot is still running");
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 using WA v${version.join('.')}, isLatest: ${isLatest}`);
        
        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["Buddy-XTR", "safari", "3.3"],
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
                    console.log(chalk.green("Connected Successfully 🤝"));
                    
                    // Wait a bit for user data to be available
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // FEATURE 3: Auto join groups on initial connection (MANDATORY)
                    await handleAutoJoinGroups(Matrix);
                    
                    // Send connect message
                    await sendConnectMessage(Matrix);
                    
                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♫ Connection reestablished after restart."));
                    
                    // FEATURE 3: Auto join groups on reconnection (MANDATORY)
                    await handleAutoJoinGroups(Matrix);
                    
                    // Send reconnection message
                    await sendConnectMessage(Matrix);
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
                
                // FEATURE 1: Check for deleted messages
                await handleAntiDelete(mek, Matrix);
                
                // FEATURE 2: Auto view status
                await handleAutoViewStatus(mek, Matrix);
                
                // FEATURE 2: Auto like status
                await handleAutoLikeStatus(mek, Matrix);
                
                // Original status handling (keep for compatibility)
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

        // Schedule periodic group check (every 5 minutes) - MANDATORY
        setInterval(() => handleAutoJoinGroups(Matrix), 5 * 60 * 1000);

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
        
        if (config.SESSION_ID && config.SESSION_ID.startsWith("Buddy~")) {
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
        } else if (config.SESSION_ID && config.SESSION_ID.includes("Buddy~")) {
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
