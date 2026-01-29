import config from '../config.cjs';

// Store reported messages outside the function to persist across calls
const reportedMessages = new Set();

const report = async (m, gss) => {
  try {
    // Validate inputs
    if (!m || !m.body || !gss) {
      console.error('Invalid parameters passed to report function');
      return;
    }

    const prefix = config.PREFIX || '!'; // Default prefix if not in config
    const devNumbers = config.OWNERS || ['254740271632@s.whatsapp.net']; // Get from config or use default
    
    if (!m.body.startsWith(prefix)) return;
    
    const args = m.body.slice(prefix.length).trim().split(/\s+/);
    const cmd = args[0]?.toLowerCase() || '';
    const text = args.slice(1).join(' ').trim();

    const validCommands = ['bug', 'report', 'request'];
    
    if (!validCommands.includes(cmd)) return;
    
    if (!text) {
      return m.reply(`Example: ${prefix + cmd} hi dev, play command is not working`);
    }

    const messageId = m.key?.id;
    
    if (messageId && reportedMessages.has(messageId)) {
      return m.reply("This report has already been forwarded. Please wait for a response.");
    }

    if (messageId) {
      reportedMessages.add(messageId);
    }

    const userName = m.pushName || m.sender.split('@')[0] || 'User';
    const senderId = m.sender.split('@')[0];
    
    const reportText = `*| REQUEST/BUG REPORT |*\n\n` +
                      `*User*: @${senderId}\n` +
                      `*Name*: ${userName}\n` +
                      `*Report*: ${text}`;

    // Send to all owners in the config
    for (const owner of devNumbers) {
      try {
        await gss.sendMessage(
          owner.includes('@') ? owner : `${owner}@s.whatsapp.net`,
          {
            text: reportText,
            mentions: [m.sender]
          },
          { quoted: m }
        );
      } catch (sendError) {
        console.error(`Failed to send report to ${owner}:`, sendError);
      }
    }

    // Send confirmation to user
    await m.reply(
      "Thank you for your report. It has been forwarded to the owner. Please wait for a response.\n\n" +
      "Note: Reports are stored to prevent duplicates."
    );

  } catch (error) {
    console.error('Error in report command:', error);
    
    // Try to notify user of error
    try {
      await m.reply('An error occurred while processing your report. Please try again later.');
    } catch (e) {
      console.error('Could not send error message to user:', e);
    }
  }
};

export default report;