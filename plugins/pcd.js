import axios from 'axios';

const paircode = async (m, Matrix) => {
  // Get prefix from config
  const config = await import('../config.cjs').catch(() => ({}));
  const prefix = config.default?.PREFIX || '.';
  
  // Check if command matches
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  if (cmd !== 'paircode') return;
  
  try {
    // Extract number from message
    const args = m.body.slice(prefix.length).trim().split(' ').slice(1);
    if (args.length === 0) {
      return await Matrix.sendMessage(m.from, {
        text: `❌ *Usage:* ${prefix}paircode <number>\n*Example:* ${prefix}paircode 712345678\n*Note:* Don't include +254 or country code`
      }, { quoted: m });
    }
    
    let number = args[0].trim();
    
    // Clean the number
    if (number.startsWith('+')) number = number.slice(1);
    if (number.startsWith('254')) number = number.slice(3);
    if (!/^\d{9,}$/.test(number)) {
      return await Matrix.sendMessage(m.from, {
        text: `❌ Invalid number format. Please provide 9+ digits without country code.\n*Example:* 712345678`
      }, { quoted: m });
    }
    
    // Prepare request data
    const requestData = { number: `254${number}` };
    
    // Send request to API
    await Matrix.sendMessage(m.from, {
      text: '⏳ *Requesting pair code...*'
    }, { quoted: m });
    
    const response = await axios.post('https://for-buddy.onrender.com/', requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // Handle response
    if (response.data && response.data.pairCode) {
      const pairCode = response.data.pairCode;
      
      // Create message with buttons
      await Matrix.sendMessage(m.from, {
        text: `✅ *Pair Code Generated Successfully!*\n\n📱 *Number:* 254${number}\n🔢 *Pair Code:* \`${pairCode}\`\n\n*Expires in:* 5 minutes\n*Note:* Use this code in WhatsApp pairing process`,
        footer: 'Buddy-XTR Pair Code Service',
        buttons: [
          {
            buttonId: `${prefix}paircode ${number}`,
            buttonText: { displayText: '🔄 Refresh Code' },
            type: 1
          },
          {
            buttonId: `${prefix}help`,
            buttonText: { displayText: '❓ Help' },
            type: 1
          }
        ],
        headerType: 1
      }, { quoted: m });
      
    } else if (response.data && response.data.error) {
      await Matrix.sendMessage(m.from, {
        text: `❌ *Error:* ${response.data.error}\n\nPlease try again with a different number.`
      }, { quoted: m });
    } else {
      throw new Error('Invalid response from server');
    }
    
  } catch (error) {
    console.error('Paircode error:', error);
    
    let errorMessage = '❌ *Failed to generate pair code*';
    
    if (error.response) {
      // API error
      errorMessage += `\n*Status:* ${error.response.status}`;
      if (error.response.data) {
        errorMessage += `\n*Response:* ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // No response
      errorMessage += '\n*Server is not responding*';
    } else {
      // Other errors
      errorMessage += `\n*Error:* ${error.message}`;
    }
    
    // Add retry button
    await Matrix.sendMessage(m.from, {
      text: errorMessage,
      footer: 'Try again in a few moments',
      buttons: [
        {
          buttonId: `${prefix}paircode ${m.body.split(' ').slice(1).join(' ')}`,
          buttonText: { displayText: '🔄 Retry' },
          type: 1
        }
      ],
      headerType: 1
    }, { quoted: m });
  }
};

export default paircode;
