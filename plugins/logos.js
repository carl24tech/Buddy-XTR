import axios from "axios";
import * as cheerio from "cheerio";
import config from '../config.cjs';

const logoCommands = async (message, bot) => {
  try {
    const prefix = config?.PREFIX || ".";
    const body = (message?.body || "").trim();
    const userName = message?.pushName || "User";
    const newsletterJID = config?.NEWSLETTER_JID || "your-channel-jid@newsletter"; // Add your channel JID in config

    // 🔥 FIX 1: Strict command checking - only respond if message starts with prefix
    if (!body.startsWith(prefix)) return;

    const withoutPrefix = body.slice(prefix.length).trim();
    const [commandRaw, ...rest] = withoutPrefix.split(/\s+/);
    const command = (commandRaw || "").toLowerCase();
    const userInput = rest.join(" ").trim();

    // 🔥 FIX 2: Only respond to specific logo commands
    const validCommands = [
      'logo', 'logohelp', 'hacker', 'dragon', 'naruto', 'sand', 
      'choco', 'gold', 'graffiti', 'neon', 'water', 'fire', 'ice', 'space'
    ];

    // Don't respond if command is not in our list
    if (!validCommands.includes(command)) return;

    const sendText = async (text) => {
      await bot.sendMessage(message.from, { text }, { quoted: message });
    };

    // Show help
    if (command === 'logo' || command === 'logohelp') {
      const helpText = `🎨 *LOGO MAKER*\n\n` +
        `Available styles:\n` +
        `• ${prefix}hacker <text> - Anonymous hacker logo\n` +
        `• ${prefix}dragon <text> - Dragon Ball style\n` +
        `• ${prefix}naruto <text> - Naruto style\n` +
        `• ${prefix}sand <text> - Text on sand\n` +
        `• ${prefix}choco <text> - Chocolate text\n` +
        `• ${prefix}gold <text> - Gold text effect\n` +
        `• ${prefix}graffiti <text> - Graffiti style\n` +
        `• ${prefix}neon <text> - Neon light text\n` +
        `• ${prefix}water <text> - Water text effect\n` +
        `• ${prefix}fire <text> - Fire text effect\n` +
        `• ${prefix}ice <text> - Ice text effect\n` +
        `• ${prefix}space <text> - Space text\n\n` +
        `Example: ${prefix}hacker ALONE\n\n` +
        `────────────────\n` +
        `📢 *Follow our channel for updates!*\n` +
        `Tap the button below to join our newsletter:`;
      
      // Send message with newsletter button
      await bot.sendMessage(message.from, {
        text: helpText,
        buttons: [
          { buttonId: `newsletter_${newsletterJID}`, buttonText: { displayText: '📢 Join Channel' }, type: 1 }
        ],
        footer: "Logo Maker Bot"
      }, { quoted: message });
      return;
    }

    // Map commands to working URLs (updated)
    const ephotoUrls = {
      'hacker': 'https://en.ephoto360.com/make/anonymous-hacker-avatars-cyan-neon-677',
      'dragon': 'https://en.ephoto360.com/make/dragon-ball-style-text-effects-online-809',
      'naruto': 'https://en.ephoto360.com/make/naruto-shippuden-logo-style-text-effect-online-808',
      'sand': 'https://en.ephoto360.com/make/write-names-and-messages-on-the-sand-online-582',
      'choco': 'https://en.ephoto360.com/make/chocolate-text-effect-353',
      'gold': 'https://en.ephoto360.com/make/modern-gold-4-213',
      'graffiti': 'https://en.ephoto360.com/make/cartoon-style-graffiti-text-effect-online-668',
      'neon': 'https://en.ephoto360.com/make/neon-light-text-effect-online-175',
      'water': 'https://en.ephoto360.com/make/water-effect-text-online-295',
      'fire': 'https://en.ephoto360.com/make/flame-text-effect-online-38',
      'ice': 'https://en.ephoto360.com/make/ice-text-effect-online-242',
      'space': 'https://en.ephoto360.com/make/space-text-effects-online-180'
    };

    if (!userInput) {
      await sendText(`❌ Please provide text!\nExample: ${prefix}${command} ${command === 'hacker' ? 'ALONE' : 'TEXT'}`);
      return;
    }

    // Limit text length
    if (userInput.length > 15) {
      await sendText(`⚠️ Text too long! Use max 15 characters for best results.`);
      return;
    }

    // Send processing message
    try {
      await bot.sendMessage(message.from, {
        react: { text: "⏳", key: message.key },
      });
    } catch (_) {}

    await sendText(`🎨 Creating ${command} logo for: "${userInput}"\n⏳ Please wait 10-20 seconds...`);

    const pageUrl = ephotoUrls[command];
    
    try {
      // Simplified approach - use alternative method
      const imageUrl = await generateEphotoLogo(command, userInput, pageUrl);
      
      if (!imageUrl) {
        throw new Error('Could not generate logo');
      }

      // Send the image with newsletter button
      await bot.sendMessage(
        message.from,
        {
          image: { url: imageUrl },
          caption: `✅ ${command.toUpperCase()} LOGO\n\n📝 Text: ${userInput}\n👤 Requested by: ${userName}\n\n────────────────\n📢 Follow our channel for more updates!`,
          footer: "Logo Maker Bot",
          buttons: [
            { buttonId: `newsletter_${newsletterJID}`, buttonText: { displayText: '📢 Join Channel' }, type: 1 }
          ]
        },
        { quoted: message }
      );

      // React with success
      try {
        await bot.sendMessage(message.from, {
          react: { text: "✅", key: message.key },
        });
      } catch (_) {}

    } catch (error) {
      console.error(`Logo error for ${command}:`, error.message);
      
      // Alternative: Use text-to-image API as fallback
      await sendText(`⚠️ ephoto360 is not responding. Trying alternative...`);
      
      try {
        const fallbackImage = await generateFallbackLogo(command, userInput);
        
        if (fallbackImage) {
          await bot.sendMessage(
            message.from,
            {
              image: { url: fallbackImage },
              caption: `✅ ${command.toUpperCase()} (Alternative)\n\n📝 Text: ${userInput}\n👤 By: ${userName}\n\n────────────────\n📢 Follow our channel for more updates!`,
              footer: "Logo Maker Bot",
              buttons: [
                { buttonId: `newsletter_${newsletterJID}`, buttonText: { displayText: '📢 Join Channel' }, type: 1 }
              ]
            },
            { quoted: message }
          );
          return;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
      }
      
      // Final error message with newsletter button
      await bot.sendMessage(
        message.from,
        {
          text: `❌ Sorry, couldn't generate ${command} logo right now.\n\n` +
            `Possible reasons:\n` +
            `• ephoto360.com is down/maintenance\n` +
            `• The style is temporarily unavailable\n` +
            `• Network issues\n\n` +
            `Try:\n` +
            `1. Use a different style\n` +
            `2. Try again in 5 minutes\n` +
            `3. Use shorter text (1-2 words)\n\n` +
            `Use ${prefix}logo to see all styles.\n\n` +
            `────────────────\n` +
            `📢 *Follow our channel for updates!*`,
          footer: "Logo Maker Bot",
          buttons: [
            { buttonId: `newsletter_${newsletterJID}`, buttonText: { displayText: '📢 Join Channel' }, type: 1 }
          ]
        },
        { quoted: message }
      );
    }
    
  } catch (error) {
    console.error("Logo command error:", error);
    try {
      await bot.sendMessage(
        message.from,
        { text: "❌ Unexpected error. Please try again." },
        { quoted: message }
      );
    } catch (_) {}
  }
};

// Main logo generation function
async function generateEphotoLogo(command, text, pageUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://en.ephoto360.com/',
    'Origin': 'https://en.ephoto360.com'
  };

  console.log(`Generating ${command} logo: ${text}`);
  
  // Method 1: Direct API call (simpler)
  try {
    // Try to find the form and submit directly
    const response = await axios.get(pageUrl, { headers, timeout: 30000 });
    const $ = cheerio.load(response.data);
    
    // Look for form
    const form = $('form');
    if (!form.length) {
      console.log('No form found, trying alternative method');
      return await generateViaAlternativeMethod(command, text);
    }
    
    const formAction = form.attr('action');
    const submitUrl = formAction ? 
      (formAction.startsWith('http') ? formAction : `https://en.ephoto360.com${formAction}`) :
      'https://en.ephoto360.com/make.php';
    
    // Prepare form data
    const formData = new URLSearchParams();
    
    // Add text to first text input found
    const textInput = form.find('input[type="text"], textarea, input[name*="text"], input[name*="string"]').first();
    if (textInput.length) {
      const inputName = textInput.attr('name') || 'text[]';
      formData.append(inputName, text);
    } else {
      // Fallback - try to guess the field name
      formData.append('text[]', text);
    }
    
    // Add hidden inputs
    form.find('input[type="hidden"]').each((_, el) => {
      const name = $(el).attr('name');
      const value = $(el).attr('value') || '';
      if (name) formData.append(name, value);
    });
    
    // Submit form
    console.log(`Submitting to: ${submitUrl}`);
    const submitResponse = await axios.post(submitUrl, formData.toString(), {
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': pageUrl
      },
      timeout: 40000
    });
    
    // Extract image URL
    const $$ = cheerio.load(submitResponse.data);
    
    // Try multiple selectors
    const selectors = [
      'img[src*=".png"]',
      'img[src*=".jpg"]',
      'img[src*="ephoto360"]',
      'img[src*="/uploads/"]',
      'img.result-image',
      '#result img'
    ];
    
    for (const selector of selectors) {
      const img = $$(selector).first();
      if (img.length) {
        const src = img.attr('src');
        if (src) {
          return src.startsWith('http') ? src : `https://en.ephoto360.com${src}`;
        }
      }
    }
    
    // If no image found, use alternative
    return await generateViaAlternativeMethod(command, text);
    
  } catch (error) {
    console.error(`Method 1 failed: ${error.message}`);
    return await generateViaAlternativeMethod(command, text);
  }
}

// Alternative method if ephoto360 fails
async function generateViaAlternativeMethod(command, text) {
  console.log(`Using alternative for ${command}`);
  
  // Alternative text-to-image APIs (free, no API key needed)
  const alternatives = {
    'hacker': `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}&format=png&color=00FF00&bgcolor=000000`,
    'neon': `https://dummyimage.com/400x200/FF00FF/000&text=${encodeURIComponent(text)}`,
    'fire': `https://dummyimage.com/400x200/FF6600/000&text=${encodeURIComponent(text)}`,
    'ice': `https://dummyimage.com/400x200/00FFFF/000&text=${encodeURIComponent(text)}`,
    'gold': `https://dummyimage.com/400x200/FFD700/000&text=${encodeURIComponent(text)}`,
    'space': `https://dummyimage.com/400x200/0000FF/000&text=${encodeURIComponent(text)}&font=impact`
  };
  
  // Return alternative URL based on command, or default
  return alternatives[command] || 
    `https://dummyimage.com/400x200/333/fff&text=${encodeURIComponent(text)}&font=arial`;
}

// Fallback logo generator (always works)
async function generateFallbackLogo(command, text) {
  console.log(`Using fallback for ${command}`);
  
  // Color mapping based on command
  const colorMap = {
    'hacker': '00FF00/000000',
    'neon': 'FF00FF/000000',
    'fire': 'FF4500/000000',
    'ice': '00FFFF/000033',
    'gold': 'FFD700/000000',
    'water': '1E90FF/000033',
    'space': '0000FF/000000',
    'choco': '8B4513/FFFFFF',
    'sand': 'F4A460/000000',
    'dragon': 'FF0000/000000',
    'naruto': 'FFA500/000000',
    'graffiti': 'FFFF00/FF0000'
  };
  
  const colors = colorMap[command] || '333333/FFFFFF';
  const [color, bgcolor] = colors.split('/');
  
  return `https://dummyimage.com/400x200/${color}/${bgcolor}&text=${encodeURIComponent(text)}&font=impact`;
}

export default logoCommands;
