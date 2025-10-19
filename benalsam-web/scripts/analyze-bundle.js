#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Bundle Analysis Starting...\n');

// 1. Build with analyzer
console.log('📦 Building with bundle analyzer...');
try {
  execSync('VITE_ENABLE_ANALYZER=true npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed with analyzer\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 2. Check dist folder size
const distPath = './dist';
if (fs.existsSync(distPath)) {
  const stats = fs.statSync(distPath);
  console.log(`📊 Dist folder size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // 3. Analyze individual files
  const files = fs.readdirSync(distPath, { recursive: true });
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  console.log(`\n📁 Files found:`);
  console.log(`   - JavaScript files: ${jsFiles.length}`);
  console.log(`   - CSS files: ${cssFiles.length}`);
  
  // 4. Show largest files
  const fileSizes = [];
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.statSync(filePath).isFile()) {
      const size = fs.statSync(filePath).size;
      fileSizes.push({ name: file, size });
    }
  });
  
  fileSizes.sort((a, b) => b.size - a.size);
  
  console.log(`\n🔝 Top 10 largest files:`);
  fileSizes.slice(0, 10).forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`   ${index + 1}. ${file.name}: ${sizeKB} KB (${sizeMB} MB)`);
  });
  
  // 5. Calculate total bundle size
  const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log(`\n📊 Total bundle size: ${totalSizeMB} MB`);
  
  if (totalSizeMB > 1) {
    console.log(`⚠️  Bundle size is ${totalSizeMB} MB, target is <1MB`);
    console.log(`💡 Consider code splitting and lazy loading`);
  } else {
    console.log(`✅ Bundle size is within target (<1MB)`);
  }
  
} else {
  console.log('❌ Dist folder not found');
}

console.log('\n🎯 Bundle analysis completed!');
console.log('📈 Check dist/bundle-analysis.html for detailed visualization');
