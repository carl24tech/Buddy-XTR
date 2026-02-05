//  (ESM)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.cjs";

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// SETUP
const CATEGORIES = [
  "download",
  "converter",
  "ai",
  "tools",
  "group",
  "search",
  "main",
  "owner",
  "stalk"
];

const CATEGORY_NAMES = {
  download: "📥 Download",
  converter: "🔄 Converter",
  ai: "🤖 AI",
  tools: "🔧 Tools",
  group: "👥 Group",
  search: "🔍 Search",
  main: "🏠 Main",
  owner: "👑 Owner",
  stalk: "👀 Stalk"
};

// Number → category mapping
const CATEGORY_INDEX = {
  1: "download",
  2: "converter",
  3: "ai",
  4: "tools",
  5: "group",
  6: "search",
  7: "main",
  8: "owner",
  9: "stalk"
};

// Audio file path
const AUDIO_FILE_PATH = path.join(__dirname, "../Buddy/nothing.mp3");


async function loadCategory(category) {
  try {
    // FIXED
    const databasePath = path.join(process.cwd(), "database", `${category}.js`);
    
    // Check if file exists first
    if (!fs.existsSync(databasePath)) {
      console.warn(`Database file not found: ${databasePath}`);
      return [];
    }

    // FIXED: Use dynamic import with proper URL
    const module = await import(databasePath + `?t=${Date.now()}`);
    return Array.isArray(module.default) ? module.default : [];
  } catch (e) {
    console.error(`Failed to load ${category}:`, e.message);
    return [];
  }
}

async function loadAllCategories() {
  const data = {};
  for (const cat of CATEGORIES) {
    data[cat] = await loadCategory(cat);
  }
  return data;
}

// Cache to prevent reloading on every numeric reply
let commandCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

async function getCachedCategories() {
  const now = Date.now();
  if (!commandCache || (now - cacheTimestamp) > CACHE_DURATION) {
    commandCache = await loadAllCategories();
    cacheTimestamp = now;
    console.log("Command cache refreshed");
  }
  return commandCache;
}

async function sendAudioResponse(Matrix, from, quoted = null) {
  try {
    
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
      console.warn(`Audio file not found: ${AUDIO_FILE_PATH}`);
      return;
    }

    // Read audio file
    const audioBuffer = fs.readFileSync(AUDIO_FILE_PATH);
    
    // Send as voice note
    await Matrix.sendMessage(
      from,
      {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: true, // Push-to-talk (voice note)
        waveform: [0, 0, 0, 0, 0, 0, 0, 0] // Optional: waveform for visual
      },
      { quoted }
    );
    
    console.log("Audio response sent successfully");
  } catch (audioError) {
    console.error("Failed to send audio response:", audioError.message);
    // Don't throw error, just log it
  }
}

// ==============================
// HELPERS
// ==============================
function getSenderName(m) {
  return m.pushName || m.sender?.split("@")[0] || "User";
}

function isNumericReply(text) {
  return /^[1-9]$/.test(text);
}

// ==============================
// MENU UI GENERATORS
// ==============================
function generateMainMenu(categoryData, senderName, prefix) {
  const total = Object.values(categoryData).flat().length;

  let lines = [];
  let i = 1;

  for (const cat of CATEGORIES) {
    const count = categoryData[cat]?.length || 0;
    lines.push(`${i}. ${CATEGORY_NAMES[cat]} (${count})`);
    i++;
  }

  return `
╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
│👋 Hello, ${senderName}
│
│📊 *Bot Info*
│├ Prefix: ${prefix}
│├ Mode: ${config.MODE}
│└ Commands: ${total}
│
│📁 *Categories*
│
${lines.map(l => `│ ${l}`).join("\n")}
│
╰━━━━━━━━━━━━━━━━━━━━━━━┈⊷
📌 *Reply with a number (1–9)*
`.trim();
}

function generateCategoryMenu(category, commands, prefix) {
  const commandList = commands && commands.length > 0 
    ? commands.map((c, i) => `│ ${i + 1}. ${prefix}${c}`).join("\n")
    : "│ No commands available";

  return `
╭━━〔 *${CATEGORY_NAMES[category]}* 〕━━┈⊷
│📦 Total Commands: ${commands?.length || 0}
│
${commandList}
│
╰━━━━━━━━━━━━━━━━━━━━━━━┈⊷
📌 Type *${prefix}menu* to go back
`.trim();
}

// ==============================
// MAIN MENU HANDLER
// ==============================
const menu = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const text = (m.body || "").trim();
    const senderName = getSenderName(m);

    // FIXED: Use cached categories for better performance
    const categoryData = await getCachedCategories();

    // 1️⃣ NUMERIC REPLY (1–9)
    if (isNumericReply(text)) {
      const num = Number(text);
      const category = CATEGORY_INDEX[num];
      
      if (!category) {
        return Matrix.sendMessage(
          m.from,
          { text: "❌ Invalid number. Please reply with 1-9." },
          { quoted: m }
        );
      }

      const commands = categoryData[category] || [];
      
      if (!commands.length) {
        return Matrix.sendMessage(
          m.from,
          { text: `❌ No commands available in ${CATEGORY_NAMES[category]}` },
          { quoted: m }
        );
      }

      return Matrix.sendMessage(
        m.from,
        {
          text: generateCategoryMenu(category, commands, prefix)
        },
        { quoted: m }
      );
    }

    // 2️⃣ .menu COMMAND
    if (text === `${prefix}menu`) {
      // Send the menu first
      await Matrix.sendMessage(
        m.from,
        {
          text: generateMainMenu(categoryData, senderName, prefix)
        },
        { quoted: m }
      );
      
      // Then send audio response
      await sendAudioResponse(Matrix, m.from, m);
      return;
    }

    // 3️⃣ DIRECT CATEGORY (.ai, .tools, etc)
    if (text.startsWith(prefix)) {
      const cmd = text.slice(prefix.length).split(" ")[0];
      if (CATEGORIES.includes(cmd)) {
        const commands = categoryData[cmd] || [];

        return Matrix.sendMessage(
          m.from,
          {
            text: generateCategoryMenu(cmd, commands, prefix)
          },
          { quoted: m }
        );
      }
    }

  } catch (err) {
    console.error("Menu error:", err);
    await Matrix.sendMessage(
      m.from,
      { text: "❌ Menu error. Type *.menu* to retry." },
      { quoted: m }
    );
  }
};

export default menu;
