import config from '../config.cjs';

async function handleCommand(m, gss) {
    try {
        if (!m || !m.key) return;

        const sender = m.sender || m.key.remoteJid; // Ensure sender is always defined

        if (config.AUTO_TYPING && m.from) {
            gss.sendPresenceUpdate("composing", m.from);
        }

        if (config.AUTO_RECORDING && m.from) {
            gss.sendPresenceUpdate("recording", m.from);
        }

        if (m.from) {
            gss.sendPresenceUpdate(config.ALWAYS_ONLINE ? 'available' : 'unavailable', m.from);
        }

        if (config.AUTO_READ) {
            await gss.readMessages([m.key]);
        }

        if (config.AUTO_BLOCK && sender?.startsWith('212')) {
            await gss.updateBlockStatus(sender, 'block');
        }
        
    } catch (error) {
        console.error('Error in autoaction.js:', error);
    }
}

export default handleCommand;