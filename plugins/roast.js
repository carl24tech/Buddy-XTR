// app/plugins/roast.js
import fs from 'fs';
import config from '../config.cjs';
import roasts from '../buddyxtr/roasts.js';

const roast = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  
  if (!['roast', 'burn', 'insult'].includes(cmd)) return;
  
  const mentionedUser = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;
  const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
  
  let caption;
  
  if (mentionedUser === m.sender) {
    caption = `*Self-roast!* 🔥\n\n${randomRoast}\n\n_You brave soul! Respect._`;
  } else {
    const mentionedUsername = mentionedUser.split('@')[0];
    caption = `@${mentionedUsername}\n\n${randomRoast}\n\n_🔥 Roast delivered!_`;
  }
  
  try {
    const imagePath = './media/roast.jpg';
    
    if (fs.existsSync(imagePath)) {
      await Matrix.sendMessage(m.from, {
        image: fs.readFileSync(imagePath),
        caption: caption,
        mentions: [mentionedUser],
        contextInfo: {
          mentionedJid: [mentionedUser],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363313938933929@newsletter',
            newsletterName: "Buddy-XTR Roasts",
            serverMessageId: 999
          }
        }
      }, {
        quoted: m
      });
    } else {
      await Matrix.sendMessage(m.from, {
        text: `🔥 ${caption}\n\n_Note: Roast image not found at app/media/roast.jpg_`,
        mentions: [mentionedUser]
      }, {
        quoted: m
      });
    }
  } catch (error) {
    console.error('Roast command error:', error);
    await Matrix.sendMessage(m.from, {
      text: `🔥 ${caption}`,
      mentions: [mentionedUser]
    }, {
      quoted: m
    });
  }
};

export default roast;
