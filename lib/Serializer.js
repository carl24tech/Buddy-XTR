// lib/Serializer.js
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import PhoneNumber from 'awesome-phonenumber';
import config from '../config.cjs';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from '../lib/exif.cjs';
import { getBuffer, getSizeMedia } from '../lib/myfunc.cjs';

// Global variables for baileys exports
let baileysExports = {};
let store = null;

// Initialize baileys imports asynchronously
(async () => {
    try {
        // Import baileys
        const baileysModule = await import('@whiskeysockets/baileys');
        const baileys = baileysModule.default || baileysModule;
        
        // Extract required functions
        baileysExports = {
            getContentType: baileys.getContentType,
            jidDecode: baileys.jidDecode,
            downloadMediaMessage: baileys.downloadMediaMessage,
            downloadContentFromMessage: baileys.downloadContentFromMessage,
            generateWAMessage: baileys.generateWAMessage,
            areJidsSameUser: baileys.areJidsSameUser,
            generateForwardMessageContent: baileys.generateForwardMessageContent,
            generateWAMessageFromContent: baileys.generateWAMessageFromContent,
            proto: baileys.proto,
            makeInMemoryStore: baileys.makeInMemoryStore
        };

        // Initialize store
        if (baileysExports.makeInMemoryStore) {
            store = baileysExports.makeInMemoryStore({ 
                logger: pino().child({ level: 'silent', stream: 'store' }) 
            });
        } else {
            // Create fallback store
            store = createFallbackStore();
            console.log('Using fallback store implementation');
        }
    } catch (error) {
        console.error('Error loading baileys:', error);
        // Use fallback implementations
        baileysExports = createFallbackExports();
        store = createFallbackStore();
    }
})();

// Fallback exports
function createFallbackExports() {
    return {
        getContentType: (msg) => Object.keys(msg || {})[0] || 'conversation',
        jidDecode: (jid) => {
            if (!jid) return null;
            const parts = jid.split('@');
            return { user: parts[0], server: parts[1] };
        },
        downloadMediaMessage: async () => Buffer.from([]),
        downloadContentFromMessage: async function* () { 
            yield Buffer.from([]); 
        },
        generateWAMessage: async () => ({ key: { id: '' }, message: {} }),
        areJidsSameUser: (a, b) => a === b,
        generateForwardMessageContent: async () => ({}),
        generateWAMessageFromContent: async () => ({ key: { id: '' }, message: {} }),
        proto: { 
            WebMessageInfo: { 
                fromObject: (obj) => obj 
            } 
        }
    };
}

// Fallback store
function createFallbackStore() {
    const store = {
        contacts: {},
        chats: {},
        messages: {},
        loadMessage: function(jid, id) {
            return this.messages[jid]?.[id] || null;
        },
        saveMessage: function(msg) {
            if (!msg.key) return;
            const { remoteJid, id } = msg.key;
            if (!this.messages[remoteJid]) this.messages[remoteJid] = {};
            this.messages[remoteJid][id] = msg;
        },
        bind: function(sock) {
            sock.ev?.on('messages.upsert', (data) => {
                data.messages?.forEach(msg => this.saveMessage(msg));
            });
            sock.ev?.on('contacts.update', (updates) => {
                updates.forEach(update => {
                    if (update.id) {
                        this.contacts[update.id] = { 
                            id: update.id, 
                            name: update.notify || update.name 
                        };
                    }
                });
            });
            return store;
        }
    };
    return store;
}

// Utility functions
function decodeJid(jid) {
    const { jidDecode } = baileysExports;
    if (!jidDecode || !jid) return jid;
    const { user, server } = jidDecode(jid) || {};
    return user && server ? `${user}@${server}`.trim() : jid;
}

async function downloadMedia(message) {
    const { downloadContentFromMessage } = baileysExports;
    if (!downloadContentFromMessage) return Buffer.from([]);
    
    let type = Object.keys(message)[0];
    let m = message[type];
    if (type === "buttonsMessage" || type === "viewOnceMessageV2") {
        if (type === "viewOnceMessageV2") {
            m = message.viewOnceMessageV2?.message;
            type = Object.keys(m || {})[0];
        } else type = Object.keys(m || {})[1];
        m = m[type];
    }
    try {
        const stream = await downloadContentFromMessage(
            m,
            type.replace("Message", "")
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error('Error downloading media:', error);
        return Buffer.from([]);
    }
}

// Main serialize function
function serialize(m, sock, logger) {
    // Bind store to socket if not already bound
    if (store && store.bind && !store.bound) {
        store.bind(sock);
        store.bound = true;
    }

    // Helper functions
    async function downloadFile(msg) {
        try {
            const buffer = await baileysExports.downloadMediaMessage?.(
                msg,
                "buffer",
                {},
                { logger, reuploadRequest: sock.updateMediaMessage }
            );
            return buffer || null;
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }

    async function React(emoji) {
        try {
            const reactm = {
                react: {
                    text: emoji,
                    key: m.key,
                },
            };
            await sock.sendMessage(m.from, reactm);
        } catch (error) {
            console.error('Error reacting:', error);
        }
    }

    // Socket utility methods
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = baileysExports.jidDecode?.(jid) || {};
            return decode.user && decode.server ? 
                `${decode.user}@${decode.server}` : jid;
        }
        return jid;
    };

    sock.getName = async (jid, withoutContact = false) => {
        jid = sock.decodeJid(jid);
        withoutContact = sock.withoutContact || withoutContact;
        
        if (jid.endsWith("@g.us")) {
            try {
                const v = store.contacts[jid] || {};
                if (!(v.name || v.subject)) {
                    const metadata = await sock.groupMetadata(jid).catch(() => ({}));
                    return metadata.name || metadata.subject || 
                           PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
                }
                return v.name || v.subject || 
                       PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
            } catch (error) {
                return PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
            }
        } else {
            const v = jid === '0@s.whatsapp.net' ? {
                id: jid,
                name: 'WhatsApp'
            } : jid === sock.decodeJid(sock.user.id) ?
                sock.user :
                (store.contacts[jid] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || 
                   PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    sock.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        const list = [];
        for (const i of kon) {
            const name = config.OWNER_NAME || 'Contact';
            list.push({
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await sock.getName(i + "@s.whatsapp.net")}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`
            });
        }
        await sock.sendMessage(jid, { 
            contacts: { 
                displayName: `${list.length} Kontak`, 
                contacts: list 
            }, 
            ...opts 
        }, { quoted });
    };

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff;
        if (Buffer.isBuffer(path)) {
            buff = path;
        } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
            buff = Buffer.from(path.split`,`[1], 'base64');
        } else if (/^https?:\/\//.test(path)) {
            buff = await getBuffer(path);
        } else if (fs.existsSync(path)) {
            buff = fs.readFileSync(path);
        } else {
            buff = Buffer.alloc(0);
        }
        
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }

        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff;
        if (Buffer.isBuffer(path)) {
            buff = path;
        } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
            buff = Buffer.from(path.split`,`[1], 'base64');
        } else if (/^https?:\/\//.test(path)) {
            buff = await getBuffer(path);
        } else if (fs.existsSync(path)) {
            buff = fs.readFileSync(path);
        } else {
            buff = Buffer.alloc(0);
        }
        
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }

        await sock.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    sock.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
        return sock.sendMessage(jid, { poll: { name, values, selectableCount } });
    };

    sock.getFile = async (PATH, save) => {
        let res, filename;
        let data;
        
        if (Buffer.isBuffer(PATH)) {
            data = PATH;
        } else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
            data = Buffer.from(PATH.split`,`[1], 'base64');
        } else if (/^https?:\/\//.test(PATH)) {
            res = await getBuffer(PATH);
            data = res;
        } else if (fs.existsSync(PATH)) {
            filename = PATH;
            data = fs.readFileSync(PATH);
        } else {
            data = Buffer.alloc(0);
        }
        
        if (!Buffer.isBuffer(data)) {
            throw new TypeError('Result is not a buffer');
        }
        
        const type = await fileTypeFromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        };
        
        if (data && save && !filename) {
            filename = path.join(__dirname, `./${Date.now()}.${type.ext}`);
            await fs.promises.writeFile(filename, data);
        }
        
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        };
    };

    sock.downloadMediaMessage = async (message) => {
        const { downloadContentFromMessage } = baileysExports;
        if (!downloadContentFromMessage) return Buffer.from([]);
        
        const mime = (message.msg || message).mimetype || '';
        const messageType = message.mtype ? 
            message.mtype.replace(/Message/gi, '') : 
            mime.split('/')[0];
        
        try {
            const stream = await downloadContentFromMessage(message, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        } catch (error) {
            console.error('Error downloading media message:', error);
            return Buffer.from([]);
        }
    };

    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        const { generateForwardMessageContent, generateWAMessageFromContent } = baileysExports;
        if (!generateForwardMessageContent || !generateWAMessageFromContent) {
            throw new Error('Required baileys functions not available');
        }

        let processedMessage = { ...message };
        
        if (options.readViewOnce) {
            processedMessage.message = processedMessage.message && 
                processedMessage.message.ephemeralMessage && 
                processedMessage.message.ephemeralMessage.message ? 
                processedMessage.message.ephemeralMessage.message : 
                (processedMessage.message || undefined);
            
            const vtype = Object.keys(processedMessage.message.viewOnceMessage.message)[0];
            delete processedMessage.message.viewOnceMessage.message[vtype].viewOnce;
            processedMessage.message = {
                ...processedMessage.message.viewOnceMessage.message
            };
        }

        const mtype = Object.keys(processedMessage.message)[0];
        const content = await generateForwardMessageContent(processedMessage, forceForward);
        const ctype = Object.keys(content)[0];
        const context = mtype !== "conversation" ? 
            processedMessage.message[mtype].contextInfo : {};
        
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        };

        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {});

        await sock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
        return waMessage;
    };

    sock.cMod = (jid, copy, text = '', sender = sock.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0];
        let isEphemeral = mtype === 'ephemeralMessage';
        
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        
        const msg = isEphemeral ? 
            copy.message.ephemeralMessage.message : 
            copy.message;
        
        const content = msg[mtype];
        
        if (typeof content === 'string') {
            msg[mtype] = text || content;
        } else if (content.caption) {
            content.caption = text || content.caption;
        } else if (content.text) {
            content.text = text || content.text;
        }
        
        if (typeof content !== 'string') {
            msg[mtype] = { ...content, ...options };
        }
        
        if (copy.key.participant) {
            sender = copy.key.participant = sender || copy.key.participant;
        }
        
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) {
            sender = sender || copy.key.remoteJid;
        } else if (copy.key.remoteJid.includes('@broadcast')) {
            sender = sender || copy.key.remoteJid;
        }
        
        copy.key.remoteJid = jid;
        copy.key.fromMe = sender === sock.user.id;

        return baileysExports.proto?.WebMessageInfo?.fromObject?.(copy) || copy;
    };

    // Process the message object
    if (m.key) {
        m.id = m.key.id;
        m.isSelf = m.key.fromMe;
        m.from = decodeJid(m.key.remoteJid);
        m.isGroup = m.from.endsWith("@g.us");
        m.sender = m.isGroup ? 
            decodeJid(m.key.participant) : 
            m.isSelf ? 
                decodeJid(sock.user.id) : 
                m.from;
    }

    if (m.message) {
        m.type = baileysExports.getContentType?.(m.message) || 'conversation';
        
        // Handle ephemeral and view once messages
        if (m.type === "ephemeralMessage") {
            m.message = m.message[m.type].message;
            const tipe = Object.keys(m.message)[0];
            m.type = tipe;
            if (tipe === "viewOnceMessageV2") {
                m.message = m.message[m.type].message;
                m.type = baileysExports.getContentType?.(m.message) || 'conversation';
            }
        }
        
        if (m.type === "viewOnceMessageV2") {
            m.message = m.message[m.type].message;
            m.type = baileysExports.getContentType?.(m.message) || 'conversation';
        }

        // Extract quoted message
        try {
            const quoted = m.message[m.type]?.contextInfo;
            if (quoted?.quotedMessage) {
                if (quoted.quotedMessage.ephemeralMessage) {
                    const tipe = Object.keys(quoted.quotedMessage.ephemeralMessage.message)[0];
                    if (tipe === "viewOnceMessageV2") {
                        m.quoted = {
                            type: "view_once",
                            stanzaId: quoted.stanzaId,
                            participant: decodeJid(quoted.participant),
                            message: quoted.quotedMessage.ephemeralMessage.message.viewOnceMessageV2.message
                        };
                    } else {
                        m.quoted = {
                            type: "ephemeral",
                            stanzaId: quoted.stanzaId,
                            participant: decodeJid(quoted.participant),
                            message: quoted.quotedMessage.ephemeralMessage.message
                        };
                    }
                } else if (quoted.quotedMessage.viewOnceMessageV2) {
                    m.quoted = {
                        type: "view_once",
                        stanzaId: quoted.stanzaId,
                        participant: decodeJid(quoted.participant),
                        message: quoted.quotedMessage.viewOnceMessageV2.message
                    };
                } else {
                    m.quoted = {
                        type: "normal",
                        stanzaId: quoted.stanzaId,
                        participant: decodeJid(quoted.participant),
                        message: quoted.quotedMessage
                    };
                }
                
                m.quoted.isSelf = m.quoted.participant === decodeJid(sock.user.id);
                m.quoted.mtype = Object.keys(m.quoted.message).find(
                    v => v.includes("Message") || v.includes("conversation")
                ) || 'conversation';
                
                m.quoted.text = m.quoted.message[m.quoted.mtype]?.text ||
                    m.quoted.message[m.quoted.mtype]?.description ||
                    m.quoted.message[m.quoted.mtype]?.caption ||
                    m.quoted.message[m.quoted.mtype]?.hydratedTemplate?.hydratedContentText ||
                    '';
                
                m.quoted.key = {
                    id: m.quoted.stanzaId,
                    fromMe: m.quoted.isSelf,
                    remoteJid: m.from
                };
                
                m.quoted.download = () => downloadMedia(m.quoted.message);
            } else {
                m.quoted = null;
            }
        } catch (error) {
            console.error('Error parsing quoted message:', error);
            m.quoted = null;
        }

        // Extract message body
        m.body = m.message?.conversation ||
            m.message?.[m.type]?.text ||
            m.message?.[m.type]?.caption ||
            (m.type === "listResponseMessage" && m.message?.[m.type]?.singleSelectReply?.selectedRowId) ||
            (m.type === "buttonsResponseMessage" && m.message?.[m.type]?.selectedButtonId) ||
            (m.type === "templateButtonReplyMessage" && m.message?.[m.type]?.selectedId) ||
            "";

        // Add reply method
        m.reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        
        // Extract mentions
        m.mentions = [];
        if (m.quoted?.participant) {
            m.mentions.push(m.quoted.participant);
        }
        const mentionedJid = m?.message?.[m.type]?.contextInfo?.mentionedJid || [];
        m.mentions.push(...mentionedJid.filter(Boolean));
        
        // Add download methods
        m.download = () => downloadMedia(m.message);
        m.downloadFile = () => downloadFile(m);
        m.React = (emoji) => React(emoji);
        
        // Add getQuotedObj method
        m.getQuotedObj = async () => {
            if (!m.quoted) return null;
            const qKey = m.message.extendedTextMessage?.contextInfo?.stanzaId;
            if (!qKey) return null;
            const qMsg = store?.loadMessage?.(m.from, qKey);
            return qMsg ? serialize(qMsg, sock, logger) : null;
        };
        
        // Add copyNForward method
        m.copyNForward = (jid = m.from, forceForward = false, options = {}) => 
            sock.copyNForward(jid, m, forceForward, options);
    }

    return m;
}

// Export only once
export { decodeJid, serialize };
