import { serialize, decodeJid } from '../lib/Serializer.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../config.cjs';
import { smsg } from '../lib/myfunc.cjs';
import { handleAntilink } from './antilink.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store for tracking messages (in-memory, consider using Redis for production)
const messageStore = new Map();

// Function to get group admins
export const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin === "superadmin" || i.admin === "admin") {
            admins.push(i.id);
        }
    }
    return admins || [];
};

// Function to send deleted message to bot owner
const sendDeletedMessageToOwner = async (deletedMessage, sock, logger) => {
    try {
        const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
        const botNumber = await sock.decodeJid(sock.user.id);
        
        let messageInfo = '';
        
        if (deletedMessage.isGroup) {
            const groupName = await sock.groupMetadata(deletedMessage.from)
                .then(metadata => metadata.subject)
                .catch(() => 'Unknown Group');
            
            const senderName = deletedMessage.pushName || deletedMessage.sender.split('@')[0];
            
            messageInfo = `🗑️ *Message Deleted Detected*\n\n` +
                         `👤 *Sender:* ${senderName}\n` +
                         `📞 *Sender ID:* ${deletedMessage.sender}\n` +
                         `👥 *Group:* ${groupName}\n` +
                         `📋 *Group ID:* ${deletedMessage.from}\n` +
                         `⏰ *Time:* ${new Date().toLocaleString()}\n\n`;
        } else {
            const senderName = deletedMessage.pushName || deletedMessage.sender.split('@')[0];
            
            messageInfo = `🗑️ *Message Deleted Detected*\n\n` +
                         `👤 *Sender:* ${senderName}\n` +
                         `📞 *Sender ID:* ${deletedMessage.sender}\n` +
                         `💬 *Chat Type:* Private\n` +
                         `⏰ *Time:* ${new Date().toLocaleString()}\n\n`;
        }
        
        // Send text info
        await sock.sendMessage(ownerNumber, { 
            text: messageInfo 
        });
        
        // Forward the deleted message content if available
        if (deletedMessage.message) {
            try {
                await sock.sendMessage(ownerNumber, {
                    forward: deletedMessage,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterName: "Deleted Message Alert",
                            newsletterJid: botNumber
                        }
                    }
                });
            } catch (forwardError) {
                // If forwarding fails, send message details
                let messageContent = '';
                
                if (deletedMessage.text) {
                    messageContent = `📝 *Content:* ${deletedMessage.text.substring(0, 500)}`;
                } else if (deletedMessage.caption) {
                    messageContent = `📝 *Caption:* ${deletedMessage.caption.substring(0, 500)}`;
                } else if (deletedMessage.type) {
                    messageContent = `📁 *Message Type:* ${deletedMessage.type}`;
                }
                
                if (messageContent) {
                    await sock.sendMessage(ownerNumber, { 
                        text: messageContent 
                    });
                }
            }
        }
        
        logger.info(`Deleted message alert sent to owner from ${deletedMessage.sender}`);
        
    } catch (error) {
        console.error('Error sending deleted message alert:', error);
        logger.error('Failed to send deleted message alert to owner');
    }
};

// Function to store messages for anti-delete tracking
const storeMessageForTracking = (message) => {
    try {
        if (!message.key || !message.key.id) return;
        
        const messageKey = message.key.id;
        const messageData = {
            ...message,
            timestamp: Date.now(),
            storedAt: new Date().toISOString()
        };
        
        // Store message with 24-hour TTL (adjust as needed)
        messageStore.set(messageKey, messageData);
        
        // Clean up old messages (older than 24 hours)
        const now = Date.now();
        for (const [key, data] of messageStore.entries()) {
            if (now - data.timestamp > 24 * 60 * 60 * 1000) {
                messageStore.delete(key);
            }
        }
        
        // Keep store size manageable
        if (messageStore.size > 10000) {
            const oldestKey = Array.from(messageStore.keys())[0];
            messageStore.delete(oldestKey);
        }
        
    } catch (error) {
        console.error('Error storing message for tracking:', error);
    }
};

// Function to check for deleted messages
const checkForDeletedMessages = async (chatUpdate, sock, logger) => {
    try {
        if (chatUpdate.type !== 'protocol' || !chatUpdate.messages) return;
        
        for (const message of chatUpdate.messages) {
            // Check if message is a deletion
            if (message.message?.protocolMessage?.type === 5 || // REVOKE
                message.message?.protocolMessage?.type === 13 || // EPHEMERAL_SETTING
                message.update?.messageStubType === 7) { // REVOKE
        
                const deletedMessageKey = message.message?.protocolMessage?.key?.id || 
                                         message.key?.id;
                
                if (deletedMessageKey) {
                    // Find the original message in our store
                    const originalMessage = messageStore.get(deletedMessageKey);
                    
                    if (originalMessage) {
                        // Check if it's a command response (prevent reporting bot's own messages)
                        const isBotResponse = originalMessage.key?.fromMe || 
                                             originalMessage?.fromMe || 
                                             (originalMessage.sender && 
                                              originalMessage.sender.includes(sock.user.id.split(':')[0]));
                        
                        // Don't report if it's a bot's command response
                        if (!isBotResponse) {
                            // Send alert to bot owner
                            await sendDeletedMessageToOwner(originalMessage, sock, logger);
                        }
                        
                        // Remove from store
                        messageStore.delete(deletedMessageKey);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking for deleted messages:', error);
    }
};

const Handler = async (chatUpdate, sock, logger) => {
    try {
        // First, check for deleted messages
        await checkForDeletedMessages(chatUpdate, sock, logger);
        
        if (chatUpdate.type !== 'notify') return;

        const m = serialize(JSON.parse(JSON.stringify(chatUpdate.messages[0])), sock, logger);
        if (!m.message) return;

        const participants = m.isGroup ? await sock.groupMetadata(m.from).then(metadata => metadata.participants) : [];
        const groupAdmins = m.isGroup ? getGroupAdmins(participants) : [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botId) : false;
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

        const PREFIX = /^[\\/!#.]/;
        const isCOMMAND = (body) => PREFIX.test(body);
        const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null;
        const prefix = prefixMatch ? prefixMatch[0] : '/';
        const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
        const text = m.body.slice(prefix.length + cmd.length).trim();
        const botNumber = await sock.decodeJid(sock.user.id);
        const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
        let isCreator = false;

        if (m.isGroup) {
            isCreator = m.sender === ownerNumber || m.sender === botNumber;
        } else {
            isCreator = m.sender === ownerNumber || m.sender === botNumber;
        }

        if (!sock.public) {
            if (!isCreator) {
                return;
            }
        }

        // Store message for anti-delete tracking (before handling antilink)
        // Only store non-command messages to avoid tracking bot responses
        if (!m.body?.startsWith(prefix) || !cmd) {
            storeMessageForTracking(m);
        }

        await handleAntilink(m, sock, logger, isBotAdmins, isAdmins, isCreator);

        const { isGroup, type, sender, from, body } = m;

        // Plugin Folder Path
        const pluginDir = path.resolve(__dirname, '..', 'plugins');  
        
        try {
            const pluginFiles = await fs.readdir(pluginDir);

            for (const file of pluginFiles) {
                if (file.endsWith('.js')) {
                    const pluginPath = path.join(pluginDir, file);
                    
                    try {
                        const pluginModule = await import(`file://${pluginPath}`);
                        const loadPlugins = pluginModule.default;
                        await loadPlugins(m, sock);
                    } catch (err) {
                        console.error(`❌ Failed to load plugin: ${pluginPath}`, err);
                    }
                }
            }
        } catch (err) {
            console.error(`❌ Plugin folder not found: ${pluginDir}`, err);
        }

    } catch (e) {
        console.error(e);
    }
};

export default Handler;
