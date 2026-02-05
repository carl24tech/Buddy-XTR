import axios from 'axios';
import config from '../config.cjs';

const couplepp = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (!['couplepp', 'couple', 'cpp', 'pp'].includes(cmd)) return;

  await m.React('💑');
  await Matrix.sendMessage(m.from, { text: "*💑 Fetching couple profile pictures...*" }, { quoted: m });

  try {
    const response = await axios.get("https://api.davidcyriltech.my.id/couplepp");

    if (!response.data || !response.data.success) {
      return Matrix.sendMessage(m.from, { text: "❌ Failed to fetch couple profile pictures. Please try again later." }, { quoted: m });
    }

    const malePp = response.data.male;
    const femalePp = response.data.female;

    const contextInfo = {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363354023106228@newsletter',
        newsletterName: "JawadTechX",
        serverMessageId: 143
      }
    };

    if (malePp) {
      await Matrix.sendMessage(m.from, {
        image: { url: malePp },
        caption: "👨 Male Couple Profile Picture",
        contextInfo
      }, { quoted: m });
    }

    if (femalePp) {
      await Matrix.sendMessage(m.from, {
        image: { url: femalePp },
        caption: "👩 Female Couple Profile Picture",
        contextInfo
      }, { quoted: m });
    }

  } catch (error) {
    console.error(error);
    Matrix.sendMessage(m.from, { text: "❌ An error occurred while fetching the couple profile pictures." }, { quoted: m });
  }
};

export default couplepp;
