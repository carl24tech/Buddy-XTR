import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handleStatusRequest = async (m, gss) => {
  try {
    const textLower = m.body.toLowerCase();
    
    // Improved trigger words with better matching
    const triggerWords = [
      'send', 'statusdown', 'take', 'sent', 'giv', 'gib', 'upload',
      'send me', 'sent me', 'znt', 'snt', 'ayak', 'do', 'mee', 'status'
    ];

    // Check if message contains any trigger word
    const hasTriggerWord = triggerWords.some(word => textLower.includes(word));
    
    if (!hasTriggerWord) return;

    // Check if it's a reply to a status message
    if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
      const contextInfo = m.message.extendedTextMessage.contextInfo;
      const quotedMessage = contextInfo.quotedMessage;
      const isFromStatus = contextInfo.remoteJid === 'status@broadcast';
      
      if (!quotedMessage) return;
      
      let mediaBuffer;
      let messageType;
      let caption = '';
      let statusText = '';
      
      // Check for image status
      if (quotedMessage.imageMessage) {
        mediaBuffer = await gss.downloadMediaMessage(quotedMessage.imageMessage);
        messageType = 'image';
        caption = quotedMessage.imageMessage.caption || '';
      }
      // Check for video status
      else if (quotedMessage.videoMessage) {
        mediaBuffer = await gss.downloadMediaMessage(quotedMessage.videoMessage);
        messageType = 'video';
        caption = quotedMessage.videoMessage.caption || '';
      }
      // Check for text status (just caption/text)
      else if (quotedMessage.extendedTextMessage || quotedMessage.conversation) {
        statusText = quotedMessage.extendedTextMessage?.text || quotedMessage.conversation || '';
      }
      else {
        // Check for view-once media
        if (quotedMessage.viewOnceMessage) {
          const viewOnceContent = quotedMessage.viewOnceMessage.message;
          if (viewOnceContent.imageMessage) {
            mediaBuffer = await gss.downloadMediaMessage(viewOnceContent.imageMessage);
            messageType = 'image';
            caption = viewOnceContent.imageMessage.caption || '';
          } else if (viewOnceContent.videoMessage) {
            mediaBuffer = await gss.downloadMediaMessage(viewOnceContent.videoMessage);
            messageType = 'video';
            caption = viewOnceContent.videoMessage.caption || '';
          }
        }
      }
      
      // Get sender info
      const senderName = m.pushName || 'Unknown User';
      const senderNumber = m.sender.split('@')[0];
      const groupName = m.from.endsWith('@g.us') ? await getGroupName(gss, m.from) : 'Private Chat';
      const isGroup = m.from.endsWith('@g.us');
      
      // Prepare owner message with request details
      const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
      
      // Send ALL replies to bot owner instead of public chat
      if (mediaBuffer) {
        const ownerMessage = `📱 *Status Request Received*\n\n` +
                           `👤 *From:* ${senderName}\n` +
                           `📞 *Number:* ${senderNumber}\n` +
                           `📍 *Location:* ${groupName}\n` +
                           `⏰ *Time:* ${new Date().toLocaleString()}\n` +
                           (caption ? `📝 *Caption:* ${caption}\n\n` : '\n') +
                           `*Content below was requested by the user:*`;
        
        const mediaOptions = {
          caption: caption ? `${ownerMessage}\n\n${caption}` : ownerMessage,
        };
        
        if (messageType === 'image') {
          await gss.sendMessage(ownerJid, {
            image: mediaBuffer,
            ...mediaOptions
          });
        } else if (messageType === 'video') {
          await gss.sendMessage(ownerJid, {
            video: mediaBuffer,
            ...mediaOptions
          });
        }
        
        // Send notification to user that it went to owner
        const userMsg = isGroup ? 
          "✅ Your status request has been sent to the bot owner's DM (private message)." :
          "✅ Your status request has been sent to the bot owner.";
        await gss.sendMessage(m.from, {
          text: userMsg,
          contextInfo: {
            mentionedJid: [m.sender]
          }
        });
        
      } else if (statusText) {
        const ownerMessage = `📱 *Status Request Received*\n\n` +
                           `👤 *From:* ${senderName}\n` +
                           `📞 *Number:* ${senderNumber}\n` +
                           `📍 *Location:* ${groupName}\n` +
                           `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                           `*Requested Status Text:*\n${statusText}`;
        
        await gss.sendMessage(ownerJid, {
          text: ownerMessage,
        });
        
        // Send notification to user
        const userMsg = isGroup ? 
          "✅ Your status text request has been sent to the bot owner's DM." :
          "✅ Your status text request has been sent to the bot owner.";
        await gss.sendMessage(m.from, {
          text: userMsg,
          contextInfo: {
            mentionedJid: [m.sender]
          }
        });
      } else {
        // Send error to owner instead of user
        const ownerMessage = `📱 *Failed Status Request*\n\n` +
                           `👤 *From:* ${senderName}\n` +
                           `📞 *Number:* ${senderNumber}\n` +
                           `📍 *Location:* ${groupName}\n` +
                           `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                           `❌ Could not extract media or text from the status.`;
        
        await gss.sendMessage(ownerJid, {
          text: ownerMessage,
        });
        
        // Still notify user
        await gss.sendMessage(m.from, {
          text: "❌ Couldn't retrieve the status. The bot owner has been notified.",
          contextInfo: {
            mentionedJid: [m.sender]
          }
        });
      }
    } else {
      // Handle non-reply messages - send to owner too
      const senderName = m.pushName || 'Unknown User';
      const senderNumber = m.sender.split('@')[0];
      const groupName = m.from.endsWith('@g.us') ? await getGroupName(gss, m.from) : 'Private Chat';
      const isGroup = m.from.endsWith('@g.us');
      
      const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
      const ownerMessage = `📱 *Invalid Status Request*\n\n` +
                         `👤 *From:* ${senderName}\n` +
                         `📞 *Number:* ${senderNumber}\n` +
                         `📍 *Location:* ${groupName}\n` +
                         `⏰ *Time:* ${new Date().toLocaleString()}\n\n` +
                         `⚠️ User tried to use status command without replying to a status.\n` +
                         `📝 *Message:* ${m.body}`;
      
      await gss.sendMessage(ownerJid, {
        text: ownerMessage,
      });
      
      // Send help message to user
      const userMsg = "📱 Please reply to a status message with one of the trigger words to save it.\n\nTrigger words: send, take, upload, status, etc.\n\n*Note:* All status requests are sent privately to the bot owner.";
      await gss.sendMessage(m.from, {
        text: userMsg,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      });
    }
  } catch (error) {
    console.error('Error in handleStatusRequest:', error);
    
    // Send error to owner
    try {
      const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
      const errorMessage = `❌ *Error in Status Request*\n\n` +
                         `⏰ *Time:* ${new Date().toLocaleString()}\n` +
                         `📝 *Error:* ${error.message}\n` +
                         `📍 *From:* ${m.from}`;
      
      await gss.sendMessage(ownerJid, {
        text: errorMessage,
      });
    } catch (ownerError) {
      console.error('Failed to send error to owner:', ownerError);
    }
    
    // Send generic error to user
    try {
      await gss.sendMessage(m.from, {
        text: "❌ An error occurred while processing your request. The bot owner has been notified.",
        contextInfo: {
          mentionedJid: [m.sender]
        }
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
};

// Helper function to get group name
async function getGroupName(gss, groupJid) {
  try {
    const groupMetadata = await gss.groupMetadata(groupJid);
    return groupMetadata.subject || 'Group';
  } catch (error) {
    return 'Group';
  }
}

export default handleStatusRequest;
