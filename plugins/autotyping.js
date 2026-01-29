import config from '../config.cjs';
import fs from 'fs';
import path from 'path';

// Path to config file
const configPath = path.join(process.cwd(), 'config.cjs');

// Global variable to track autotyping state per chat
const typingSessions = new Map();

const autotypingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'autotyping') {
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
    
    const [action, ...args] = text.split(' ');
    const chatId = m.from;
    let responseMessage;

    // Function to save config to file
    const saveConfig = (key, value) => {
      try {
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Update the config content
        const regex = new RegExp(`(${key}\\s*:\\s*)(true|false)`, 'i');
        if (regex.test(configContent)) {
          configContent = configContent.replace(regex, `$1${value}`);
        } else {
          // If key doesn't exist, add it before export
          configContent = configContent.replace(
            'export default config;',
            `  ${key}: ${value},\nexport default config;`
          );
        }
        
        fs.writeFileSync(configPath, configContent, 'utf8');
        config[key] = value === 'true';
        return true;
      } catch (error) {
        console.error('Error saving config:', error);
        return false;
      }
    };

    // Function to start persistent typing
    const startPersistentTyping = async (chatId, Matrix) => {
      if (typingSessions.has(chatId)) {
        clearInterval(typingSessions.get(chatId));
      }

      // Send typing indicator every 20 seconds (WhatsApp typing lasts ~25 seconds)
      const typingInterval = setInterval(async () => {
        try {
          await Matrix.sendPresenceUpdate('composing', chatId);
        } catch (error) {
          console.error('Error sending typing indicator:', error);
          clearInterval(typingInterval);
          typingSessions.delete(chatId);
        }
      }, 20000);

      typingSessions.set(chatId, typingInterval);
      
      // Send initial typing indicator
      try {
        await Matrix.sendPresenceUpdate('composing', chatId);
      } catch (error) {
        console.error('Error sending initial typing:', error);
      }
    };

    // Function to stop persistent typing
    const stopPersistentTyping = (chatId) => {
      if (typingSessions.has(chatId)) {
        clearInterval(typingSessions.get(chatId));
        typingSessions.delete(chatId);
        
        // Send stopped typing presence
        Matrix.sendPresenceUpdate('paused', chatId).catch(console.error);
        return true;
      }
      return false;
    };

    switch (action) {
      case 'on':
        if (args[0] === 'global') {
          // Enable globally for all chats
          const saved = saveConfig('AUTO_TYPING', 'true');
          responseMessage = saved 
            ? "✅ *Global Auto-Typing Enabled*\nBot will show typing indicator in all chats."
            : "❌ Failed to update config file.";
          
          // Start typing in current chat if not already
          if (!typingSessions.has(chatId)) {
            startPersistentTyping(chatId, Matrix);
          }
        } else {
          // Enable for specific chat
          startPersistentTyping(chatId, Matrix);
          responseMessage = "✅ *Auto-Typing Enabled*\nBot will show persistent typing indicator in this chat.\nUse `autotyping off` to disable.";
        }
        break;

      case 'off':
        if (args[0] === 'global') {
          // Disable globally
          const saved = saveConfig('AUTO_TYPING', 'false');
          
          // Stop all active typing sessions
          typingSessions.forEach((interval, chatId) => {
            clearInterval(interval);
            Matrix.sendPresenceUpdate('paused', chatId).catch(console.error);
          });
          typingSessions.clear();
          
          responseMessage = saved 
            ? "✅ *Global Auto-Typing Disabled*\nAll typing sessions stopped."
            : "❌ Failed to update config file.";
        } else {
          // Disable for specific chat
          const stopped = stopPersistentTyping(chatId);
          responseMessage = stopped 
            ? "✅ *Auto-Typing Disabled*\nTyping indicator stopped for this chat."
            : "⚠️ No active typing session found for this chat.";
        }
        break;

      case 'status':
        const globalStatus = config.AUTO_TYPING ? '🟢 Enabled Globally' : '🔴 Disabled Globally';
        const chatStatus = typingSessions.has(chatId) ? '🟢 Active in this chat' : '🔴 Inactive in this chat';
        const activeChats = typingSessions.size;
        
        responseMessage = `*Auto-Typing Status*\n\n` +
                         `🌍 ${globalStatus}\n` +
                         `💬 ${chatStatus}\n` +
                         `📊 Active Chats: ${activeChats}\n\n` +
                         `*Commands:*\n` +
                         `• \`autotyping on\` - Enable for this chat\n` +
                         `• \`autotyping on global\` - Enable globally\n` +
                         `• \`autotyping off\` - Disable for this chat\n` +
                         `• \`autotyping off global\` - Disable globally\n` +
                         `• \`autotyping status\` - Check status`;
        break;

      default:
        responseMessage = "*📝 Auto-Typing Command*\n\n" +
                         "*Usage:*\n" +
                         "• `autotyping on` - Enable in current chat\n" +
                         "• `autotyping on global` - Enable globally\n" +
                         "• `autotyping off` - Disable in current chat\n" +
                         "• `autotyping off global` - Disable globally\n" +
                         "• `autotyping status` - Check current status\n\n" +
                         "*Note:* This shows persistent typing indicator until manually disabled.";
        break;
    }

    try {
      await Matrix.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

// Function to initialize typing sessions on bot start
export const initializeAutoTyping = async (Matrix) => {
  if (config.AUTO_TYPING) {
    console.log('Auto-Typing is enabled globally in config');
    // You might want to load previous chat sessions from a database/file here
  }
};

// Clean up function to stop all typing when bot shuts down
export const cleanupAutoTyping = () => {
  typingSessions.forEach((interval, chatId) => {
    clearInterval(interval);
  });
  typingSessions.clear();
};

export default autotypingCommand;