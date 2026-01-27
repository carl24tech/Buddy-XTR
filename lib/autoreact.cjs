const emojis = [
    "😂", "🔥", "❤️", "🤣", "👌", "👍", "🎉", "💯", "😎", "😍",
    "👏", "😅", "🙌", "🤩", "💀", "😆", "😜", "😇", "😉", "🥳"
];

/**
 * Function to react to a message with a random emoji
 * @param {string} emoji - Emoji to react with
 * @param {Object} message - The message object
 * @param {Object} sock - WhatsApp client instance
 */
async function doReact(emoji, message, sock) {
    try {
        if (!message || !message.key) return;
        
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
        console.log(`✅ Reacted to message with ${emoji}`);
    } catch (error) {
        console.error("❌ Auto-React Error:", error);
    }
}

module.exports = { emojis, doReact };
