import nodeFetch from 'node-fetch';
import config from '../config.cjs';

const flirting = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  const validCommands = ['flirt'];

  if (validCommands.includes(cmd)) {
    try {
      // Local array of sweet flirts (endless by using modulo to cycle through)
      const sweetFlirts = [
        "If beauty were time, you'd be an eternity.",
        "Are you a magician? Because whenever I look at you, everyone else disappears.",
        "Do you have a map? I keep getting lost in your eyes.",
        "Is your name Google? Because you have everything I've been searching for.",
        "Are you made of copper and tellurium? Because you're Cu-Te.",
        "If you were a vegetable, you'd be a cute-cumber.",
        "Are you a camera? Because every time I look at you, I smile.",
        "Do you believe in love at first sight, or should I walk by again?",
        "Is your dad a boxer? Because you're a knockout!",
        "If you were a fruit, you'd be a fine-apple.",
        "Do you have a sunburn, or are you always this hot?",
        "Are you French? Because Eiffel for you.",
        "Can I follow you home? Cause my parents always told me to follow my dreams.",
        "Is there an airport nearby or is it my heart taking off?",
        "Do you have a Band-Aid? Because I just scraped my knee falling for you.",
        "Are you a time traveler? Because I see you in my future.",
        "Are you a parking ticket? Because you've got FINE written all over you.",
        "Do you like Star Wars? Because Yoda only one for me.",
        "Are you a bank loan? Because you have my interest.",
        "If you were words on a page, you'd be fine print.",
        "Do you have a name, or can I call you mine?",
        "Are you a campfire? Because you're hot and I want s'more.",
        "Is your heart a library? Because I'm checking you out.",
        "Are you a rainbow? Because you color my world.",
        "Do you have a pencil? Because I want to erase your past and write our future.",
        "Are you a snowflake? Because you're one of a kind.",
        "If you were a cat, you'd purr-fect.",
        "Are you a keyboard? Because you're just my type.",
        "Do you have a mirror in your pocket? Because I can see myself in your pants.",
        "Are you an alien? Because you just abducted my heart.",
        "If you were a triangle, you'd be acute one.",
        "Do you have a sunburn, or are you always this hot?",
        "Are you made of beryllium, gold, and titanium? Because you're Be-Au-Ti-ful.",
        "Do you believe in destiny? Because I think we were meant to meet.",
        "Are you a WiFi signal? Because I'm feeling a connection.",
        "If you were a song, you'd be the best track on the album.",
        "Are you a magician? Because you've cast a spell on me.",
        "Do you have a name, or can I call you gorgeous?",
        "Are you a candle? Because you light up the room.",
        "If you were a vegetable, you'd be a sweet potato.",
        "Are you a chocolate bar? Because you're sweet and I can't resist you.",
        "Do you have a compass? Because I keep getting lost in your direction.",
        "Are you a dream? Because I don't want to wake up.",
        "If you were a season, you'd be summer because you make everything brighter.",
        "Are you a treasure map? Because X marks the spot where my heart is.",
        "Do you have a license? Because you're driving me crazy.",
        "Are you a puzzle? Because I can't figure you out, but I want to.",
        "If you were a font, you'd be Comic Sans because you make me smile.",
        "Are you a cookie? Because you're irresistible.",
        "Do you have a twin? Because I'd love to meet them too.",
        "Are you a constellation? Because you're out of this world.",
        "If you were a drink, you'd be a fine wine getting better with time.",
        "Are you a bookmark? Because I want to save this moment with you.",
        "Do you have a charger? Because my phone died looking at your picture.",
        "Are you a garden? Because I want to plant my lips on you.",
        "If you were a planet, you'd be the brightest one in the sky.",
        "Are you a poem? Because I want to read you over and over.",
        "Do you have a warranty? Because I want you forever.",
        "Are you a melody? Because you're music to my ears.",
        "If you were a book, you'd be a bestseller.",
        "Are you a sunrise? Because you make my mornings better.",
        "Do you have a map to your heart? Because I'd love to explore it.",
        "Are you a diamond? Because you're precious and rare.",
        "If you were a color, you'd be blush pink.",
        "Are you a secret? Because I want to discover you.",
        "Do you have a ticket? Because you just won a place in my heart.",
        "Are you a star? Because you shine brighter than the rest.",
        "If you were a dessert, you'd be sweet as pie.",
        "Are you a feather? Because you're light as air and beautiful.",
        "Do you have a remote? Because you just paused my heart.",
        "Are you a wish? Because you came true.",
        "If you were a scent, you'd be irresistible.",
        "Are you a butterfly? Because you make my heart flutter.",
        "Do you have a recipe? Because you're the perfect ingredient for happiness.",
        "Are you a cloud? Because you make my head in the sky.",
        "If you were a season, you'd be spring because you make everything bloom.",
        "Are you a lighthouse? Because you guide me through dark times.",
        "Do you have a secret garden? Because I'd love to be let in.",
        "Are you a photograph? Because I can't stop looking at you.",
        "If you were a word, you'd be 'beautiful' in every language.",
        "Are you a heartbeat? Because you make mine race.",
        "Do you have a magic wand? Because you've enchanted me.",
        "Are you a rainbow after the storm? Because you bring color to my life.",
        "If you were a memory, you'd be my favorite one.",
        "Are you a gentle breeze? Because you take my breath away.",
        "Do you have a key? Because you've unlocked my heart.",
        "Are you a masterpiece? Because you're a work of art.",
        "If you were a song lyric, you'd be the most romantic one.",
        "Are you a cozy blanket? Because you make me feel warm inside.",
        "Do you have a sunrise alarm? Because you wake up my heart.",
        "Are you a handwritten letter? Because you're personal and precious.",
        "If you were a constellation, you'd be the one I wish upon.",
        "Are you a sweet melody? Because you're always on my mind.",
        "Do you have a treasure chest? Because you're worth more than gold.",
        "Are you a gentle touch? Because you've touched my soul.",
        "If you were a story, you'd be my favorite chapter."
      ];

      // Get a random flirt from the array
      const randomIndex = Math.floor(Math.random() * sweetFlirts.length);
      const result = sweetFlirts[randomIndex];
      
      await Matrix.sendMessage(m.from, { text: result, mentions: [m.sender] }, { quoted: m });
    } catch (error) {
      console.error('Error sending flirt message:', error);
      await Matrix.sendMessage(m.from, { text: "Failed to send flirt message. Please try again later." });
    }
  }
};

export default flirting;