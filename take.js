import fs from 'fs-extra';
import config from '../config.cjs';

// Store pack info per user to avoid global pollution
const userPackInfo = new Map();

const handleTakeCommand = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || '';
  
  // Check if command starts with prefix
  if (!body.startsWith(prefix)) return;
  
  const args = body.slice(prefix.length).trim().split(/\s+/);
  const cmd = args[0].toLowerCase();
  
  if (cmd !== 'take') return;

  // Get the rest of the message (excluding command)
  const text = body.slice(prefix.length + cmd.length).trim();

  if (!text) {
    return m.reply(`Usage: ${prefix}take packname|author\nExample: ${prefix}take MyPack|MyName`);
  }

  // Split text into packname and author
  const parts = text.split('|').map(part => part.trim());
  
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return m.reply(`Invalid format. Usage: ${prefix}take packname|author\nExample: ${prefix}take MyPack|MyName`);
  }

  const [packname, author] = parts;
  
  // Validate packname and author length
  if (packname.length > 30) {
    return m.reply('Packname is too long (max 30 characters)');
  }
  
  if (author.length > 30) {
    return m.reply('Author name is too long (max 30 characters)');
  }

  const quoted = m.quoted || {};
  const validMediaTypes = ['imageMessage', 'videoMessage', 'stickerMessage'];
  
  if (!quoted || !validMediaTypes.includes(quoted.mtype)) {
    return m.reply(`Please reply to an image, video, or sticker with:\n${prefix}take packname|author`);
  }

  try {
    // Download the media
    const mediaBuffer = await quoted.download();
    
    if (!mediaBuffer || mediaBuffer.length === 0) {
      throw new Error('Failed to download media or media is empty');
    }

    // Check if it's actually a sticker (optional optimization)
    const isSticker = quoted.mtype === 'stickerMessage';
    
    // Send as sticker
    await gss.sendImageAsSticker(m.from, mediaBuffer, m, {
      packname: packname,
      author: author,
      categories: isSticker ? quoted.categories || [''] : ['']
    });
    
    // Store pack info for this user (optional, for future use)
    const userId = m.from;
    userPackInfo.set(userId, { packname, author, timestamp: Date.now() });
    
    // Clean up old entries (optional maintenance)
    cleanupOldEntries();
    
    m.reply(`✅ Sticker created successfully!\n📦 Pack: ${packname}\n👤 Author: ${author}`);
    
  } catch (error) {
    console.error('Error creating sticker:', error);
    
    let errorMessage = 'Failed to create sticker. ';
    
    if (error.message.includes('download')) {
      errorMessage += 'Could not download the media.';
    } else if (error.message.includes('convert')) {
      errorMessage += 'Failed to convert media to sticker.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Operation timed out. Please try again.';
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    m.reply(errorMessage);
  }
};

// Optional: Clean up old entries from userPackInfo map
function cleanupOldEntries(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const now = Date.now();
  for (const [userId, info] of userPackInfo.entries()) {
    if (now - info.timestamp > maxAge) {
      userPackInfo.delete(userId);
    }
  }
}

// Optional: Get pack info for a user
export function getUserPackInfo(userId) {
  return userPackInfo.get(userId);
}

// Optional: Clear pack info for a user
export function clearUserPackInfo(userId) {
  return userPackInfo.delete(userId);
}

export default handleTakeCommand;