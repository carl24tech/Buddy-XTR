import config from '../config.cjs';

const tagAll = async (m, gss) => {
  try {
    // Ensure the function is async
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    
    // Check for the valid command
    const validCommands = ['tagall'];
    if (!validCommands.includes(cmd)) return;

    // Check if the message is from a group
    if (!m.isGroup) {
      // Send error message if used in private chat
      return m.reply("*📛 THIS IS A GROUP ONLY COMMAND*\n\nPlease use this command only in group chats.");
    }

    // Get group metadata
    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    const botAdmin = participants.find(p => p.id === botNumber)?.admin;
    const senderAdmin = participants.find(p => p.id === m.sender)?.admin;
    
    // Admin checks
    if (!botAdmin) return m.reply("*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*");
    if (!senderAdmin) return m.reply("*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*");
    
    // Extract the message to be sent
    const userMessage = m.body.slice(prefix.length + cmd.length).trim();
    let message = `乂 *ATTENTION EVERYONE* 乂\n\n`;
    
    // Add custom message if provided
    if (userMessage) {
      message += `*Message:* ${userMessage}\n\n`;
    }
    
    // Add participants list
    message += `*Participants:*\n\n`;
    
    // Add all participants with mention tags
    for (let participant of participants) {
      message += `❒ @${participant.id.split('@')[0]}\n`;
    }

    // Send the message with mentions
    await gss.sendMessage(
      m.from, 
      { 
        text: message, 
        mentions: participants.map(a => a.id) 
      }, 
      { quoted: m }
    );
    
  } catch (error) {
    console.error('Error:', error);
    await m.reply('An error occurred while processing the command.');
  }
};

export default tagAll;