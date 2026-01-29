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
        
            
