import { serialize, decodeJid } from '../lib/Serializer.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../config.cjs';
import { smsg } from '../lib/myfunc.cjs';
import { handleAntilink } from './antilink.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Import roasts from external file
import roasts from './buddyxtr/roast.js';

const Handler = async (chatUpdate, sock, logger) => {
    try {
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

        // Handle roast command directly in handler
        if (cmd === 'roast') {
            try {
                // Get a random roast
                const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
                
                // Check if image exists
                const fsSync = require('fs'); // Using require for sync operations
                let imagePath = path.join(__dirname, 'buddyxtr', 'roast.jpg');
                
                // If roast image doesn't exist, check for alternative
                if (!fsSync.existsSync(imagePath)) {
                    // Try other possible locations
                    const alternativePaths = [
                        path.join(__dirname, '..', 'buddyxtr', 'roast.jpg'),
                        path.join(process.cwd(), 'buddyxtr', 'roast.jpg'),
                        path.join(__dirname, '..', 'media', 'roast.jpg'),
                        path.join(__dirname, '..', 'media', 'default.jpg')
                    ];
                    
                    for (const altPath of alternativePaths) {
                        if (fsSync.existsSync(altPath)) {
                            imagePath = altPath;
                            break;
                        }
                    }
                }

                // Send roast message with image if available
                if (fsSync.existsSync(imagePath)) {
                    await sock.sendMessage(m.from, {
                        image: fsSync.readFileSync(imagePath),
                        caption: `*🔥 Roast Time! 🔥*\n\n${randomRoast}\n\n_@${m.sender.split('@')[0]}_`,
                        mentions: [m.sender]
                    }, {
                        quoted: m
                    });
                } else {
                    // Send text-only roast if image not found
                    await sock.sendMessage(m.from, {
                        text: `*🔥 Roast Time! 🔥*\n\n${randomRoast}\n\n_@${m.sender.split('@')[0]}_`,
                        mentions: [m.sender]
                    }, {
                        quoted: m
                    });
                }
            } catch (error) {
                console.error('Roast command error:', error);
                await sock.sendMessage(m.from, {
                    text: `*Error roasting:* ${error.message}`
                }, {
                    quoted: m
                });
            }
            return; // Stop further processing after handling roast
        }

        await handleAntilink(m, sock, logger, isBotAdmins, isAdmins, isCreator);

        const { isGroup, type, sender, from, body } = m;
      //  console.log(m);

        // ✅ Corrected Plugin Folder Path
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
