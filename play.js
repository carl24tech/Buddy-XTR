import axios from "axios";
import yts from "yt-search";
import config from '../config.cjs';

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const args = body.slice(prefix.length + cmd.length).trim().split(" ");

  if (cmd !== "play") return;

  // Input validation
  if (args.length === 0 || !args.join(" ").trim()) {
    return m.reply("*🎵 Usage:*\n`play <song name or youtube url>`\n\n*Example:*\n`play shape of you`\n`play https://youtube.com/watch?v=...`");
  }

  const searchQuery = args.join(" ");
  await m.reply("🔍 *Searching for the song...*");

  try {
    let videoUrl;
    let title;

    // Check if input is a YouTube URL
    if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
      try {
        const videoId = searchQuery.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        if (!videoId) throw new Error("Invalid YouTube URL");
        
        const searchResults = await yts({ videoId });
        if (!searchResults || !searchResults.title) {
          return m.reply("❌ Could not fetch video information from the provided URL.");
        }
        videoUrl = `https://youtube.com/watch?v=${videoId}`;
        title = searchResults.title;
      } catch (urlError) {
        return m.reply("❌ Invalid YouTube URL. Please provide a valid YouTube link.");
      }
    } else {
      // Search by query
      const searchResults = await yts(searchQuery);
      if (!searchResults.videos || searchResults.videos.length === 0) {
        return m.reply(`❌ No results found for "${searchQuery}".\n\nPlease try:\n• Different keywords\n• Artist name with song title\n• Check spelling`);
      }

      const firstResult = searchResults.videos[0];
      videoUrl = firstResult.url;
      title = firstResult.title;
      
      // Show search results option (you can expand this later)
      if (searchResults.videos.length > 1) {
        const secondResult = searchResults.videos[1];
        await m.reply(`🎵 *Search Results:*\n\n1️⃣ *${title}* (${firstResult.timestamp})\n2️⃣ *${secondResult.title}* (${secondResult.timestamp})\n\n*Selected:* 1️⃣`);
      }
    }

    // First API endpoint
    const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (WhatsApp Bot)'
      }
    });

    if (!response.data?.success || !response.data?.result?.download_url) {
      // Fallback to alternative API
      return tryAlternativeAPI(videoUrl, title, m, gss);
    }

    const { download_url } = response.data.result;
    
    // Validate download URL
    if (!download_url || !download_url.startsWith('http')) {
      throw new Error("Invalid download URL received");
    }

    // Download and send audio with progress indicator
    await m.reply(`⬇️ *Downloading audio...*\n\n🎵 *Title:* ${title}`);
    
    await gss.sendMessage(
      m.from,
      {
        audio: { url: download_url },
        mimetype: "audio/mpeg",
        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
        ptt: false,
      },
      { quoted: m }
    );

    await m.reply(`✅ *Download Complete!*\n\n🎵 *${title}*\n\nEnjoy your music! 🎧`);

  } catch (error) {
    console.error("Play command error:", error);
    
    if (error.code === 'ECONNABORTED') {
      await m.reply("⏱️ Request timed out. Please try again later.");
    } else if (error.response?.status === 404) {
      await m.reply("❌ Audio service is currently unavailable. Please try again later.");
    } else if (error.message.includes("Invalid URL")) {
      await m.reply("❌ Invalid audio URL. Please try a different search.");
    } else {
      await m.reply("❌ Failed to download audio. Please try again or use a different search term.");
    }
  }
};

// Alternative API fallback function
const tryAlternativeAPI = async (videoUrl, title, m, gss) => {
  try {
    await m.reply("🔄 Trying alternative download source...");
    
    // Alternative API endpoint (you can add more)
    const altApiUrl = `https://api.erdwpe.com/api/download/youtube-mp3?url=${encodeURIComponent(videoUrl)}`;
    const altResponse = await axios.get(altApiUrl, { timeout: 25000 });
    
    if (altResponse.data?.result?.url) {
      await gss.sendMessage(
        m.from,
        {
          audio: { url: altResponse.data.result.url },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          ptt: false,
        },
        { quoted: m }
      );
      await m.reply(`✅ *${title}* downloaded via alternative source!`);
    } else {
      throw new Error("Alternative API failed");
    }
  } catch (altError) {
    console.error("Alternative API error:", altError);
    throw altError;
  }
};

// Helper function to extract video ID
const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export default play;
