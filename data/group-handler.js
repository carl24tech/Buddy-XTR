import moment from 'moment-timezone';
import config from '../config.cjs';

export default async function GroupParticipants(sock, { id, participants, action }) {
   try {
      const metadata = await sock.groupMetadata(id);
      
      // Get bot's JID and check if bot is admin
      const botJid = sock.user?.id?.split(':')[0] ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user?.id;
      let isBotAdmin = false;
      
      // Try to find bot in participants
      if (botJid && metadata.participants) {
         const botParticipant = metadata.participants.find(p => p.id === botJid);
         isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      }
      
      console.log(`🤖 Bot admin status in group "${metadata.subject}": ${isBotAdmin}`);

      // Process each participant in the event
      for (const jid of participants) {
         // Get user's profile picture
         let profile;
         try {
            profile = await sock.profilePictureUrl(jid, "image");
         } catch {
            profile = "https://lh3.googleusercontent.com/proxy/esjjzRYoXlhgNYXqU8Gf_3lu6V-eONTnymkLzdwQ6F6z0MWAqIwIpqgq_lk4caRIZF_0Uqb5U8NWNrJcaeTuCjp7xZlpL48JDx-qzAXSTh00AVVqBoT7MJ0259pik9mnQ1LldFLfHZUGDGY=w1200-h630-p-k-no-nu";
         }

         // Get user info for better messaging
         let userInfo;
         try {
            userInfo = await sock.onWhatsApp(jid);
         } catch {
            userInfo = [{ exists: true, jid }];
         }
         
         const userExists = userInfo[0]?.exists;
         const userName = userInfo[0]?.name || jid.split("@")[0];
         
         // Handle different actions
         switch (action) {
            case "add":
               await handleUserAdd(sock, id, metadata, jid, userName, profile, isBotAdmin);
               break;
               
            case "remove":
               await handleUserRemove(sock, id, metadata, jid, userName, profile, isBotAdmin);
               break;
               
            case "promote":
               await handleUserPromote(sock, id, metadata, jid, userName, isBotAdmin);
               break;
               
            case "demote":
               await handleUserDemote(sock, id, metadata, jid, userName, isBotAdmin);
               break;
               
            default:
               console.log(`Unknown action: ${action} for user ${userName}`);
         }
      }
      
      // Post-event admin actions
      if (isBotAdmin) {
         await postEventAdminActions(sock, id, metadata, action);
      }
      
   } catch (error) {
      console.error("❌ Error in GroupParticipants handler:", error);
      await handleError(sock, error, id);
   }
}

// ========== HELPER FUNCTIONS ==========

async function handleUserAdd(sock, groupId, metadata, jid, userName, profile, isBotAdmin) {
   if (!config.WELCOME) return;
   
   const joinTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const joinDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   const membersCount = metadata.participants.length;
   
   // Send welcome message
   await sock.sendMessage(groupId, {
      text: `> Hello @${userName}! Welcome to *${metadata.subject}*.\n> You are the ${membersCount}th member.\n> Joined at: ${joinTime} on ${joinDate}
"`, contextInfo: {
         mentionedJid: [jid],
         externalAdReply: {
            title: `👋 Welcome to ${metadata.subject}`,
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: true,
            thumbnailUrl: profile,
            sourceUrl: 'https://sid-bhai.vercel.app'
         }
      }
   });
   
   // Admin-specific actions for new members
   if (isBotAdmin) {
      await adminActionsOnUserAdd(sock, groupId, metadata, jid, userName);
   }
}

async function handleUserRemove(sock, groupId, metadata, jid, userName, profile, isBotAdmin) {
   if (!config.WELCOME) return;
   
   const leaveTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const leaveDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   const membersCount = metadata.participants.length;
   
   // Send goodbye message
   await sock.sendMessage(groupId, {
      text: `> Goodbye @${userName} from ${metadata.subject}.\n> We are now ${membersCount} in the group.\n> Left at: ${leaveTime} on ${leaveDate}"`, contextInfo: {
         mentionedJid: [jid],
         externalAdReply: {
            title: `👋 Goodbye`,
            mediaType: 1,
            previewType: 0,
            renderLargerThumbnail: true,
            thumbnailUrl: profile,
            sourceUrl: 'https://sid-bhai.vercel.app'
         }
      }
   });
   
   // Admin-specific actions when user leaves
   if (isBotAdmin) {
      await adminActionsOnUserRemove(sock, groupId, metadata, jid, userName);
   }
}

async function handleUserPromote(sock, groupId, metadata, jid, userName, isBotAdmin) {
   const eventTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const eventDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   
   console.log(`👑 ${userName} was promoted to admin in ${metadata.subject}`);
   
   // Send promotion notification if configured
   if (config.NOTIFY_ADMIN_CHANGES && isBotAdmin) {
      await sock.sendMessage(groupId, {
         text: `🎉 Congratulations @${userName}! You've been promoted to Admin.\nTime: ${eventTime} on ${eventDate}`,
         contextInfo: { mentionedJid: [jid] }
      });
   }
   
   // Admin log for promotion
   if (isBotAdmin && config.ADMIN_LOG_GROUP) {
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `📋 ADMIN PROMOTION LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Action: Promoted to Admin\n• Time: ${eventTime} ${eventDate}\n• Total Admins: ${metadata.participants.filter(p => p.admin).length}`
      });
   }
}

async function handleUserDemote(sock, groupId, metadata, jid, userName, isBotAdmin) {
   const eventTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
   const eventDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
   
   console.log(`📉 ${userName} was demoted from admin in ${metadata.subject}`);
   
   // Admin log for demotion
   if (isBotAdmin && config.ADMIN_LOG_GROUP) {
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `📋 ADMIN DEMOTION LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Action: Demoted from Admin\n• Time: ${eventTime} ${eventDate}\n• Total Admins: ${metadata.participants.filter(p => p.admin).length}`
      });
   }
}

// ========== ADMIN-SPECIFIC FUNCTIONS ==========

async function adminActionsOnUserAdd(sock, groupId, metadata, jid, userName) {
   console.log(`⚙️ Performing admin actions for new user ${userName}`);
   
   // Example admin actions (uncomment what you need):
   
   // 1. Auto-assign participant number
   const welcomeMsg = `Welcome @${userName}! You're member #${metadata.participants.length}.`;
   
   // 2. Check if user is a new account (by creation date if available)
   // This requires additional user info tracking
   
   // 3. Send rules to new member via DM
   if (config.SEND_RULES_DM) {
      try {
         await sock.sendMessage(jid, {
            text: `📜 *Group Rules for ${metadata.subject}*\n\n1. Be respectful to everyone\n2. No spam or advertisements\n3. Follow the group topic\n4. No NSFW content\n\nWelcome to the group!`
         });
      } catch (error) {
         console.log(`Cannot send DM to ${userName}: ${error.message}`);
      }
   }
   
   // 4. Log new member in admin channel
   if (config.ADMIN_LOG_GROUP) {
      const joinTime = moment.tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY');
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `🆕 NEW MEMBER LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Joined: ${joinTime}\n• Total Members: ${metadata.participants.length}`
      });
   }
   
   // 5. Auto-mute if suspicious (example - implement your own logic)
   if (config.AUTO_MUTE_SUSPICIOUS) {
      // Check if user has default/no profile picture
      // Check if username is numeric only (might be fake)
      // You'd implement your own suspicious detection logic here
   }
}

async function adminActionsOnUserRemove(sock, groupId, metadata, jid, userName) {
   console.log(`⚙️ Performing admin actions for removed user ${userName}`);
   
   // 1. Log user leave in admin channel
   if (config.ADMIN_LOG_GROUP) {
      const leaveTime = moment.tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY');
      await sock.sendMessage(config.ADMIN_LOG_GROUP, {
         text: `🚪 MEMBER LEAVE LOG\n\n• Group: ${metadata.subject}\n• User: ${userName}\n• Left: ${leaveTime}\n• Remaining Members: ${metadata.participants.length}`
      });
   }
   
   // 2. Check if user was warned/banned recently
   // This would require a database to track user warnings
   
   // 3. Clean up user-specific data
   // Remove from any bot databases, clear warnings, etc.
   
   // 4. If user was kicked by bot or admin, log reason
   // This requires tracking who performed the removal
}

async function postEventAdminActions(sock, groupId, metadata, action) {
   // Actions to perform after processing all participants
   
   // 1. Update group statistics
   if (config.UPDATE_GROUP_STATS) {
      console.log(`📊 Bot is admin, can update group stats for ${metadata.subject}`);
      // You could update a database with group statistics
   }
   
   // 2. Check group health (if many users leaving/joining)
   if (action === "remove" || action === "add") {
      // Monitor for rapid member changes (possible raid)
      // You'd implement raid detection logic here
   }
   
   // 3. Backup group metadata periodically
   if (config.BACKUP_GROUP_DATA) {
      const lastBackup = getLastBackupTime(groupId);
      const now = Date.now();
      if (now - lastBackup > 24 * 60 * 60 * 1000) { // 24 hours
         console.log(`💾 Backing up group data for ${metadata.subject}`);
         // Save group metadata to database
      }
   }
}

async function handleError(sock, error, groupId) {
   console.error("❌ Group handler error:", error);
   
   // Try to send error to admin log if configured
   if (config.ADMIN_LOG_GROUP) {
      try {
         await sock.sendMessage(config.ADMIN_LOG_GROUP, {
            text: `⚠️ ERROR IN GROUP HANDLER\n\nGroup: ${groupId}\nError: ${error.message}\nTime: ${moment().tz('Asia/Kolkata').format('HH:mm:ss DD/MM/YYYY')}`
         });
      } catch (logError) {
         console.error("Failed to send error log:", logError);
      }
   }
}

// ========== UTILITY FUNCTIONS ==========

function getLastBackupTime(groupId) {
   // Implementation depends on your storage system
   // Return timestamp of last backup for this group
   return 0;
}

// Cache for bot admin status to reduce API calls
const botAdminCache = new Map();

function getBotAdminCacheKey(groupId, botJid) {
   return `${groupId}:${botJid}`;
}

async function checkBotAdminStatus(sock, groupId, forceRefresh = false) {
   const botJid = sock.user?.id?.split(':')[0] ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user?.id;
   const cacheKey = getBotAdminCacheKey(groupId, botJid);
   
   if (!forceRefresh && botAdminCache.has(cacheKey)) {
      return botAdminCache.get(cacheKey);
   }
   
   try {
      const metadata = await sock.groupMetadata(groupId);
      const botParticipant = metadata.participants.find(p => p.id === botJid);
      const isAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
      
      botAdminCache.set(cacheKey, isAdmin);
      // Cache for 5 minutes
      setTimeout(() => botAdminCache.delete(cacheKey), 5 * 60 * 1000);
      
      return isAdmin;
   } catch (error) {
      console.error(`Failed to check bot admin status for group ${groupId}:`, error);
      return false;
   }
}
