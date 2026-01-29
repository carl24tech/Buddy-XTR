import { request } from 'https';
import config from '../config.cjs';

const ai = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body.trim();
  
  if (!body.startsWith(prefix)) return;
  
  const args = body.slice(prefix.length).trim().split(' ');
  const cmd = args[0].toLowerCase();
  
  if (!['ai'].includes(cmd)) return;
  
  const query = args.slice(1).join(' ').trim();
  
  if (!query) {
    await Matrix.sendMessage(m.from, {
      text: `Usage: ${prefix}ai <question>`
    }, { quoted: m });
    return;
  }

  try {
    // Try a completely different approach - use a proxy or different endpoint
    const apiData = {
      model: "deepseek-chat",
      messages: [{ role: "user", content: query }],
      max_tokens: 500
    };

    // Method 1: Try direct fetch with different headers
    const response = await new Promise((resolve, reject) => {
      const req = request({
        hostname: 'api.deepseek.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-ab0b108a53fa417d983a325465bc46cc',
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(apiData));
      req.end();
    });

    const reply = response.choices[0].message.content;
    
    await Matrix.sendMessage(m.from, {
      text: `🤖 ${reply}`
    }, { quoted: m });
    
  } catch (error) {
    console.error('AI Error:', error);
    
    // Fallback response
    await Matrix.sendMessage(m.from, {
      text: `⚠️ AI Service Temporary Unavailable\n\nBut I got your message: "${query}"\n\nPlease try:\n1. Using a valid DeepSeek API key\n2. Checking https://status.deepseek.com/\n3. Trying again in 5 minutes`
    }, { quoted: m });
  }
};

export default ai;
