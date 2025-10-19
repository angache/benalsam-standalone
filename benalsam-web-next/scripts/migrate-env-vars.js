#!/usr/bin/env node

/**
 * Environment Variables Migration Script
 * Vite (import.meta.env.VITE_*) → Next.js (process.env.NEXT_PUBLIC_*)
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const TARGET_DIRS = [
  'services/**/*.{ts,tsx,js,jsx}',
  'hooks/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'stores/**/*.{ts,tsx,js,jsx}',
  'utils/**/*.{ts,tsx,js,jsx}',
];

async function migrateEnvVars() {
  console.log('🔄 Starting environment variables migration...\n');

  let totalFiles = 0;
  let totalReplacements = 0;

  for (const pattern of TARGET_DIRS) {
    const files = await glob(pattern, { cwd: process.cwd() });
    
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      let content = fs.readFileSync(filePath, 'utf8');
      let fileReplacements = 0;

      // Replace VITE_ with NEXT_PUBLIC_
      const newContent = content.replace(/import\.meta\.env\.VITE_/g, (match) => {
        fileReplacements++;
        return 'process.env.NEXT_PUBLIC_';
      });

      // Replace MODE
      const finalContent = newContent.replace(/import\.meta\.env\.MODE/g, (match) => {
        fileReplacements++;
        return 'process.env.NODE_ENV';
      });

      // Replace BASE_URL (if exists)
      const ultimateContent = finalContent.replace(/import\.meta\.env\.BASE_URL/g, (match) => {
        fileReplacements++;
        return 'process.env.NEXT_PUBLIC_BASE_URL';
      });

      if (fileReplacements > 0) {
        fs.writeFileSync(filePath, ultimateContent);
        console.log(`✅ ${file} - ${fileReplacements} replacements`);
        totalFiles++;
        totalReplacements += fileReplacements;
      }
    }
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Files modified: ${totalFiles}`);
  console.log(`📊 Total replacements: ${totalReplacements}`);
}

migrateEnvVars().catch(console.error);

