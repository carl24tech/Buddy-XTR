import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const MAX_FILE_SIZE_MB = 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

async function uploadMedia(buffer) {
  try {
    // Validate buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided');
    }

    // Check file size
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }

    // Detect file type
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) {
      throw new Error('Could not determine file type');
    }

    const { ext, mime } = fileType;
    
    // Validate allowed file types (Catbox accepts most types)
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
      'audio/mp4', 'audio/aac', 'audio/flac'
    ];
    
    if (!allowedMimes.includes(mime)) {
      throw new Error(`Unsupported file type: ${mime}`);
    }

    const bodyForm = new FormData();
    // Use correct field name for Catbox API
    bodyForm.append('fileToUpload', buffer, `file.${ext}`);
    bodyForm.append('reqtype', 'fileupload');
    
    // Add optional userhash if needed (if you have a Catbox account)
    // bodyForm.append('userhash', 'YOUR_USERHASH');

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: bodyForm,
      headers: {
        ...bodyForm.getHeaders()
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    const data = await res.text();
    
    // Validate response
    if (!data || data.includes('<!DOCTYPE') || data.includes('Error:')) {
      throw new Error(`Invalid response from server: ${data.substring(0, 100)}`);
    }

    // Check if it's a valid URL
    if (!data.startsWith('http')) {
      throw new Error(`Unexpected response format: ${data}`);
    }

    return data.trim();
  } catch (error) {
    console.error('Error during media upload:', error);
    throw new Error(`Failed to upload media: ${error.message}`);
  }
}

const tourl = async (m, bot) => {
  try {
    const prefixMatch = m.body.match(/^[\\/!#.]/);
    const prefix = prefixMatch ? prefixMatch[0] : '/';
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const validCommands = ['tourl', 'geturl', 'upload', 'url'];

    if (!validCommands.includes(cmd)) return;

    // Check if quoted message exists and has media
    if (!m.quoted) {
      return m.reply(`Please reply to an image, video, or audio message with *${prefix + cmd}*`);
    }

    // Expand media type check
    const supportedMediaTypes = [
      'imageMessage', 'videoMessage', 'audioMessage',
      'stickerMessage', 'documentMessage'
    ];

    if (!supportedMediaTypes.includes(m.quoted.mtype)) {
      return m.reply(`Unsupported media type. Please send/reply to an image, video, or audio file.\n*${prefix + cmd}*`);
    }

    // Check if media can be downloaded
    if (!m.quoted.download || typeof m.quoted.download !== 'function') {
      return m.reply('Cannot download this media. The message might have expired or been deleted.');
    }

    const tempDir = tmpdir();
    const tempFile = join(tempDir, `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    try {
      // Show loading message
      const loadingMessages = [
        "*「▰▰▰▱▱▱▱▱▱▱」 Uploading...*",
        "*「▰▰▰▰▱▱▱▱▱▱」 Uploading...*",
        "*「▰▰▰▰▰▱▱▱▱▱」 Uploading...*",
        "*「▰▰▰▰▰▰▱▱▱▱」 Uploading...*",
        "*「▰▰▰▰▰▰▰▱▱▱」 Uploading...*",
        "*「▰▰▰▰▰▰▰▰▱▱」 Uploading...*",
        "*「▰▰▰▰▰▰▰▰▰▱」 Uploading...*",
        "*「▰▰▰▰▰▰▰▰▰▰」 Uploading...*",
      ];

      let loadingMessage = await bot.sendMessage(m.from, { text: loadingMessages[0] }, { quoted: m });
      let messageId = loadingMessage.key.id;
      let currentIndex = 0;

      const updateInterval = setInterval(async () => {
        currentIndex = (currentIndex + 1) % loadingMessages.length;
        try {
          await bot.sendMessage(m.from, 
            { text: loadingMessages[currentIndex] }, 
            { quoted: m, edit: messageId }
          );
        } catch (updateError) {
          // Ignore edit errors, continue with upload
        }
      }, 500);

      // Download media
      const mediaBuffer = await m.quoted.download();
      if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
        throw new Error('Failed to download media or invalid media data.');
      }

      // Save to temp file for debugging if needed
      await fs.writeFile(tempFile, mediaBuffer);

      // Check file size
      const fileSizeMB = mediaBuffer.length / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
      }

      // Upload to Catbox
      const mediaUrl = await uploadMedia(mediaBuffer);

      clearInterval(updateInterval);
      
      // Send completion message
      await bot.sendMessage(m.from, 
        { text: '✅ Upload complete!' }, 
        { quoted: m, edit: messageId }
      );

      // Determine media type and send appropriate response
      const mediaType = getMediaType(m.quoted.mtype);
      const userName = m.pushName || 'User';
      
      if (mediaType === 'audio') {
        await bot.sendMessage(m.from, {
          text: `*Hey ${userName}! Here Is Your Audio URL*\n\n📁 *File URL:*\n${mediaUrl}\n\n📊 *Size:* ${fileSizeMB.toFixed(2)}MB`
        }, { quoted: m });
      } else if (mediaType === 'sticker') {
        // Catbox might not accept stickers directly, convert to image
        await bot.sendMessage(m.from, {
          text: `*Hey ${userName}! Here Is Your Sticker URL*\n\n📁 *File URL:*\n${mediaUrl}\n\n📊 *Size:* ${fileSizeMB.toFixed(2)}MB`
        }, { quoted: m });
      } else {
        await bot.sendMessage(m.from, {
          [mediaType]: { url: mediaUrl },
          caption: `*Hey ${userName}! Here Is Your Media*\n\n📁 *File URL:*\n${mediaUrl}\n\n📊 *Size:* ${fileSizeMB.toFixed(2)}MB`
        }, { quoted: m });
      }

    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

  } catch (error) {
    console.error('Error in tourl command:', error);
    
    // Send user-friendly error message
    let errorMessage = '❌ Failed to process media. ';
    
    if (error.message.includes('size exceeds')) {
      errorMessage += `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    } else if (error.message.includes('Unsupported file type')) {
      errorMessage += 'File type is not supported.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage += 'Network error. Please try again later.';
    } else {
      errorMessage += 'Please try again with a different file.';
    }
    
    await bot.sendMessage(m.from, { text: errorMessage }, { quoted: m });
  }
};

const getMediaType = (mtype) => {
  switch (mtype) {
    case 'imageMessage':
    case 'stickerMessage':
      return 'image';
    case 'videoMessage':
      return 'video';
    case 'audioMessage':
      return 'audio';
    case 'documentMessage':
      return 'document';
    default:
      return 'document';
  }
};

export default tourl;
