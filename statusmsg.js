import config from '../config.cjs';

// Main command function
const anticallCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  
  // Only valid command is 'setstatusmsg'
  if (cmd === 'setstatusmsg') {
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
    
    let responseMessage;

    if (text) {
      config.STATUS_READ_MSG = text; // Set custom reply message
      responseMessage = `Custom reply message has been set to: "${text}"`;
    } else {
      responseMessage = `Usage: *${prefix}setstatusmsg <message>* to set a custom reply message.`;
    }

    try {
      await Matrix.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

export default anticallCommand;