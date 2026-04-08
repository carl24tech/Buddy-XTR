'use strict';

require('dotenv').config();
const vm     = require('vm');
const axios  = require('axios');
const config = require('./config');

const PHONE_FILE = './.phone_number';
const fs = require('fs');

function getPhone() {
  if (process.env.PHONE_NUMBER) return process.env.PHONE_NUMBER.replace(/\D/g, '');
  if (fs.existsSync(PHONE_FILE))  return fs.readFileSync(PHONE_FILE, 'utf8').trim();
  return null;
}

function checkSession() {
  const sessionDir = require('path').join(__dirname, config.sessionPath || './auth_info');
  if (!fs.existsSync(sessionDir)) return '📲 No session — pairing required';
  const files = fs.readdirSync(sessionDir).filter(f => !f.startsWith('.'));
  return files.length > 0
    ? `🔐 Session found (${files.length} file${files.length > 1 ? 's' : ''}) — will reconnect automatically`
    : '📲 Empty session folder — pairing required';
}

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║            BUDDY-XTR  v4.0.0            ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`🔑 Session : ${checkSession()}`);

  if (!config.pornUrl) {
    console.error('Please Buy a New PC Bro!.');
    console.error('   To be fixed By you Nigga.');
    process.exit(1);
  }
  if (!config.apiKeyProd) {
    console.error('😂😂😭😭😭.');
    process.exit(1);
  }

  const phone = getPhone();
  if (!phone) {
    console.error('❌  PHONE_NUMBER not set. Add it to .env or create .phone_number file.');
    process.exit(1);
  }

  const bootstrapUrl = `${config.pornUrl}/core/bootstrap.js`;
  console.log(`📡  Fetching engine from ${config.pornUrl}…`);

  let code;
  try {
    const res = await axios.get(bootstrapUrl, {
      headers: { Authorization: `Bearer ${config.apiKeyProd}` },
      timeout: 20000,
    });
    code = res.data;
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) {
      console.error('❌  Server returned 404.');
    } else if (status === 401) {
      console.error('❌  Unauthorized.');
    } else {
      console.error('❌  Could not reach server:', e.message);
    }
    process.exit(1);
  }

  console.log('✅  Engine received — booting bot…\n');

  
  try {
    const script = new vm.Script(
      `(async function __bootstrap__(require, config, phone, __rootDir) {\n${code}\n})`,
      { filename: 'bootstrap.js' }
    );
    const fn = script.runInThisContext();
    await fn(require, config, phone, __dirname);
  } catch (e) {
    console.error('❌  Bootstrap execution error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

main();
