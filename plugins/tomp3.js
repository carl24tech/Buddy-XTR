import { toAudio } from '../lib/converter.cjs';
import config from '../config.cjs';

const tomp3 = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || '';
    const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const validCommands = ['tomp3', 'mp3'];

    // Check if command is valid
    if (!validCommands.includes(cmd)) return;

    // Check if message is a reply to a video
    if (!m.quoted) {
      return m.reply(`Please reply to a video with the command *${prefix + cmd}* to convert it to MP3.`);
    }

    // Check if quoted message is a video
    const quotedMtype = m.quoted.mtype || m.quoted.type;
    if (!quotedMtype || !quotedMtype.includes('video')) {
      return m.reply(`The replied message is not a video. Please reply to a video with the command *${prefix + cmd}*.`);
    }

    // Configuration
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
    const MAX_DURATION = 10 * 60; // 10 minutes in seconds (adjust based on your needs)
    const SEND_AS_AUDIO = true; // Set to false to send as document

    // Initial reply with processing message
    const processingMsg = await m.reply('🎵 Converting video to MP3, please wait...\n\n_Step 1: Downloading video..._');
    
    let progressUpdateInterval;

    // Function to update progress
    const updateProgress = (step, progress = '') => {
      try {
        const steps = {
          1: '🎵 Converting video to MP3, please wait...\n\n_Step 1: Downloading video..._',
          2: '🎵 Converting video to MP3, please wait...\n\n_Step 2: Download complete ✅\nStep 2: Converting to audio..._',
          3: `🎵 Converting video to MP3, please wait...\n\n_Step 1: Download complete ✅\nStep 2: Conversion complete ✅\nStep 3: Sending audio..._${progress ? `\n\n${progress}` : ''}`,
          4: '🎵 Converting video to MP3, please wait...\n\n_Step 1: Download complete ✅\nStep 2: Conversion complete ✅\nStep 3: Sending complete ✅\n\n✅ Processing complete!_'
        };
        if (steps[step]) {
          processingMsg.edit(steps[step]);
        }
      } catch (e) {
        // Silently fail if we can't edit the message
      }
    };

    try {
      // Start progress updates
      progressUpdateInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateProgress(currentStep, `⏱️ Time elapsed: ${elapsed}s`);
      }, 5000);

      const startTime = Date.now();
      let currentStep = 1;

      // Download the quoted video
      updateProgress(1);
      let media;
      try {
        media = await m.quoted.download();
        if (!media || media.length === 0) {
          throw new Error('Failed to download video');
        }
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        clearInterval(progressUpdateInterval);
        return m.reply('❌ Failed to download the video. Please try again.');
      }

      // Check file size
      const fileSizeMB = (media.length / 1024 / 1024).toFixed(2);
      if (media.length > MAX_SIZE) {
        clearInterval(progressUpdateInterval);
        return m.reply(`❌ Video is too large (${fileSizeMB}MB). Maximum size is 50MB.`);
      }

      // Optional: Check video duration if available
      // Note: This requires metadata extraction. Uncomment if you have a way to get duration
      /*
      if (m.quoted.seconds && m.quoted.seconds > MAX_DURATION) {
        clearInterval(progressUpdateInterval);
        return m.reply(`❌ Video is too long (${m.quoted.seconds}s). Maximum duration is ${MAX_DURATION / 60} minutes.`);
      }
      */

      currentStep = 2;
      updateProgress(2);

      // Convert to audio
      let audio;
      try {
        audio = await toAudio(media, 'mp4');
        if (!audio) {
          throw new Error('Conversion failed');
        }
      } catch (conversionError) {
        console.error('Conversion error:', conversionError);
        clearInterval(progressUpdateInterval);
        return m.reply('❌ Failed to convert video to audio. The video might be corrupted, in an unsupported format, or too long.');
      }

      currentStep = 3;
      updateProgress(3);

      // Clear progress interval
      clearInterval(progressUpdateInterval);

      // Create filename with timestamp and original filename if available
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const originalFilename = m.quoted.filename || '';
      const safeFilename = originalFilename
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .substring(0, 50); // Limit length
      
      const fileName = safeFilename 
        ? `audio_${safeFilename}_${timestamp}.mp3`
        : `audio_${timestamp}.mp3`;

      // Send the audio file
      if (SEND_AS_AUDIO) {
        // Send as audio message (plays in chat)
        await gss.sendMessage(
          m.from,
          { 
            audio: audio,
            mimetype: 'audio/mpeg',
            ptt: false, // Set to true for push-to-talk style
            fileName: fileName
          },
          { quoted: m }
        );
      } else {
        // Send as document (downloadable file)
        await gss.sendMessage(
          m.from,
          { 
            document: audio, 
            mimetype: 'audio/mpeg',
            fileName: fileName
          },
          { quoted: m }
        );
      }

      currentStep = 4;
      updateProgress(4);

      // Clean up progress message after 2 seconds
      setTimeout(() => {
        try {
          processingMsg.delete();
        } catch (e) {
          // Ignore if message can't be deleted
        }
      }, 2000);

      // Optional: Send quick confirmation
      // await m.reply(`✅ Successfully converted ${fileSizeMB}MB video to MP3!\n⏱️ Total time: ${Math.floor((Date.now() - startTime) / 1000)}s`);

    } catch (processError) {
      if (progressUpdateInterval) clearInterval(progressUpdateInterval);
      throw processError;
    }

  } catch (error) {
    console.error('Error in tomp3 command:', error);
    
    // User-friendly error messages
    let errorMessage = '❌ An error occurred while processing your request.';
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      errorMessage = '❌ The conversion took too long. Please try with a shorter video.';
    } else if (error.message.includes('memory') || error.message.includes('Memory')) {
      errorMessage = '❌ The video is too large to process. Please try with a smaller video.';
    } else if (error.message.includes('format') || error.message.includes('unsupported')) {
      errorMessage = '❌ The video format is not supported. Please try a different video.';
    }
    
    m.reply(`${errorMessage}\n\nError details: ${error.message || 'Unknown error'}`);
  }
};

// Command info for help menu
tomp3.command = 'tomp3';
tomp3.help = ['tomp3', 'mp3'];
tomp3.description = 'Convert a video to MP3 audio';
tomp3.usage = `Reply to a video message with:
• ${config.PREFIX}tomp3
• ${config.PREFIX}mp3

Limits:
• Maximum size: 50MB
• Maximum duration: 10 minutes`;

export default tomp3;