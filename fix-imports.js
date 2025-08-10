#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Düzeltilecek dosya uzantıları
const EXTENSIONS = ['.ts', '.js'];

// Düzeltilecek import pattern'leri
const IMPORT_PATTERNS = [
  // Local imports (./ ile başlayan)
  { 
    pattern: /from\s+['"`](\.[^'"`]+)['"`]/g,
    replacement: (match, importPath) => {
      // Eğer zaten .js uzantısı varsa değiştirme
      if (importPath.endsWith('.js')) {
        return match;
      }
      
      // Eğer uzantı yoksa .js ekle
      if (!importPath.includes('.')) {
        return `from '${importPath}.js'`;
      }
      
      // Eğer .ts uzantısı varsa .js yap
      if (importPath.endsWith('.ts')) {
        return `from '${importPath.replace('.ts', '.js')}'`;
      }
      
      return match;
    }
  }
];

function fixImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // Her pattern'i uygula
    IMPORT_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    });

    // Eğer değişiklik varsa dosyayı yaz
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTypeScriptFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // node_modules ve dist klasörlerini atla
        if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
          scan(fullPath);
        }
      } else if (EXTENSIONS.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

function main() {
  const targetDir = process.argv[2] || './src';
  
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }
  
  console.log(`🔍 Scanning for TypeScript files in: ${targetDir}`);
  
  const files = findTypeScriptFiles(targetDir);
  console.log(`📁 Found ${files.length} files to process`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Done! Fixed imports in ${fixedCount} files`);
}

if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, findTypeScriptFiles }; 