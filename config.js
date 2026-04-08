'use strict';
require('dotenv').config();

module.exports = {
  pornUrl : (process.env.PORN_URL || '').replace(/\/$/, ''),
  apiKeyProd: process.env.API_KEY_PROD || '',
  botName      : process.env.BOT_NAME     || 'Buddy-XTR',
  botVersion   : '4.0.0',
  prefix       : process.env.PREFIX       || '.',
  ownerNumber  : process.env.OWNER_NUMBER || '',
  ownerName    : process.env.OWNER_NAME   || 'Owner',
  privateMode       : process.env.PRIVATE_MODE        === 'true',
  autoViewStatus    : process.env.AUTO_VIEW_STATUS     !== 'false',
  autoLikeStatus    : process.env.AUTO_LIKE_STATUS     !== 'false',
  autoReactMessages : process.env.AUTO_REACT           === 'true',
  autoReactOutgoing : process.env.AUTO_REACT_OUTGOING  === 'true',
  autoReply         : process.env.AUTO_REPLY            !== 'false',
  antiDelete        : process.env.ANTI_DELETE          === 'true',
  antiDeleteScope   : process.env.ANTI_DELETE_SCOPE    || 'all',
  antiCall          : process.env.ANTI_CALL            === 'true',
  antiCallAction    : process.env.ANTI_CALL_ACTION     || 'reject',
  sessionPath          : './auth_info',
  footerText           : '⚡ Buddy-XTR v4.0',
  reactEmojis          : ['❤️','🔥','😂','👏','🎉','💯','😍','✨','😎','💪','🌟','⚡'],
  reconnectDelay       : 5000,
  maxReconnectAttempts : 15,
};
