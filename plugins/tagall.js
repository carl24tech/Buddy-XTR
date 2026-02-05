import config from '../config.cjs';

const tagAll = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || '';
    
    // Check if message starts with prefix
    if (!body.startsWith(prefix)) return;
    
    const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();
    const text = body.slice(prefix.length + cmd.length).trim();
    
    // Check for the valid command
    const validCommands = ['tagall', 'everyone', 'mentionall'];
    if (!validCommands.includes(cmd)) return;

    // Check if the message is from a group
    if (!m.isGroup) {
      return await m.reply("*📛 THIS IS A GROUP ONLY COMMAND*\n\nPlease use this command only in group chats.");
    }

    // Get group metadata with better error handling
    let groupMetadata;
    try {
      groupMetadata = await gss.groupMetadata(m.from);
    } catch (error) {
      console.error('Error fetching group metadata:', error);
      return await m.reply("*❌ Unable to fetch group information. Please try again.*");
    }
    
    const participants = groupMetadata.participants || [];
    
    // Get bot's JID properly
    const botNumber = gss.user.id.split(':')[0] + '@s.whatsapp.net';
    const botNumber2 = gss.user.id.split(':')[0] + '@c.us';
    
    // Find bot and sender in participants
    const botParticipant = participants.find(p => 
      p.id === botNumber || p.id === botNumber2 || p.id.includes(gss.user.id.split(':')[0])
    );
    
    const senderParticipant = participants.find(p => 
      p.id === m.sender || p.id === m.sender.split(':')[0] + '@s.whatsapp.net'
    );
    
    // Admin checks - more robust
    if (!botParticipant) {
      return await m.reply("*❌ Bot is not a member of this group.*");
    }
    
    const botAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin' || botParticipant.admin === true;
    const senderAdmin = senderParticipant && (senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin' || senderParticipant.admin === true);
    
    if (!botAdmin) {
      return await m.reply("*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*\n\nPlease make the bot an admin first.");
    }
    
    if (!senderAdmin) {
      return await m.reply("*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*");
    }

    // Check if group is too large (WhatsApp has limits)
    if (participants.length > 256) {
      return await m.reply(`*⚠️ GROUP TOO LARGE*\n\nThis group has ${participants.length} members. WhatsApp limits mentions to smaller groups.`);
    }

    // Extract the message to be sent
    const userMessage = text;
    let message = `乂 *ATTENTION EVERYONE* 乂\n\n`;
    
    // Add custom message if provided
    if (userMessage) {
      message += `*📢 Announcement:* ${userMessage}\n\n`;
    } else {
      message += `*📢 Announcement:* Admin wants everyone's attention!\n\n`;
    }
    
    // Add participants list
    message += `*👥 Participants (${participants.length}):*\n`;
    
    // Add all participants with mention tags
    // Only include first 100 participants to avoid message being too long
    const maxParticipants = 100;
    const participantsToShow = participants.slice(0, maxParticipants);
    
    for (let i = 0; i < participantsToShow.length; i++) {
      const participant = participantsToShow[i];
      const number = participant.id.split('@')[0];
      message += `${i + 1}. @${number}\n`;
    }
    
    if (participants.length > maxParticipants) {
      message += `\n*...and ${participants.length - maxParticipants} more members*`;
    }
    
    message += `\n────────────────────\n`;
    message += `📅 *Date:* ${new Date().toLocaleDateString()}\n`;
    message += `⏰ *Time:* ${new Date().toLocaleTimeString()}\n`;
    message += `👑 *Called by:* @${m.sender.split('@')[0]}`;

    // Send the message with mentions
    const mentionIds = participantsToShow.map(p => p.id);
    // Also mention the sender
    mentionIds.push(m.sender);
    
    await gss.sendMessage(
      m.from, 
      { 
        text: message, 
        mentions: mentionIds
      }, 
      { 
        quoted: m 
      }
    );
    
  } catch (error) {
    console.error('Error in tagAll command:', error);
    
    // Send more specific error messages
    if (error.message && error.message.includes('not authorized')) {
      await m.reply('*❌ Permission denied. Make sure the bot has admin permissions.*');
    } else if (error.message && error.message.includes('mentioned too many people')) {
      await m.reply('*⚠️ Too many mentions! WhatsApp has limits on how many people can be mentioned at once.*');
    } else {
      await m.reply('*❌ An error occurred while processing the command. Please try again.*');
    }
  }
};

export default tagAll;
