// app/plugins/quotes.js
import fs from 'fs';
import quotesData from '../buddyxtr/quotes.js';

// User memory to track used quotes
const userMemory = new Map();
const recentQuotes = new Set();
const authorMemory = new Map();
const MAX_MEMORY_SIZE = 1000;

const quotes = async (m, Matrix) => {
  try {
    // quotes command
    const quotesKeywords = ['quote', 'quotes', 'motivation', 'inspire', 'wisdom'];
    const body = m.body.toLowerCase().trim();
    const prefix = '/'; 
    
    // Extract command 
    let cmd = body;
    if (body.startsWith(prefix)) {
      cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();
    }
    
    if (!quotesKeywords.includes(cmd)) return;
    
    // Extract category
    const args = m.body.trim().split(' ');
    let requestedType = args[1] ? args[1].toLowerCase() : 'random';
    
    //  categories
    const categories = ['life', 'love', 'motivation', 'success', 'wisdom', 'philosophy', 'funny', 'friendship', 'work', 'time', 'author', 'random'];
    
    // Check if user is requesting a specific author
    let isAuthorRequest = false;
    let requestedAuthor = '';
    
    // 
    if (args.length > 2) {
      // Try to match with common author keywords
      const authorKeywords = ['by', 'from', 'author'];
      if (authorKeywords.includes(args[1].toLowerCase())) {
        isAuthorRequest = true;
        requestedAuthor = args.slice(2).join(' ').toLowerCase();
      } else {
        // Check if it's a multi-word category
        const fullRequest = args.slice(1).join(' ').toLowerCase();
        if (quotesData[fullRequest]) {
          requestedType = fullRequest;
        } else if (categories.includes(args[1].toLowerCase())) {
          requestedType = args[1].toLowerCase();
        } else {
          // Check if it might be an author
          isAuthorRequest = true;
          requestedAuthor = fullRequest;
        }
      }
    } else if (!categories.includes(requestedType)) {
      // Check if it's an author request
      const allAuthors = Object.keys(quotesData.authors || {});
      if (allAuthors.some(author => author.toLowerCase().includes(requestedType))) {
        isAuthorRequest = true;
        requestedAuthor = requestedType;
      }
    }
    
    // Validate category
    if (!isAuthorRequest && !categories.includes(requestedType)) {
      requestedType = 'random';
    }
    
    // Get user ID for memory tracking
    const userId = m.sender;
    
    // Initialize user memory if not exists
    if (!userMemory.has(userId)) {
      userMemory.set(userId, new Set());
    }
    if (!authorMemory.has(userId)) {
      authorMemory.set(userId, new Set());
    }
    
    // Get user's used quotes and authors
    const usedQuotes = userMemory.get(userId);
    const usedAuthors = authorMemory.get(userId);
    
    // Get time-based quotes (morning/afternoon/evening/night)
    const currentHour = new Date().getHours();
    let timeCategory = 'general';
    let timeGreeting = '';
    
    if (currentHour >= 5 && currentHour < 12) {
      timeCategory = 'morning';
      timeGreeting = '🌅 Good Morning!';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeCategory = 'afternoon';
      timeGreeting = '☀️ Good Afternoon!';
    } else if (currentHour >= 17 && currentHour < 21) {
      timeCategory = 'evening';
      timeGreeting = '🌇 Good Evening!';
    } else {
      timeCategory = 'night';
      timeGreeting = '🌙 Good Night!';
    }
    
    // Filter available quotes based on type/author
    let availableQuotes = [];
    
    if (isAuthorRequest) {
      // Search for quotes by author
      requestedType = 'author';
      const authors = quotesData.authors || {};
      
      // Find author (case-insensitive search)
      const authorKey = Object.keys(authors).find(author => 
        author.toLowerCase().includes(requestedAuthor) || 
        requestedAuthor.includes(author.toLowerCase())
      );
      
      if (authorKey) {
        availableQuotes = authors[authorKey];
        requestedAuthor = authorKey; // Store the proper author name
      } else {
        // Fallback to random if author not found
        isAuthorRequest = false;
        requestedType = 'random';
      }
    }
    
    if (!isAuthorRequest) {
      if (requestedType === 'random') {
        // Select a random category (excluding 'random', 'authors', and time categories)
        const randomCategories = Object.keys(quotesData).filter(cat => 
          !['random', 'authors', 'morning', 'afternoon', 'evening', 'night', 'general'].includes(cat)
        );
        requestedType = randomCategories[Math.floor(Math.random() * randomCategories.length)];
      }
      
      // Get quotes for the selected category
      if (quotesData[requestedType]) {
        availableQuotes = [...quotesData[requestedType]];
      }
      
      // Add time-based quotes if available
      if (quotesData[timeCategory]) {
        availableQuotes = [...availableQuotes, ...quotesData[timeCategory]];
      }
    }
    
    // If still no quotes, fallback to all quotes
    if (availableQuotes.length === 0) {
      Object.values(quotesData).forEach(catQuotes => {
        if (Array.isArray(catQuotes)) {
          availableQuotes = [...availableQuotes, ...catQuotes];
        }
      });
    }
    
    // Remove quotes already used by this user
    const freshQuotes = availableQuotes.filter(quote => 
      !usedQuotes.has(quote.text) && !recentQuotes.has(quote.text)
    );
    
    // If all quotes have been used, reset memory for this user
    let selectedQuote;
    if (freshQuotes.length === 0) {
      userMemory.set(userId, new Set());
      recentQuotes.clear();
      authorMemory.set(userId, new Set());
      selectedQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    } else {
      selectedQuote = freshQuotes[Math.floor(Math.random() * freshQuotes.length)];
    }
    
    // Update memory
    usedQuotes.add(selectedQuote.text);
    recentQuotes.add(selectedQuote.text);
    
    if (selectedQuote.author) {
      usedAuthors.add(selectedQuote.author);
    }
    
    // Clean up memory if too large
    if (usedQuotes.size > MAX_MEMORY_SIZE) {
      const array = Array.from(usedQuotes);
      usedQuotes.clear();
      // Keep only recent 100 quotes
      array.slice(-100).forEach(quote => usedQuotes.add(quote));
    }
    
    if (recentQuotes.size > 100) {
      const array = Array.from(recentQuotes);
      recentQuotes.clear();
      // Keep only recent 50 quotes
      array.slice(-50).forEach(quote => recentQuotes.add(quote));
    }
    
    // Create caption
    const emojiMap = {
      life: '🌱',
      love: '❤️',
      motivation: '💪',
      success: '🏆',
      wisdom: '🧠',
      philosophy: '🤔',
      funny: '😂',
      friendship: '👫',
      work: '💼',
      time: '⏰',
      author: '✍️',
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌇',
      night: '🌙',
      general: '💫'
    };
    
    const categoryEmoji = emojiMap[requestedType] || '💫';
    const timeEmoji = emojiMap[timeCategory];
    
    // Format the quote
    let caption = '';
    
    if (timeGreeting && requestedType !== timeCategory) {
      caption += `${timeGreeting}\n\n`;
    }
    
    caption += `*${categoryEmoji} ${isAuthorRequest ? 'Author Quote' : requestedType.charAt(0).toUpperCase() + requestedType.slice(1)} Quote*\n\n`;
    
    if (isAuthorRequest) {
      caption += `✍️ *Author:* ${requestedAuthor}\n`;
    } else if (selectedQuote.author) {
      caption += `✍️ *By:* ${selectedQuote.author}\n`;
    }
    
    if (!isAuthorRequest && requestedType !== timeCategory) {
      caption += `🕒 *Vibe:* ${timeEmoji} ${timeCategory.charAt(0).toUpperCase() + timeCategory.slice(1)}\n`;
    }
    
    caption += `\n"${selectedQuote.text}"\n\n`;
    
    if (selectedQuote.source) {
      caption += `📚 *Source:* ${selectedQuote.source}\n`;
    }
    
    caption += `_💭 Wisdom shared by Buddy-XTR_`;
    
    // Send message with image
    const imagePath = './media/quotes.jpg';
    
    if (fs.existsSync(imagePath)) {
      await Matrix.sendMessage(m.from, {
        image: fs.readFileSync(imagePath),
        caption: caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363313938933929@newsletter',
            newsletterName: "Buddy-XTR Quotes",
            serverMessageId: 999
          }
        }
      }, {
        quoted: m
      });
    } else {
      // Fallback without image
      await Matrix.sendMessage(m.from, {
        text: caption,
      }, {
        quoted: m
      });
    }
    
  } catch (error) {
    console.error('Quotes command error:', error);
    
    // Simple error fallback
    try {
      await Matrix.sendMessage(m.from, {
        text: `💭 *Quote Failed!*\n\nSometimes silence speaks volumes, but here's a quick one:\n\n"Even the wisest need reminders." - Buddy-XTR\n\n_Try: /quote [life/love/motivation/success/wisdom/funny/friendship/work/time]_`,
      }, {
        quoted: m
      });
    } catch (e) {
      console.error('Error fallback also failed:', e);
    }
  }
};

export default quotes;
