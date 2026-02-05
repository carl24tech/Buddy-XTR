import config from '../config.cjs';

const setGroupName = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();

    const validCommands = ['setgroupname', 'setname', 'setgname'];

    if (!validCommands.includes(cmd)) return;

    if (!m.isGroup) return m.reply("*📛 THIS COMMAND CAN ONLY BE USED IN GROUPS*");
    
    // Check if it's a broadcast list (not a real group)
    if (m.from.endsWith('@broadcast')) return m.reply("*📛 THIS COMMAND DOESN'T WORK IN BROADCAST LISTS*");

    const groupMetadata = await gss.groupMetadata(m.from);
    const participants = groupMetadata.participants;
    
    // Get bot and sender participant info
    const botParticipant = participants.find(p => p.id === botNumber);
    const senderParticipant = participants.find(p => p.id === m.sender);
    
    // Check if bot is admin - using different property names based on WhatsApp version
    const botAdmin = botParticipant?.admin || 
                    botParticipant?.isAdmin || 
                    botParticipant?.admin !== false; // Some libraries use different property names
    
    // Check if sender is admin
    const senderAdmin = senderParticipant?.admin || 
                       senderParticipant?.isAdmin || 
                       senderParticipant?.admin !== false;

    if (!botAdmin) return m.reply("*📛 BOT MUST BE AN ADMIN TO USE THIS COMMAND*\n*Please promote me to admin first!*");
    if (!senderAdmin) return m.reply("*📛 YOU MUST BE AN ADMIN TO USE THIS COMMAND*");

    if (!text) return m.reply("*📛 PLEASE PROVIDE A NAME TO SET*\n*Example:* " + prefix + cmd + " My New Group Name");

    // Check text length limits (WhatsApp group name limits)
    if (text.length > 100) return m.reply("*📛 GROUP NAME TOO LONG*\n*Maximum 100 characters allowed*");
    if (text.length < 1) return m.reply("*📛 GROUP NAME CANNOT BE EMPTY*");

    // Additional check - ensure bot has permission to change group info
    try {
      // Try to get group settings to verify permissions
      const groupInfo = await gss.groupMetadata(m.from);
      if (groupInfo.restrict) {
        // If group is restricted, only admins can change settings
        if (!senderAdmin) {
          return m.reply("*📛 GROUP SETTINGS ARE RESTRICTED*\n*Only admins can change group name in restricted mode*");
        }
      }
    } catch (error) {
      console.log('Group info check error:', error);
      // Continue anyway
    }

    // Attempt to change group name with error handling
    await gss.groupUpdateSubject(m.from, text)
      .then(() => {
        m.reply(`✅ *Group Name Successfully Updated*\n*New Name:* ${text}`);
      })
      .catch(async (error) => {
        console.error('Group update error:', error);
        
        // Check for specific error messages
        if (error.message?.includes('not admin') || error.message?.includes('permission')) {
          // Double-check admin status
          const updatedMetadata = await gss.groupMetadata(m.from);
          const updatedParticipants = updatedMetadata.participants;
          const updatedBotParticipant = updatedParticipants.find(p => p.id === botNumber);
          const updatedBotAdmin = updatedBotParticipant?.admin || updatedBotParticipant?.isAdmin;
          
          if (!updatedBotAdmin) {
            return m.reply("*📛 BOT ADMIN PERMISSION LOST*\n*I was demoted from admin. Please promote me again!*");
          }
          
          return m.reply("*📛 PERMISSION DENIED*\n*Make sure I have 'Edit Group Info' permission enabled*");
        }
        
        if (error.message?.includes('too frequent')) {
          return m.reply("*📛 TOO MANY CHANGES*\n*Please wait a few minutes before changing the group name again*");
        }
        
        if (error.message?.includes('invalid') || error.message?.includes('characters')) {
          return m.reply("*📛 INVALID GROUP NAME*\n*The name contains invalid characters. Try a different name.*");
        }
        
        throw error; // Re-throw for general error handler
      });

  } catch (error) {
    console.error('Error in setGroupName:', error);
    
    // More specific error messages
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return m.reply("*📛 UNAUTHORIZED*\n*Bot authentication failed. Please restart the bot.*");
    }
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return m.reply("*📛 GROUP NOT FOUND*\n*I might have been removed from this group.*");
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return m.reply("*📛 RATE LIMITED*\n*Too many requests. Please try again later.*");
    }
    
    m.reply('*❌ AN ERROR OCCURRED*\n*Failed to update group name. Please try again.*');
  }
};

export default setGroupName;
