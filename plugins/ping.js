import config from '../config.cjs';

const ping = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "ping") {
    const start = new Date().getTime();

    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];
    const progressEmojis = ['▰', '▰', '▰', '▰', '▰', '▰', '▰', '▰', '▰', '▰'];
    const animationFrames = ['◰', '◳', '◲', '◱']; // Spinner animation frames
    const gradientColors = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪']; // Color progression
    const pingEmojis = ['●', '◎', '○', '◌']; // Ping wave animation

    // Select random emojis
    const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

    // Ensure reaction and text emojis are different
    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await m.React(textEmoji);

    // Create initial progress bar message
    const loadingMessage = await Matrix.sendMessage(m.from, {
      text: `*🏁 PING TEST INITIATED...*\n\n` +
            `🔸 *Status:* Measuring latency\n` +
            `🔸 *Animation:* ${animationFrames[0]} Initializing...\n` +
            `🔸 *Progress:* ${progressEmojis.slice(0, 2).join('')}${'▱'.repeat(8)}\n` +
            `🔸 *Ping Wave:* ${pingEmojis[0]}${'─'.repeat(9)}${pingEmojis[0]}\n\n` +
            `*⏳ Please wait...*`,
      contextInfo: {
        mentionedJid: [m.sender]
      }
    }, { quoted: m });

    // Animation function
    const animateProgress = async (frame, progress, colorIndex, waveFrame, responseTime = null) => {
      const progressFilled = progressEmojis.slice(0, progress).join('');
      const progressEmpty = '▱'.repeat(10 - progress);
      const waveLength = 10;
      const wavePos = Math.floor(waveFrame % waveLength);
      const waveLeft = '─'.repeat(wavePos);
      const waveRight = '─'.repeat(waveLength - wavePos - 1);
      
      let statusText;
      if (responseTime !== null) {
        statusText = `*✅ PING COMPLETE!*\n\n` +
                     `${gradientColors[colorIndex]} *ZenorSPEED:* ${responseTime.toFixed(3)}ms ${reactionEmoji}\n` +
                     `${textEmoji} *Precision:* ${(1 - (responseTime % 0.01)).toFixed(4)}\n` +
                     `🏁 *Progress:* ${progressFilled}${progressEmpty} [${progress * 10}%]\n` +
                     `🌀 *Animation:* ${animationFrames[frame]} Completed!\n` +
                     `🌊 *Ping Wave:* ${pingEmojis[waveFrame % 4]}${waveLeft}●${waveRight}${pingEmojis[(waveFrame + 2) % 4]}\n\n` +
                     `*${textEmoji} System Status: Optimal*`;
      } else {
        const statusMessages = [
          "Calibrating sensors...",
          "Measuring quantum latency...",
          "Optimizing connection...",
          "Synchronizing timestamps...",
          "Finalizing calculations..."
        ];
        
        statusText = `*${animationFrames[frame]} PING IN PROGRESS...*\n\n` +
                     `${gradientColors[colorIndex]} *Status:* ${statusMessages[Math.floor(progress / 2)]}\n` +
                     `📊 *Progress:* ${progressFilled}${progressEmpty} [${progress * 10}%]\n` +
                     `🌀 *Animation:* ${animationFrames[frame]} Active\n` +
                     `🌊 *Ping Wave:* ${pingEmojis[waveFrame % 4]}${waveLeft}◎${waveRight}${pingEmojis[(waveFrame + 2) % 4]}\n\n` +
                     `*⏳ Please wait...*`;
      }

      await Matrix.sendMessage(m.from, {
        text: statusText,
        edit: loadingMessage.key
      });
    };

    // Animate the progress bar
    let progress = 0;
    let frame = 0;
    let colorIndex = 0;
    let waveFrame = 0;
    
    const animationInterval = setInterval(async () => {
      await animateProgress(frame, progress, colorIndex, waveFrame);
      
      // Update animation states
      frame = (frame + 1) % animationFrames.length;
      progress = Math.min(progress + 1, 10);
      colorIndex = Math.floor(progress / 2);
      waveFrame++;
      
      // Stop animation when progress is complete
      if (progress >= 10) {
        clearInterval(animationInterval);
        
        // Get final response time
        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;
        
        // Show final result with animation
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          await animateProgress((frame + i) % animationFrames.length, 10, 5, waveFrame + i, responseTime);
        }
        
        // Final static message
        await Matrix.sendMessage(m.from, {
          text: `*${textEmoji} ZENOR PING RESULTS ${textEmoji}*\n\n` +
                `⚡ *Response Time:* \`${responseTime.toFixed(3)}ms\`\n` +
                `🎯 *Precision:* \`${(1 - (responseTime % 0.01)).toFixed(4)}\`\n` +
                `📊 *Performance:* ${'⭐'.repeat(Math.max(1, 5 - Math.floor(responseTime * 10)))}\n` +
                `🌈 *Gradient Test:* ${gradientColors.join('→')}\n` +
                `🌀 *Animation Cycles:* ${waveFrame}\n\n` +
                `*${reactionEmoji} System: Optimal | Latency: Excellent ${reactionEmoji}*\n` +
                `_Powered by Zenor-XMD Technology_`,
          edit: loadingMessage.key,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363398040175935@newsletter',
              newsletterName: "Zenor-XMD",
              serverMessageId: 143
            }
          }
        });
      }
    }, 200);
  }
};

export default ping;
