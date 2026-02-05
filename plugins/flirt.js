// app/plugins/flirt.js
import fs from 'fs';
import flirtsData from '../buddyxtr/flirt.js';
const userMemory = new Map();
const recentFlirts = new Set();
const MAX_MEMORY_SIZE = 1000;

const flirt = async (m, Matrix) => {
  try {
    // Check if it's a flirt command
    const flirtKeywords = ['flirt', 'flirts', 'seduce', 'pickup'];
    const body = m.body.toLowerCase().trim();
    const prefix = '/'; // Adjust based on your actual prefix
    
    // Extract command (remove prefix if exists)
    let cmd = body;
    if (body.startsWith(prefix)) {
      cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();
    }
    
    if (!flirtKeywords.includes(cmd)) return;
    
    // Extract mode from message if provided
    const args = m.body.trim().split(' ');
    let requestedMode = args[1] ? args[1].toLowerCase() : 'random';
    
    // Available modes
    const modes = ['cute', 'savage', 'spicy', 'nerdy', 'random'];
    
    // Validate mode
    if (!modes.includes(requestedMode)) {
      requestedMode = 'random';
    }
    
    // Determine target user
    const mentionedUser = m.mentionedJid && m.mentionedJid[0] 
      ? m.mentionedJid[0] 
      : m.sender;
    
    // Get user ID for memory tracking
    const userId = m.sender;
    const targetUserId = mentionedUser;
    
    // Initialize user memory if not exists
    if (!userMemory.has(userId)) {
      userMemory.set(userId, new Set());
    }
    
    // Get user's used flirts
    const usedFlirts = userMemory.get(userId);
    
    // Get time-based flirts (day/night)
    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 6 && currentHour < 18;
    const timeVibe = isDayTime ? 'day' : 'night';
    
    // Filter available flirts based on mode and time
    let availableFlirts = [];
    
    if (requestedMode === 'random') {
      // Select a random mode (excluding 'random')
      const randomModes = modes.filter(mode => mode !== 'random');
      requestedMode = randomModes[Math.floor(Math.random() * randomModes.length)];
    }
    
    // Get flirts
    if (flirtsData[requestedMode]) {
      availableFlirts = [...flirtsData[requestedMode]];
      
      // Add time-based flirts 
      if (flirtsData[timeVibe]) {
        availableFlirts = [...availableFlirts, ...flirtsData[timeVibe]];
      }
    } else {
      // Fallback 
      Object.values(flirtsData).forEach(modeFlirts => {
        availableFlirts = [...availableFlirts, ...modeFlirts];
      });
    }
    
    // Remove flirt
    const freshFlirts = availableFlirts.filter(flirt => 
      !usedFlirts.has(flirt) && !recentFlirts.has(flirt)
    );
    
    // reset memory for this user
    let selectedFlirt;
    if (freshFlirts.length === 0) {
      userMemory.set(userId, new Set());
      recentFlirts.clear();
      selectedFlirt = availableFlirts[Math.floor(Math.random() * availableFlirts.length)];
    } else {
      selectedFlirt = freshFlirts[Math.floor(Math.random() * freshFlirts.length)];
    }
    
    // Update memory
    usedFlirts.add(selectedFlirt);
    recentFlirts.add(selectedFlirt);
    
    // Clean up memory if too large
    if (usedFlirts.size > MAX_MEMORY_SIZE) {
      const array = Array.from(usedFlirts);
      usedFlirts.clear();
      // Keep only recent 100 flirts
      array.slice(-100).forEach(flirt => usedFlirts.add(flirt));
    }
    
    if (recentFlirts.size > 100) {
      const array = Array.from(recentFlirts);
      recentFlirts.clear();
      // Keep only recent 50 flirts
      array.slice(-50).forEach(flirt => recentFlirts.add(flirt));
    }
    
    // Create caption based on context
    let caption;
    const emojiMap = {
      cute: '🥰',
      savage: '😈',
      spicy: '🔥',
      nerdy: '🤓',
      day: '☀️',
      night: '🌙'
    };
    
    const modeEmoji = emojiMap[requestedMode] || '💘';
    const timeEmoji = isDayTime ? '☀️' : '🌙';
    
    if (mentionedUser === m.sender) {
      caption = `*Self-love is important too!* ${modeEmoji}\n\n${selectedFlirt}\n\n_Mode: ${requestedMode} | ${timeEmoji} ${timeVibe} vibes_`;
    } else {
      const mentionedUsername = mentionedUser.split('@')[0];
      caption = `@${mentionedUsername}\n\n${selectedFlirt}\n\n_Mode: ${requestedMode} ${modeEmoji} | ${timeEmoji} ${timeVibe} vibes_`;
    }
    
    // Send message with image
    const imagePath = './media/flirt.jpg';
    
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
            newsletterName: "Buddy-XTR Flirts",
            serverMessageId: 999
          }
        }
      }, {
        quoted: m
      });
    } else {
      // Fallback without image
      await Matrix.sendMessage(m.from, {
        text: `💝 *Buddy-XTR Flirt*\n\n${caption}\n\n_Note: Flirt image not found at app/media/flirt.jpg_`,
        mentions: [mentionedUser]
      }, {
        quoted: m
      });
    }
    
  } catch (error) {
    console.error('Flirt command error:', error);
    
    // Simple error fallback
    try {
      await Matrix.sendMessage(m.from, {
        text: `💘 *Flirt Failed!*\n\nSomething went wrong, but you're still charming! 😉\n\n_Try: /flirt [cute/savage/spicy/nerdy]_`,
        mentions: [m.sender]
      }, {
        quoted: m
      });
    } catch (e) {
      console.error('Error fallback also failed:', e);
    }
  }
};

export default flirt;
