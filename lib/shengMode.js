const shengMode = {
    enabled: false, // Default state is OFF (even after restart)
    users: {} // To track conversation state for each user
};

// Sheng trigger words (fixed to ensure all work correctly)
const triggerWords = [
    "yooh", "wozza", "mzee", "mkuu niaje", "bro", "sup", "mambo", "uko aje", "mkuu",
    "niaje", "freshi", "sasa", "rada", "vipi", "kiongos", "form ni gani", "gotea", "luku",
    "mbogi", "rieng", "mca", "nadai bot", "niko fiti", "buda", "niko rada"
];

// Sheng responses (fixed to ensure correct matching)
const shengReplies = {
    "bera": "Yooh semaje mzee, unadai bot ama?",
    "wozza": "Wozza mzee, form ni gani mkuu?",
    "mzee": "Sema mzee, form ni gani? Uko poa?",
    "mkuu niaje": "Poa mzee? semaje mkuu ",
    "bro": "Rada mkuu semaje?",
    "sup": "Sup, bruv semaje",
    "mambo": "Poa sana mkuu. Unasema aje?",
    "uko aje": "Niko poa mkuu, maybe wewe?",
    "kiongos": "rada mkuu 😂",
    "freshi": "Freshi kama mdogo, form ni sawa!",
    "hustle": "Hustle aje, lazima upige kazi na enjoy maisha!",
    "sherehe": "Sherehe iko fiti sana, unataka kuja?",
    "kiende": "Kiende, bro! Life ni safari, enjoy the ride!",
    "form ni gani": "huskii sina form 😂🫴",
    "manze": "jooh, 😂😂🫴",
    "niko radar": "Niko radar, kila kitu kiko poa!"
};

// Positive responses for confirmation steps
const positiveResponses = ["yes", "yap", "eeh", "tuma", "tuma link", "eeh tuma link", "tuma mkuu", "eeh nko ready"];

// Responses for different user inputs
const declineResponses = ["zae", "zii", "siko ready"];
const paymentResponses = ["nko na 50 mkuu", "nko na 60 mkuu", "nko na 60", "nko na 50"];
const postponeResponses = ["payment after serving", "eka kwanza", "eka bot kwanza"];

// Toggle Sheng Mode ON/OFF
const shengCommand = async (m) => {
    if (m.isGroup) return; // Ignore group chats

    const text = m.body.toLowerCase().trim();

    if (text === "sheng on") {
        shengMode.enabled = true;
        return m.reply("✅ *Sheng AI Mode activated!* Mkuu ndo kurudi😂🫴!");
    }

    if (text === "sheng off") {
        shengMode.enabled = false;
        return m.reply("🚫 *Sheng AI Mode deactivated!* Nime chill sasa mkuu😂🫴");
    }
};

// Main Sheng AI Chat function
const shengChat = async (m) => {
    if (!shengMode.enabled || m.isGroup) return; // Ignore if disabled or in groups

    const text = m.body.toLowerCase().trim();
    const sender = m.sender;

    // If message is exactly a trigger word, start Sheng Mode chat
    if (triggerWords.includes(text)) {
        m.reply("Yooh semaje mzee, unadai bot ama?");
        shengMode.users[sender] = "waitingForYes";
        return;
    }

    // User confirms wanting the link
    if (shengMode.users[sender] === "waitingForYes" && positiveResponses.includes(text)) {
        m.reply("Naeka na 80 mkuu, uko ready nitume link?");
        shengMode.users[sender] = "waitingForConfirm";
        return;
    }

    // User declines
    if (shengMode.users[sender] === "waitingForConfirm" && declineResponses.includes(text)) {
        m.reply("Haina noma mkuu");
        delete shengMode.users[sender];
        return;
    }

    // User offers partial payment
    if (shengMode.users[sender] === "waitingForConfirm" && paymentResponses.includes(text)) {
        m.reply("Ok poa mkuu, tuma kwa hii number 0743982206");
        delete shengMode.users[sender];
        return;
    }

    // User wants to pay after receiving
    if (shengMode.users[sender] === "waitingForConfirm" && postponeResponses.includes(text)) {
        m.reply("Ok mkuu, haina noma");
        delete shengMode.users[sender];
        return;
    }

    // User confirms payment and gets the link
    if (shengMode.users[sender] === "waitingForConfirm" && positiveResponses.includes(text)) {
        m.reply("✅ Ndo hii mkuu, pair then tuma session ID:\nhttps://projext-session-server-a9643bc1be6b.herokuapp.com/");
        delete shengMode.users[sender];
        return;
    }

    // Reset state if the user says something unrelated
    if (shengMode.users[sender]) {
        delete shengMode.users[sender];
    }

    // Check if any keyword is included in the user's message
    for (const key in shengReplies) {
        if (text.includes(key)) {
            m.reply(shengReplies[key]);
            return;
        }
    }
};

export { shengChat, shengCommand };
