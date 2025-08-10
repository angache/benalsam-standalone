const fs = require('fs');
const path = require('path');

// Function to recursively find all JS/JSX files
function findFiles(dir, extensions = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix incorrect store imports
    const importPatterns = [
      {
        from: /import\s+\{\s*useAuthStoreStore\s*\}\s+from\s+['"]@\/storesStoreStore\.js['"]/g,
        to: "import { useAuthStore } from '@/stores'"
      },
      {
        from: /import\s+\{\s*useAuthStore\s*\}\s+from\s+['"]@\/storesStore['"]/g,
        to: "import { useAuthStore } from '@/stores'"
      },
      {
        from: /import\s+\{\s*useAuthStore\s*\}\s+from\s+['"]@\/storesStore\.js['"]/g,
        to: "import { useAuthStore } from '@/stores'"
      }
    ];
    
    importPatterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        updated = true;
        console.log(`Updated imports in ${filePath}`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main execution
const srcDir = path.join(__dirname, 'src');
console.log('Scanning for files to update...');

const files = findFiles(srcDir);
console.log(`Found ${files.length} files to process`);

files.forEach(file => {
  updateImports(file);
});

console.log('Import fixes completed!'); 