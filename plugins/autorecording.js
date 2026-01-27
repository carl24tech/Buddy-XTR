import config from '../config.cjs';

const autorecordingCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === 'autorecording') {
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
    let responseMessage;

    if (text === 'on') {
      config.AUTO_RECORDING = true;
      responseMessage = "Auto-Recording has been enabled.";
      
      // Update presence to "recording audio"
      try {
        // Method 1: Using presence update (most common in WhatsApp libraries)
        await Matrix.sendPresenceUpdate('recording', m.from);
        
        // Method 2: Alternative if the above doesn't work
        // await Matrix.updatePresence(m.from, 'recording');
        
        // Method 3: Some libraries use different syntax
        // await Matrix.presenceSubscribe(m.from);
        // await Matrix.sendPresenceUpdate('recording', m.from);
        
        console.log("Presence updated to 'recording audio'");
      } catch (presenceError) {
        console.error("Error updating presence:", presenceError);
      }
      
    } else if (text === 'off') {
      config.AUTO_RECORDING = false;
      responseMessage = "Auto-Recording has been disabled.";
      
      // Reset presence to available
      try {
        await Matrix.sendPresenceUpdate('available', m.from);
        console.log("Presence reset to 'available'");
      } catch (presenceError) {
        console.error("Error resetting presence:", presenceError);
      }
      
    } else {
      responseMessage = "Usage:\n- `autorecording on`: Enable Auto-Recording (shows 'recording audio' status)\n- `autorecording off`: Disable Auto-Recording";
    }

    try {
      await Matrix.sendMessage(m.from, { text: responseMessage }, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

// Alternative implementation with more robust presence handling
const updateRecordingPresence = async (Matrix, chatId, isRecording) => {
  try {
    if (isRecording) {
      // For latest WhatsApp Web versions
      await Matrix.sendPresenceUpdate('recording', chatId);
      
      // Some implementations require sending an empty audio
      // Uncomment if presence alone doesn't work
      /*
      await Matrix.sendMessage(chatId, {
        audio: Buffer.alloc(0), // Empty audio
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      });
      */
    } else {
      await Matrix.sendPresenceUpdate('available', chatId);
    }
    return true;
  } catch (error) {
    console.error('Presence update failed:', error);
    
    // Fallback method
    try {
      // Try alternative method names
      if (typeof Matrix.updatePresence === 'function') {
        await Matrix.updatePresence(chatId, isRecording ? 'recording' : 'available');
      } else if (typeof Matrix.presenceUpdate === 'function') {
        await Matrix.presenceUpdate(chatId, isRecording ? 'recording' : 'available');
      }
    } catch (fallbackError) {
      console.error('Fallback presence update also failed:', fallbackError);
    }
    return false;
  }
};

export default autorecordingCommand;
