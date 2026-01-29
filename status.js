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
        const text = quotedMessage.extendedTextMessage?.text || quotedMessage.conversation || '';
        if (text) {
          await gss.sendMessage(m.from, {
            text: `📝 Status Text:\n\n${text}\n\n_Sent from status reply_`,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 9999,
              isForwarded: true,
            },
          });
          return;
        }
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
      
      // If media was found, send it back
      if (mediaBuffer) {
        const mediaOptions = {
          caption: caption ? `${caption}\n\n_Sent from status reply_` : '_Sent from status reply_',
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 9999,
            isForwarded: true,
          },
        };
        
        if (messageType === 'image') {
          await gss.sendMessage(m.from, {
            image: mediaBuffer,
            ...mediaOptions
          });
        } else if (messageType === 'video') {
          await gss.sendMessage(m.from, {
            video: mediaBuffer,
            ...mediaOptions
          });
        }
      } else {
        // Send error message if no media found
        await gss.sendMessage(m.from, {
          text: "❌ Couldn't retrieve the status. Make sure you're replying to a valid status with media or text.",
          contextInfo: {
            mentionedJid: [m.sender]
          }
        });
      }
    } else {
      // Handle non-reply messages (direct status commands)
      await gss.sendMessage(m.from, {
        text: "📱 Please reply to a status message with one of the trigger words to save it.\n\nTrigger words: send, take, upload, status, etc.",
        contextInfo: {
          mentionedJid: [m.sender]
        }
      });
    }
  } catch (error) {
    console.error('Error in handleStatusRequest:', error);
    try {
      await gss.sendMessage(m.from, {
        text: "❌ An error occurred while processing your request. Please try again.",
        contextInfo: {
          mentionedJid: [m.sender]
        }
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
};

export default handleStatusRequest;