import { downloadMediaMessage } from '@whiskeysockets/baileys';
import Jimp from 'jimp';
import config from '../config.cjs';

const updateGroupPicture = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  
  if (cmd !== "gcpp") return;

  // Check if the message is from a group
  if (!m.isGroup) {
    return m.reply("❌ This command can only be used in groups.");
  }

  // Check if user is a group admin
  const groupMetadata = await sock.groupMetadata(m.from);
  const participant = groupMetadata.participants.find(p => p.id === m.sender);
  if (!participant?.admin) {
    return m.reply("❌ You must be a group admin to use this command.");
  }

  // Check if the replied message is an image
  if (!m.quoted?.message?.imageMessage) {
    return m.reply("⚠️ Please *reply to an image* to set as group profile picture.");
  }

  await m.React('⏳'); // Loading reaction

  try {
    // Download the image
    const media = await downloadMediaMessage(m.quoted, 'buffer', {});
    if (!media) {
      await m.React('❌');
      return m.reply("❌ Failed to download image.");
    }

    // Process image
    const image = await Jimp.read(media);
    if (!image) throw new Error("Invalid image format");

    // Create square canvas
    const size = Math.max(image.bitmap.width, image.bitmap.height);
    const squareImage = new Jimp(size, size, 0x000000FF);
    
    // Center the original image on the square canvas
    const x = (size - image.bitmap.width) / 2;
    const y = (size - image.bitmap.height) / 2;
    squareImage.composite(image, x, y);

    // Resize to WhatsApp requirements (512x512 recommended for groups)
    squareImage.resize(512, 512);
    
    // Convert to buffer
    const buffer = await squareImage.getBufferAsync(Jimp.MIME_JPEG);

    // Update group profile picture
    await sock.updateProfilePicture(m.from, buffer);
    await m.React('✅');

    // Success response
    return sock.sendMessage(
      m.from,
      { 
        text: "✅ *Group profile picture updated successfully!*",
        mentions: [m.sender]
      },
      { quoted: m }
    );
    
  } catch (error) {
    console.error("Error setting group profile picture:", error);
    await m.React('❌');
    return m.reply("❌ Failed to update group picture: " + error.message);
  }
};

export default updateGroupPicture;
