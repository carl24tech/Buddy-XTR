import axios from 'axios';
import config from '../config.cjs';

const Lyrics = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['lyrics', 'lyric'];

  if (validCommands.includes(cmd)) {
    if (!text) {
      return m.reply(`*🎵 Lyrics Finder*\n\n*Usage:* ${prefix}lyrics [song name]\n*Example:* ${prefix}lyrics bula ntate stunna\n${prefix}lyrics blinding lights`);
    }

    try {
      await m.React('⏳');
      
      // Clean and prepare search query
      const searchQuery = text
        .replace(/[^\w\s'\-]/g, ' ') // Remove special characters except hyphens and apostrophes
        .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
        .trim();
      
      // Try to extract artist and song if pattern detected
      let song = searchQuery;
      let artist = '';
      
      // Common patterns in user input
      const patterns = [
        /^(.+?)\s+by\s+(.+)$/i,      // "song by artist"
        /^(.+?)\s+-\s+(.+)$/i,        // "song - artist"
        /^(.+?)\s+from\s+(.+)$/i,     // "song from artist"
      ];
      
      for (const pattern of patterns) {
        const match = searchQuery.match(pattern);
        if (match) {
          song = match[1].trim();
          artist = match[2].trim();
          break;
        }
      }
      
      let lyrics = '';
      let source = 'Lyrics.ovh';
      
      // Try primary API (lyrics.ovh)
      try {
        const apiUrl = artist 
          ? `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`
          : `https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`;
        
        const response = await axios.get(apiUrl, { 
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (WhatsApp-Bot)'
          }
        });
        
        if (response.data && response.data.lyrics) {
          lyrics = response.data.lyrics;
        } else {
          throw new Error('No lyrics found');
        }
      } catch (primaryError) {
        // Fallback to alternative API if primary fails
        try {
          const fallbackUrl = `https://some-random-api.com/lyrics?title=${encodeURIComponent(searchQuery)}`;
          const fallbackResponse = await axios.get(fallbackUrl, { timeout: 8000 });
          
          if (fallbackResponse.data && fallbackResponse.data.lyrics) {
            lyrics = fallbackResponse.data.lyrics;
            source = 'Some Random API';
            artist = fallbackResponse.data.author || artist || 'Unknown Artist';
            song = fallbackResponse.data.title || song;
          } else {
            throw new Error('No lyrics found');
          }
        } catch (fallbackError) {
          throw new Error('Lyrics not found');
        }
      }
      
      // Format and send response
      const truncatedLyrics = lyrics.length > 2500 
        ? lyrics.substring(0, 2500) + '\n\n...[TRUNCATED - Use /full for complete lyrics]' 
        : lyrics;
      
      const responseText = 
        `🎵 *${artist || 'Unknown Artist'} - ${song}*\n` +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        truncatedLyrics +
        '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        `📝 *Source:* ${source}\n` +
        `👤 *Requested by:* ${m.pushName || 'User'}\n` +
        `📊 *Length:* ${lyrics.length} characters\n` +
        `🔍 *Search query:* ${searchQuery}\n\n` +
        `💡 *Tips:* ${!artist ? '\n• Add artist name: "song by artist"\n• Example: "Bula by ntate stunna"' : ''}\n` +
        `• Use simple spelling\n• Copy with long-press\n\n` +
        `🎶 *Bot:* Buddy-XTR`;
      
      await m.reply(responseText);
      await m.React('✅');
      
    } catch (error) {
      console.error('Lyrics error:', error.message);
      
      let errorMessage = '❌ Error fetching lyrics. ';
      
      if (error.message.includes('not found') || error.response?.status === 404) {
        errorMessage += `\n\nLyrics not found for: *${text}*\n\n*Try these formats:*\n`;
        errorMessage += `• ${prefix}lyrics bula ntate stunna\n`;
        errorMessage += `• ${prefix}lyrics blinding lights the weeknd\n`;
        errorMessage += `• ${prefix}lyrics stay - the kid laroi\n`;
        errorMessage += `• ${prefix}lyrics asake lonely at the top\n`;
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = '⏰ Request timeout. Please try again in a moment.';
      }
      
      await m.reply(errorMessage);
      await m.React('❌');
    }
  }
};

export default Lyrics;
