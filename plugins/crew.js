import fs from 'fs';

const crew = async (m, Matrix) => {
  const prefix = process.env.PREFIX || '!';
  
  // Extract command
  const fullText = m.body || '';
  if (!fullText.startsWith(prefix)) return;
  
  const cmd = fullText.slice(prefix.length).trim().split(' ')[0].toLowerCase();
  if (cmd !== 'crew') return;
  
  // Get group name
  const groupName = fullText.slice(prefix.length + cmd.length).trim();
  
  try {
    // Check if group name is provided
    if (!groupName) {
      // Interactive button message for group name suggestions
      const buttonMessage = {
        text: `🏗️ *CREATE WHATSAPP GROUP*\n\nPlease provide a group name after the command.\n\n*Example:*\n\`${prefix}crew Gaming Squad\`\n\`${prefix}crew Study Group\`\n\`${prefix}crew Family Chat\`\n\n*Quick Options:*`,
        footer: "Crew Command v1.0",
        buttons: [
          { buttonId: `${prefix}crew Gaming Group`, buttonText: { displayText: "🎮 Gaming" }, type: 1 },
          { buttonId: `${prefix}crew Study Session`, buttonText: { displayText: "📚 Study" }, type: 1 },
          { buttonId: `${prefix}crew Work Team`, buttonText: { displayText: "💼 Work" }, type: 1 }
        ],
        headerType: 1
      };
      
      return await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
    }
    
    // Check if we're in a group or private
    const isGroup = m.from.endsWith('@g.us');
    
    if (isGroup) {
      // In a group - check admin status
      try {
        const groupMetadata = await Matrix.groupMetadata(m.from);
        const participant = groupMetadata.participants.find(p => p.id === m.sender);
        
        if (!participant || !['admin', 'superadmin'].includes(participant.admin)) {
          return await Matrix.sendMessage(m.from, {
            text: "❌ *Permission Denied!*\nOnly group admins can create new groups from here.\n\nTry using this command in a private chat with the bot."
          }, { quoted: m });
        }
      } catch (err) {
        console.log("Could not fetch group metadata:", err);
      }
    }
    
    // Send processing message
    await Matrix.sendMessage(m.from, {
      text: `⏳ Creating group "${groupName}"...\nPlease wait a moment.`,
      footer: "Processing..."
    }, { quoted: m });
    
    // Create participants list
    const participants = [m.sender];
    
    // Add bot to group if possible
    try {
      const botNumber = Matrix.user?.id?.split(':')[0];
      if (botNumber) {
        const botJid = `${botNumber}@s.whatsapp.net`;
        if (!participants.includes(botJid)) {
          participants.push(botJid);
        }
      }
    } catch (e) {
      console.log("Could not add bot to participants:", e);
    }
    
    // Create the group
    const createdGroup = await Matrix.groupCreate(groupName, participants);
    const groupId = createdGroup.id || createdGroup.gid;
    
    // Get group metadata for info
    let groupMetadata;
    try {
      groupMetadata = await Matrix.groupMetadata(groupId);
    } catch (e) {
      groupMetadata = { participants: participants, subject: groupName };
    }
    
    // Generate invite link
    let inviteCode = '';
    let inviteLink = '';
    try {
      inviteCode = await Matrix.groupInviteCode(groupId);
      inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
    } catch (e) {
      console.log("Could not generate invite link:", e);
      inviteLink = "Link unavailable - try !invite later";
    }
    
    // Get current date/time
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create group info message
    const groupInfo = `✅ *GROUP CREATED SUCCESSFULLY!*\n\n` +
                     `*🏷️ Group Name:* ${groupName}\n` +
                     `*🆔 Group ID:* ${groupId}\n` +
                     `*👥 Members:* ${groupMetadata.participants?.length || participants.length}\n` +
                     `*📅 Created:* ${formattedDate}\n` +
                     `*⏰ Time:* ${formattedTime}\n` +
                     `*👑 Creator:* @${m.sender.split('@')[0]}\n\n`;
    
    // Create main message with buttons
    const successMessage = {
      text: groupInfo + `*🔗 Invite Link:*\n${inviteLink}\n\n*Use buttons below to manage:*`,
      mentions: [m.sender],
      footer: "Group created with Crew Command",
      templateButtons: [
        {
          index: 1,
          urlButton: {
            displayText: "📱 OPEN GROUP",
            url: inviteLink.startsWith('http') ? inviteLink : `https://wa.me/${groupId.split('@')[0]}`
          }
        },
        {
          index: 2,
          quickReplyButton: {
            displayText: "📋 GROUP INFO",
            id: `${prefix}groupinfo ${groupId}`
          }
        },
        {
          index: 3,
          quickReplyButton: {
            displayText: "👥 ADD MEMBERS",
            id: `${prefix}add ${groupId}`
          }
        }
      ]
    };
    
    await Matrix.sendMessage(m.from, successMessage, { quoted: m });
    
    // Send welcome message to the new group
    try {
      const welcomeMsg = `🎊 *WELCOME TO ${groupName.toUpperCase()}!*\n\n` +
                        `This group was created by @${m.sender.split('@')[0]}.\n\n` +
                        `*📌 Basic Commands:*\n` +
                        `• ${prefix}rules - Set group rules\n` +
                        `• ${prefix}admin - List admins\n` +
                        `• ${prefix}tagall - Mention everyone\n` +
                        `• ${prefix}invite - Get invite link\n` +
                        `• ${prefix}help - Show all commands\n\n` +
                        `Enjoy your new group! 🎉`;
      
      await Matrix.sendMessage(groupId, {
        text: welcomeMsg,
        mentions: [m.sender],
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      });
      
      // Send follow-up management buttons
      await Matrix.sendMessage(groupId, {
        text: "🛠️ *Group Management Panel*",
        footer: "Click a button to manage",
        buttons: [
          { buttonId: `${prefix}setdesc`, buttonText: { displayText: "📝 Set Description" }, type: 1 },
          { buttonId: `${prefix}settings`, buttonText: { displayText: "⚙️ Settings" }, type: 1 },
          { buttonId: `${prefix}link`, buttonText: { displayText: "🔗 Get Link" }, type: 1 }
        ]
      });
      
    } catch (welcomeError) {
      console.log("Could not send welcome message:", welcomeError);
    }
    
    // Save group info to file (optional)
    try {
      const groupData = {
        name: groupName,
        id: groupId,
        creator: m.sender,
        created: now.toISOString(),
        inviteLink: inviteLink,
        participants: participants
      };
      
      const groupsFile = './groups.json';
      let groups = [];
      
      if (fs.existsSync(groupsFile)) {
        groups = JSON.parse(fs.readFileSync(groupsFile, 'utf8'));
      }
      
      groups.push(groupData);
      fs.writeFileSync(groupsFile, JSON.stringify(groups, null, 2));
      
    } catch (fileError) {
      console.log("Could not save group data:", fileError);
    }
    
  } catch (error) {
    console.error("Crew command error:", error);
    
    // Detailed error message
    let errorMsg = `❌ *FAILED TO CREATE GROUP*\n\n`;
    
    if (error.message.includes("401") || error.message.includes("auth")) {
      errorMsg += "*Reason:* Authentication error. The bot may need to reconnect.\n";
    } else if (error.message.includes("409")) {
      errorMsg += "*Reason:* Group name conflict or duplicate.\n";
    } else if (error.message.includes("429")) {
      errorMsg += "*Reason:* Too many requests. Please wait.\n";
    } else if (error.message.includes("participant")) {
      errorMsg += "*Reason:* Invalid participant(s).\n";
    } else {
      errorMsg += `*Reason:* ${error.message || "Unknown error"}\n`;
    }
    
    errorMsg += `\n*💡 Solutions:*\n` +
               `1. Try a different group name\n` +
               `2. Ensure bot is properly connected\n` +
               `3. Check your internet connection\n` +
               `4. Wait a few minutes and try again`;
    
    await Matrix.sendMessage(m.from, {
      text: errorMsg,
      footer: "Error Code: CREW_001",
      buttons: [
        { buttonId: 'retry_crew', buttonText: { displayText: "🔄 Retry" }, type: 1 },
        { buttonId: 'help_crew', buttonText: { displayText: "❓ Help" }, type: 1 }
      ]
    }, { quoted: m });
  }
};

export default crew;
