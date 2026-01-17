#!/usr/bin/env node

/**
 * VPS/LOCAL TOGGLE SCRIPT
 * Kullanım: node scripts/toggle-vps.js [vps|local]
 * Veya: npm run toggle:vps / npm run toggle:local
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = '.env.local';
const ENV_FILE_PATH = path.join(__dirname, '..', ENV_FILE);

// Colors
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

if (!fs.existsSync(ENV_FILE_PATH)) {
  console.error(`${YELLOW}⚠️  .env.local dosyası bulunamadı!${RESET}`);
  process.exit(1);
}

// Read file
let content;
try {
  content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
} catch (error) {
  console.error(`${YELLOW}⚠️  Dosya okuma hatası: ${error.message}${RESET}`);
  console.log('');
  console.log(`${BLUE}Manuel olarak .env.local dosyasında şunu değiştirin:${RESET}`);
  const arg = process.argv[2];
  const targetValue = arg === 'local' ? 'false' : 'true';
  console.log(`USE_VPS_SERVICES=${targetValue}`);
  console.log(`NEXT_PUBLIC_USE_VPS_SERVICES=${targetValue}`);
  process.exit(1);
}

// Get current value
const currentMatch = content.match(/^USE_VPS_SERVICES=(.*)$/m);
const currentValue = currentMatch ? currentMatch[1].trim() : 'false';

// Determine target value
const arg = process.argv[2];
let targetValue;
let targetMode;

if (arg === 'local') {
  targetValue = 'false';
  targetMode = 'LOCAL';
} else if (arg === 'vps') {
  targetValue = 'true';
  targetMode = 'VPS';
} else {
  // Toggle current value
  if (currentValue === 'true') {
    targetValue = 'false';
    targetMode = 'LOCAL';
  } else {
    targetValue = 'true';
    targetMode = 'VPS';
  }
}

// Update USE_VPS_SERVICES
content = content.replace(/^USE_VPS_SERVICES=.*$/m, `USE_VPS_SERVICES=${targetValue}`);
content = content.replace(/^NEXT_PUBLIC_USE_VPS_SERVICES=.*$/m, `NEXT_PUBLIC_USE_VPS_SERVICES=${targetValue}`);

// Write file
try {
  fs.writeFileSync(ENV_FILE_PATH, content, 'utf8');
  console.log(`${GREEN}✅ Environment değiştirildi: ${targetMode}${RESET}`);
  console.log(`${BLUE}📋 USE_VPS_SERVICES=${targetValue}${RESET}`);
  console.log('');
  console.log(`${YELLOW}⚠️  Frontend'i yeniden başlatın: npm run dev${RESET}`);
} catch (error) {
  console.error(`${YELLOW}⚠️  Dosya yazma hatası: ${error.message}${RESET}`);
  console.log('');
  console.log(`${BLUE}📝 Manuel olarak .env.local dosyasında şunu değiştirin:${RESET}`);
  console.log('');
  console.log(`USE_VPS_SERVICES=${targetValue}`);
  console.log(`NEXT_PUBLIC_USE_VPS_SERVICES=${targetValue}`);
  console.log('');
  console.log(`${YELLOW}⚠️  Dosya izin sorunu var. Terminal'de şu komutu çalıştırabilirsiniz:${RESET}`);
  console.log(`chmod 644 ${ENV_FILE_PATH}`);
  process.exit(1);
}

