import config from '../config.cjs';

const blockCommand = async (m, gss) => {
  try {
    const botNumber = await gss.decodeJid(gss.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();
    
    const validCommands = ['block', 'unblock', 'blocklist'];
    
    if (!validCommands.includes(cmd)) return;
    
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");

    // Function to validate and format phone number
    const formatPhoneNumber = (input) => {
      if (!input) return null;
      
      // Remove all non-digits
      let number = input.replace(/[^0-9]/g, '');
      
      // If number starts with '0', replace with country code
      if (number.startsWith('0')) {
        number = '254' + number.substring(1);
      }
      
      // If number doesn't have country code, add it (assuming Kenya/254)
      if (number.length === 9 && !number.startsWith('254')) {
        number = '254' + number;
      }
      
      // Ensure the number is properly formatted
      if (number.length >= 9 && number.length <= 15) {
        return number + '@s.whatsapp.net';
      }
      
      return null;
    };

    // Function to get user from input
    const getTargetUsers = () => {
      let users = [];
      
      // Get from mentioned users
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        users = [...m.mentionedJid];
      }
      // Get from quoted message
      else if (m.quoted && m.quoted.sender) {
        users = [m.quoted.sender];
      }
      // Get from text input (phone number)
      else if (text && text.match(/^[0-9+]/)) {
        const formattedJid = formatPhoneNumber(text);
        if (formattedJid) {
          users = [formattedJid];
        }
      }
      
      return users.filter(jid => 
        jid !== botNumber && 
        jid !== config.OWNER_NUMBER + '@s.whatsapp.net'
      );
    };

    switch (cmd) {
      case 'block': {
        const targetUsers = getTargetUsers();
        
        if (targetUsers.length === 0) {
          const helpMessage = `*🚫 BLOCK COMMAND*\n\n` +
                            `*Usage:*\n` +
                            `• \`${prefix}block @user\` - Block mentioned user\n` +
                            `• \`${prefix}block 254768908\` - Block by number\n` +
                            `• Reply to message with \`${prefix}block\`\n\n` +
                            `*Note:* Cannot block bot owner (${config.OWNER_NUMBER})`;
          return m.reply(helpMessage);
        }
        
        const results = [];
        for (const user of targetUsers) {
          try {
            await gss.updateBlockStatus(user, 'block');
            const phoneNumber = user.split('@')[0];
            results.push(`✅ Blocked: ${phoneNumber}`);
          } catch (error) {
            const phoneNumber = user.split('@')[0];
            results.push(`❌ Failed to block ${phoneNumber}: ${error.message || error}`);
          }
        }
        
        const responseMessage = results.length === 1 
          ? results[0] 
          : `*Block Results:*\n${results.join('\n')}`;
        
        m.reply(responseMessage);
        break;
      }
      
      case 'unblock': {
        const targetUsers = getTargetUsers();
        
        if (targetUsers.length === 0) {
          return m.reply(`*Usage:*\n\`${prefix}unblock 254768908\`\nor mention/reply to user`);
        }
        
        const results = [];
        for (const user of targetUsers) {
          try {
            await gss.updateBlockStatus(user, 'unblock');
            const phoneNumber = user.split('@')[0];
            results.push(`✅ Unblocked: ${phoneNumber}`);
          } catch (error) {
            const phoneNumber = user.split('@')[0];
            results.push(`❌ Failed to unblock ${phoneNumber}: ${error.message || error}`);
          }
        }
        
        m.reply(results.join('\n'));
        break;
      }
      
      case 'blocklist':
      case 'blocked': {
        // Note: WhatsApp Web/Desktop API doesn't have a direct way to get block list
        // You might need to store blocked users in a database
        m.reply("⚠️ *Block list feature requires database storage*\n\n" +
                "Currently, WhatsApp API doesn't provide a way to retrieve blocked contacts list.\n" +
                "Consider implementing a database to track blocked users.");
        break;
      }
      
      default:
        const helpMessage = `*🚫 BLOCK MANAGEMENT*\n\n` +
                          `*Commands:*\n` +
                          `• \`${prefix}block @user\` - Block user\n` +
                          `• \`${prefix}block 254768908\` - Block by number\n` +
                          `• \`${prefix}unblock 254768908\` - Unblock user\n` +
                          `• \`${prefix}blocklist\` - Show blocked users (if implemented)\n\n` +
                          `*Usage Examples:*\n` +
                          `1. Reply to spam: \`${prefix}block\`\n` +
                          `2. Block multiple: \`${prefix}block @user1 @user2\`\n` +
                          `3. By number: \`${prefix}block 254768908\`\n` +
                          `4. Local number: \`${prefix}block 0768908\`\n\n` +
                          `*Note:* Country code 254 (Kenya) is auto-added if missing.`;
        m.reply(helpMessage);
        break;
    }
    
  } catch (error) {
    console.error('Error in block command:', error);
    m.reply('❌ Error: ' + (error.message || 'Failed to process command'));
  }
};

export default blockCommand;