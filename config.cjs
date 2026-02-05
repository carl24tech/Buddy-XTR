// config.cjs
const fs = require("fs");
require("dotenv").config();

const config = {
  SESSION_ID: process.env.SESSION_ID || "Your Session Id",
  PREFIX: process.env.PREFIX || '.',
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN !== undefined ? process.env.AUTO_STATUS_SEEN === 'true' : true, 
  AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY !== undefined ? process.env.AUTO_STATUS_REPLY === 'true' : true,
  STATUS_READ_MSG: process.env.STATUS_READ_MSG || '',
  AUTO_DL: process.env.AUTO_DL !== undefined ? process.env.AUTO_DL === 'true' : false,
  AUTO_READ: process.env.AUTO_READ !== undefined ? process.env.AUTO_READ === 'true' : false,
  AUTO_TYPING: process.env.AUTO_TYPING !== undefined ? process.env.AUTO_TYPING === 'true' : false,
  AUTO_RECORDING: process.env.AUTO_RECORDING !== undefined ? process.env.AUTO_RECORDING === 'true' : false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE !== undefined ? process.env.ALWAYS_ONLINE === 'true' : false,
  AUTO_REACT: process.env.AUTO_REACT !== undefined ? process.env.AUTO_REACT === 'true' : false,
  /*auto block only for 212 */
  AUTO_BLOCK: process.env.AUTO_BLOCK !== undefined ? process.env.AUTO_BLOCK === 'true' : true,
  REJECT_CALL: process.env.REJECT_CALL !== undefined ? process.env.REJECT_CALL === 'true' : false, 
  NOT_ALLOW: process.env.NOT_ALLOW !== undefined ? process.env.NOT_ALLOW === 'true' : true,
  MODE: process.env.MODE || "public",
  BOT_NAME: process.env.BOT_NAME || "Buddy-XTR",
  MENU_IMAGE: process.env.MENU_IMAGE || "https://files.catbox.moe/7l1rr5.jpg",
  DESCRIPTION: process.env.DESCRIPTION || "Carlech",
  OWNER_NAME: process.env.OWNER_NAME || "Carl William",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "0740271632",
  GEMINI_KEY: process.env.GEMINI_KEY || "AIzaSyCUPaxfIdZawsKZKqCqJcC-GWiQPCXKTDc",
  WELCOME: process.env.WELCOME !== undefined ? process.env.WELCOME === 'true' : false, 
  
  // ========== GROUP & ADMIN FEATURES ==========
  ADMIN_LOG_GROUP: process.env.ADMIN_LOG_GROUP || "",
  NOTIFY_ADMIN_CHANGES: process.env.NOTIFY_ADMIN_CHANGES !== undefined ? process.env.NOTIFY_ADMIN_CHANGES === 'true' : true,
  SEND_RULES_DM: process.env.SEND_RULES_DM !== undefined ? process.env.SEND_RULES_DM === 'true' : false,
  AUTO_MUTE_SUSPICIOUS: process.env.AUTO_MUTE_SUSPICIOUS !== undefined ? process.env.AUTO_MUTE_SUSPICIOUS === 'true' : false,
  UPDATE_GROUP_STATS: process.env.UPDATE_GROUP_STATS !== undefined ? process.env.UPDATE_GROUP_STATS === 'true' : true,
  NOTIFY_BOT_ADMIN_STATUS: process.env.NOTIFY_BOT_ADMIN_STATUS !== undefined ? process.env.NOTIFY_BOT_ADMIN_STATUS === 'true' : false,
  CACHE_BOT_ADMIN_STATUS: process.env.CACHE_BOT_ADMIN_STATUS !== undefined ? process.env.CACHE_BOT_ADMIN_STATUS === 'true' : true,
  DEBUG_MODE: process.env.DEBUG_MODE !== undefined ? process.env.DEBUG_MODE === 'true' : false,
  LOG_ALL_EVENTS: process.env.LOG_ALL_EVENTS !== undefined ? process.env.LOG_ALL_EVENTS === 'true' : false,
};


module.exports = config;
