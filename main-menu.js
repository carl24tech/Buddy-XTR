import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';
import { fileTypeFromFile } from 'file-type';

// ============================================
// ENCRYPTED/OBFUSCATED SECTION
// ============================================

// Obfuscated constants and functions
const _0x1a2b3c = os.totalmem();
const _0x2b3c4d = os.freemem();
const _0x3c4d5e = 1 / 1024;
const _0x4d5e6f = _0x3c4d5e / 1024;
const _0x5e6f7g = _0x4d5e6f / 1024;

function _0x7g8h9i(_0x9i0j1k) {
    if (_0x9i0j1k >= Math['pow'](1024, 3)) {
        return (_0x9i0j1k * _0x5e6f7g).toFixed(2) + ' ' + atob('R0I=');
    } else if (_0x9i0j1k >= Math['pow'](1024, 2)) {
        return (_0x9i0j1k * _0x4d5e6f).toFixed(2) + ' ' + atob('TUI=');
    } else if (_0x9i0j1k >= 1024) {
        return (_0x9i0j1k * _0x3c4d5e).toFixed(2) + ' ' + atob('S0I=');
    } else {
        return _0x9i0j1k.toFixed(2) + ' ' + Buffer.from('Ynl0ZXM=', 'base64').toString();
    }
}

const _0x8h9i0j = process.uptime();
const _0x9i0j1k = Math.floor(_0x8h9i0j / (24 * 3600));
const _0x0j1k2l = Math.floor((_0x8h9i0j % (24 * 3600)) / 3600);
const _0x1k2l3m = Math.floor((_0x8h9i0j % 3600) / 60);
const _0x2l3m4n = Math.floor(_0x8h9i0j % 60);

const _0x3m4n5o = `*${Buffer.from('SSBhbSBhbGl2ZSBub3cgc2luY2Ug', 'base64').toString()}${_0x9i0j1k}d ${_0x0j1k2l}h ${_0x1k2l3m}m ${_0x2l3m4n}s*`;
const _0x4n5o6p = `*${String.fromCharCode(9730, 65039)} ${_0x9i0j1k} ${Buffer.from('RGF5', 'base64').toString()}*\n*${String.fromCharCode(128337)} ${_0x0j1k2l} ${Buffer.from('Ib3Vy', 'base64').toString()}*\n*${String.fromCharCode(9200)} ${_0x1k2l3m} ${Buffer.from('TWludXRlcw==', 'base64').toString()}*\n*${String.fromCharCode(9201, 65039)} ${_0x2l3m4n} ${Buffer.from('U2Vjb25kcw==', 'base64').toString()}*\n`;

const _0x5o6p7q = moment.tz(Buffer.from('QXNpYS9Db2xvbWJv', 'base64').toString()).format(Buffer.from('SEg6bW06c3M=', 'base64').toString());
const _0x6p7q8r = moment.tz(Buffer.from('QXNpYS9Db2xvbWJv', 'base64').toString()).format(Buffer.from('REQvTU0vWVlZWQ==', 'base64').toString());
const _0x7q8r9s = moment().tz(Buffer.from('QXNpYS9Db2xvbWJv', 'base64').toString()).format(Buffer.from('SEg6bW06c3M=', 'base64').toString());
let _0x8r9s0t = "";

const _0x9s0t1u = {
    'a': '05:00:00',
    'b': '11:00:00', 
    'c': '15:00:00',
    'd': '18:00:00',
    'e': '19:00:00'
};

if (_0x7q8r9s < _0x9s0t1u.a) {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('TW9ybmluZw==', 'base64').toString()} ${String.fromCharCode(127748)}`;
} else if (_0x7q8r9s < _0x9s0t1u.b) {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('TW9ybmluZw==', 'base64').toString()} ${String.fromCharCode(127748)}`;
} else if (_0x7q8r9s < _0x9s0t1u.c) {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('QWZ0ZXJub29u', 'base64').toString()} ${String.fromCharCode(127749)}`;
} else if (_0x7q8r9s < _0x9s0t1u.d) {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('RXZlbmluZw==', 'base64').toString()} ${String.fromCharCode(127747)}`;
} else if (_0x7q8r9s < _0x9s0t1u.e) {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('RXZlbmluZw==', 'base64').toString()} ${String.fromCharCode(127747)}`;
} else {
    _0x8r9s0t = `${Buffer.from('R29vZA==', 'base64').toString()} ${Buffer.from('TmlnaHQ=', 'base64').toString()} ${String.fromCharCode(127764)}`;
}

// ============================================
// MAIN FUNCTION WITH SELECTIVE OBFUSCATION
// ============================================

const _0x0t1u2v = async (_0x1u2v3w, _0x2v3w4x) => {
    const _0x3w4x5y = config.PREFIX;
    const _0x4x5y6z = _0x1u2v3w.body.startsWith(_0x3w4x5y) ? 
        _0x1u2v3w.body.slice(_0x3w4x5y.length).split(' ')[0].toLowerCase() : '';
    const _0x5y6z7a = config.MODE === 'public' ? 'public' : 'private';
    
    const _0x6z7a8b = ['list', 'menu', 'cmd'].map(x => x.toLowerCase());

    if (_0x6z7a8b.includes(_0x4x5y6z)) {
        const _0x7a8b9c = {
            'divider': '┈⊷',
            'star': '★',
            'diamond': '◈'
        };
        
        const _0x8b9c0d = `
${String.fromCharCode(9500)}${'━'.repeat(3)}〔 *${config.BOT_NAME}* 〕${'━'.repeat(3)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9500)}${'─'.repeat(14)}
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('093d25E=', 'base64').toString()} : *${config.OWNER_NAME}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('VXNlcg==', 'base64').toString()} : *${_0x1u2v3w.pushName}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('QmFpbGV5cw==', 'base64').toString()} : *${Buffer.from('TXVsdGkgRGV2aWNl', 'base64').toString()}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('VHlwZQ==', 'base64').toString()} : *${Buffer.from('Tm9kZUpz', 'base64').toString()}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('TW9kZQ==', 'base64').toString()} : *${_0x5y6z7a}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('UGxhdGZvcm0=', 'base64').toString()} : *${os.platform()}*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('UHJlZml4', 'base64').toString()} : [${_0x3w4x5y}]
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9474)} ${Buffer.from('VmVyc2lvbg==', 'base64').toString()} : *3.1.0*
${String.fromCharCode(9475)}${_0x7a8b9c.star}${String.fromCharCode(9492)}${'─'.repeat(14)}
${String.fromCharCode(9492)}${'━'.repeat(15)}${_0x7a8b9c.divider}

> ${Buffer.from('SGVsbG8=', 'base64').toString()} ${String.fromCharCode(127801)} *${_0x1u2v3w.pushName}*!
${_0x8r9s0t}

${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('RG93bmxvYWQgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFwaw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGZhY2Vib29r', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIG1lZGlhZmlyZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHBpbnRlcmVzdGRs', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdpdGNsb25l', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdkcml2ZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGluc3Rh', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0bXAz', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0bXA0', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHBsYXk=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNvbmc=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHZpZGVv', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0bXAzZG9j', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0bXA0ZG9j', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHRpa3Rvaw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('Q29udmVydGVyIE1lbnU=', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF0dHA=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF0dHAy', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF0dHAz', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGViaW5hcnk=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGRiaW5hcnk=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGVtb2ppbWl4', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIG1wMw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('QUkgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFp', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGJ1Zw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHJlcG9ydA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdwdA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGRhbGxl', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHJlbWluaQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdlbWluaQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('VG9vbHMgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGNhbGN1bGF0b3I=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHRlbXBtYWls', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGNoZWNrbWFpbA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHRydA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHR0cw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('R3JvdXAgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGxpbmtncm91cA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldHBwZ2M=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldG5hbWU=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldGRlc2M=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdyb3Vw', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdjc2V0dGluZw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHdlbGNvbWU=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFkZA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGtpY2s=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGhpZGV0YWc=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHRhZ2FsbA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFudGlsaW5r', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFudGl0b3hpYw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHByb21vdGU=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGRlbW90ZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdldGJpbw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('U2VhcmNoIE1lbnU=', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHBsYXk=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0cw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGltZGI=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdvb2dsZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdpbWFnZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHBpbnRlcmVzdA==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHdhbGxwYXBlcg==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHdpa2ltZWRpYQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHl0c2VhcmNo', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHJpbmd0b25l', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGx5cmlj', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('TWFpbiBNZW51', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHBpbmc=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFsaXZl', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIG93bmVy', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIG1lbnU=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGluZm9ib3Q=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('T3duZXIgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGpvaW4=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGxlYXZl', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGJsb2Nr', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHVuYmxvY2s=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldHBwYm90', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFudGljYWxs', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldHN0YXR1cw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHNldG5hbWVib3Q=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF1dG90eXBpbmc=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGFsd2F5c29ubGluZQ==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF1dG9yZWFk', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGF1dG9zdmlldw==', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
${String.fromCharCode(9500)}${'━'.repeat(4)}〔 *${Buffer.from('U3RhbGsgTWVudQ==', 'base64').toString()}* 〕${'━'.repeat(4)}${_0x7a8b9c.divider}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9500)}${'─'.repeat(13)}${Buffer.from('·๏', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIHRydWVjYWxsZXI=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGluc3Rhc3RhbGs=', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9475)}${Buffer.from('4oCiIGdpdGh1YnN0YWxr', 'base64').toString()}
${String.fromCharCode(9475)}${_0x7a8b9c.diamond}${String.fromCharCode(9492)}${'─'.repeat(11)}${_0x7a8b9c.divider}
${String.fromCharCode(9492)}${'─'.repeat(14)}${_0x7a8b9c.divider}
`;

        try {
            let _0x9c0d1e;
            try {
                _0x9c0d1e = fs.readFileSync('./Carltech/mymenu.jpg');
                await _0x2v3w4x.sendMessage(_0x1u2v3w.from, {
                    image: _0x9c0d1e,
                    caption: _0x8b9c0d,
                    contextInfo: {
                        mentionedJid: [_0x1u2v3w.sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363398040175935@newsletter',
                            newsletterName: Buffer.from('QnVkZHktWFRS', 'base64').toString(),
                            serverMessageId: 143
                        }
                    }
                }, { quoted: _0x1u2v3w });
            } catch (_0xa0b1c2) {
                console.error(Buffer.from('RXJyb3IgbG9hZGluZyBsb2NhbCBtZW51IGltYWdlOg==', 'base64').toString(), _0xa0b1c2);
                await _0x2v3w4x.sendMessage(_0x1u2v3w.from, {
                    text: _0x8b9c0d,
                    contextInfo: {
                        mentionedJid: [_0x1u2v3w.sender]
                    }
                }, { quoted: _0x1u2v3w });
            }

            try {
                const _0xb1c2d3 = './Buddy/nothing.mp3';
                
                if (fs.existsSync(_0xb1c2d3)) {
                    const _0xc2d3e4 = fs.readFileSync(_0xb1c2d3);
                    
                    let _0xd3e4f5 = Buffer.from('YXVkaW8vbXBlZw==', 'base64').toString();
                    
                    try {
                        const _0xe4f5g6 = await fileTypeFromFile(_0xb1c2d3);
                        if (_0xe4f5g6 && _0xe4f5g6.mime.startsWith(Buffer.from('YXVkaW8v', 'base64').toString())) {
                            _0xd3e4f5 = _0xe4f5g6.mime;
                        }
                    } catch (_0xf5g6h7) {
                        console.log(Buffer.from('Q291bGQgbm90IGRldGVjdCBhdWRpbyB0eXBlLCB1c2luZyBkZWZhdWx0Og==', 'base64').toString(), _0xf5g6h7.message);
                    }
                    
                    await _0x2v3w4x.sendMessage(_0x1u2v3w.from, {
                        audio: _0xc2d3e4,
                        mimetype: _0xd3e4f5,
                        ptt: true,
                        waveform: Array(64).fill(0)
                    }, { quoted: _0x1u2v3w });
                } else {
                    console.error(Buffer.from('QXVkaW8gZmlsZSBub3QgZm91bmQ6', 'base64').toString(), _0xb1c2d3);
                }
            } catch (_0xg6h7i8) {
                console.error(Buffer.from('RXJyb3Igc2VuZGluZyBhdWRpbzo=', 'base64').toString(), _0xg6h7i8);
            }
        } catch (_0xh7i8j9) {
            console.error(Buffer.from('RXJyb3IgaW4gbWVudSBjb21tYW5kOg==', 'base64').toString(), _0xh7i8j9);
            await _0x2v3w4x.sendMessage(_0x1u2v3w.from, {
                text: `${String.fromCharCode(10060)} ${Buffer.from('RXJyb3Igc2VuZGluZyBtZW51LiBQbGVhc2UgdHJ5IGFnYWluLg==', 'base64').toString()}\n\n${_0x8b9c0d}`
            }, { quoted: _0x1u2v3w });
        }
    }
};

export default _0x0t1u2v;
