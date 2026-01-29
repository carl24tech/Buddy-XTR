import { writeFile } from 'fs/promises';
import config from '../config.cjs';

const groupInfoCommand = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const args = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['ginfo', 'gpinfo', 'groupinfo', 'gcinfo'];

  if (validCommands.includes(cmd)) {
    try {
      // Function to format creation date
      const formatCreationDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
      };

      // Function to fetch and format group info
      const getGroupInfo = async (groupId, sock) => {
        try {
          const groupMetadata = await sock.groupMetadata(groupId);
          const participants = groupMetadata.participants;
          
          // Get creator info
          const creator = groupMetadata.owner || 'Unknown';
          
          // Get admins
          const admins = participants.filter(p => p.admin).map(p => p.id);
          
          // Prepare response
          let response = `*Group Info*\n\n`;
          response += `*Name:* ${groupMetadata.subject}\n`;
          response += `*Description:* ${groupMetadata.desc || 'No description'}\n`;
          response += `*Created:* ${formatCreationDate(groupMetadata.creation)}\n`;
          response += `*Creator:* ${creator}\n`;
          response += `*Total Members:* ${participants.length}\n`;
          response += `*Admins:* ${admins.length}\n`;
          
          // Try to get group picture
          try {
            const ppUrl = await sock.profilePictureUrl(groupId, 'image');
            return { response, ppUrl };
          } catch (e) {
            return { response };
          }
        } catch (error) {
          throw error;
        }
      };

      // Check if the command is used in a group
      const isGroup = m.isGroup;
      const groupLink = args.trim();

      if (isGroup) {
        // Fetch info for the current group
        const { response, ppUrl } = await getGroupInfo(m.from, sock);
        
        if (ppUrl) {
          await sock.sendMessage(m.from, { 
            image: { url: ppUrl },
            caption: response
          }, { quoted: m });
        } else {
          await sock.sendMessage(m.from, { text: response }, { quoted: m });
        }
      } else if (groupLink) {
        // Handle group invite link
        if (!groupLink.includes('chat.whatsapp.com')) {
          await sock.sendMessage(m.from, { text: 'Please provide a valid WhatsApp group invite link.' }, { quoted: m });
          return;
        }
        
        // Extract group ID from link
        const groupId = groupLink.split('/').pop();
        
        try {
          // Verify the group exists and get basic info first
          const inviteInfo = await sock.groupGetInviteInfo(groupId);
          
          // Now fetch full metadata
          const { response, ppUrl } = await getGroupInfo(inviteInfo.id, sock);
          
          if (ppUrl) {
            await sock.sendMessage(m.from, { 
              image: { url: ppUrl },
              caption: response
            }, { quoted: m });
          } else {
            await sock.sendMessage(m.from, { text: response }, { quoted: m });
          }
        } catch (error) {
          console.error("Error fetching group info from link:", error);
          await sock.sendMessage(m.from, { 
            text: 'Error fetching group info. Make sure:\n1. The link is valid\n2. You have permission to view this group\n3. The group exists'
          }, { quoted: m });
        }
      } else {
        // Command used in private chat without link
        await sock.sendMessage(m.from, { 
          text: 'Please use this command in a group or provide a group invite link.\n\nExample: .gcinfo https://chat.whatsapp.com/XXXXXXXXXXXX'
        }, { quoted: m });
      }
    } catch (error) {
      console.error("Error in group info command:", error);
      await sock.sendMessage(m.from, { text: 'An error occurred while fetching group information.' }, { quoted: m });
    }
  }
};

export default groupInfoCommand;
