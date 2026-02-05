import config from '../config.cjs';

const gcEvent = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'welcome') {
    // Group-only command check
    if (!m.isGroup) return m.reply("*📛 THIS COMMAND CAN ONLY BE USED IN GROUPS*");

    try {
      // Get updated group metadata
      const groupMetadata = await Matrix.groupMetadata(m.from);
      const participants = groupMetadata.participants;
      
      // Get bot and sender info
      const botNumber = await Matrix.decodeJid(Matrix.user.id);
      const botAdmin = participants.find(p => p.id === botNumber)?.admin || participants.find(p => p.id === botNumber)?.isAdmin;
      const senderAdmin = participants.find(p => p.id === m.sender)?.admin || participants.find(p => p.id === m.sender)?.isAdmin;

      // Permission checks
      if (!botAdmin) return m.reply("*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*");
      if (!senderAdmin) return m.reply("*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*");

      let responseMessage;

      // Handle command options
      if (text === 'on') {
        config.WELCOME = true;
        responseMessage = "✅ *WELCOME & GOODBYE MESSAGES ENABLED*\nThe bot will now send welcome messages when new members join and goodbye messages when members leave.";
      } else if (text === 'off') {
        config.WELCOME = false;
        responseMessage = "❌ *WELCOME & GOODBYE MESSAGES DISABLED*\nThe bot will no longer send welcome or goodbye messages.";
      } else {
        // Show usage information
        responseMessage = `📋 *WELCOME COMMAND USAGE*

*Enable:* ${prefix}welcome on
*Disable:* ${prefix}welcome off

*Current Status:* ${config.WELCOME ? '✅ Enabled' : '❌ Disabled'}

*Requirements:*
• Command must be used in a group
• Both you and the bot must be admins
• Bot needs message sending permissions`;
      }

      // Send response with proper formatting
      await Matrix.sendMessage(m.from, { 
        text: responseMessage,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 0,
          isForwarded: false
        }
      }, { quoted: m });

    } catch (error) {
      console.error("Error processing welcome command:", error);
      
      // Better error messages
      let errorMessage = "❌ *ERROR PROCESSING COMMAND*";
      if (error.message.includes("not authorized") || error.message.includes("401")) {
        errorMessage += "\n\n*Possible reasons:*\n• Bot is not an admin\n• Bot doesn't have permission to view group info\n• Group link has changed";
      } else if (error.message.includes("403")) {
        errorMessage += "\n\n*The bot has been removed from admin position*";
      } else if (error.message.includes("404")) {
        errorMessage += "\n\n*Group not found or bot is not in the group*";
      }
      
      await Matrix.sendMessage(m.from, { 
        text: errorMessage 
      }, { quoted: m });
    }
  }
};

export default gcEvent;
