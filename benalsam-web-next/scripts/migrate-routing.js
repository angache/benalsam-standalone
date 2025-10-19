#!/usr/bin/env node

/**
 * Routing Migration Script
 * React Router (useNavigate, useLocation, Link) → Next.js (useRouter, usePathname, Link)
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  'components',
  'hooks',
  'services',
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Import statements
  const importPatterns = [
    // useNavigate & useLocation
    {
      old: /import\s+{\s*useNavigate\s*,\s*useLocation\s*}\s+from\s+['"]react-router-dom['"]/g,
      new: "import { useRouter, usePathname } from 'next/navigation'"
    },
    // useNavigate only
    {
      old: /import\s+{\s*useNavigate\s*}\s+from\s+['"]react-router-dom['"]/g,
      new: "import { useRouter } from 'next/navigation'"
    },
    // useLocation only
    {
      old: /import\s+{\s*useLocation\s*}\s+from\s+['"]react-router-dom['"]/g,
      new: "import { usePathname } from 'next/navigation'"
    },
    // Link
    {
      old: /import\s+{\s*Link\s*}\s+from\s+['"]react-router-dom['"]/g,
      new: "import Link from 'next/link'"
    },
    // Link with other imports
    {
      old: /import\s+{\s*Link\s*,\s*([^}]+)}\s+from\s+['"]react-router-dom['"]/g,
      new: (match, p1) => `import Link from 'next/link';\nimport { ${p1} } from 'next/navigation'`
    },
  ];

  importPatterns.forEach(({ old, new: replacement }) => {
    if (content.match(old)) {
      content = content.replace(old, replacement);
      modified = true;
    }
  });

  // 2. Hook declarations
  const hookPatterns = [
    { old: /const\s+navigate\s*=\s*useNavigate\(\)/g, new: 'const router = useRouter()' },
    { old: /const\s+location\s*=\s*useLocation\(\)/g, new: 'const pathname = usePathname()' },
  ];

  hookPatterns.forEach(({ old, new: replacement }) => {
    if (content.match(old)) {
      content = content.replace(old, replacement);
      modified = true;
    }
  });

  // 3. navigate() calls
  const navigatePatterns = [
    { old: /navigate\((['"`][^'"`]*['"`])\)/g, new: 'router.push($1)' },
    { old: /navigate\(([^)]+)\)/g, new: 'router.push($1)' },
  ];

  navigatePatterns.forEach(({ old, new: replacement }) => {
    if (content.match(old)) {
      content = content.replace(old, replacement);
      modified = true;
    }
  });

  // 4. Link component props
  if (content.match(/<Link\s+to=/)) {
    content = content.replace(/<Link\s+to=/g, '<Link href=');
    modified = true;
  }

  // 5. location → pathname
  const locationPatterns = [
    { old: /location\.pathname/g, new: 'pathname' },
    { old: /location\.search/g, new: 'searchParams.toString()' },
  ];

  locationPatterns.forEach(({ old, new: replacement }) => {
    if (content.match(old)) {
      content = content.replace(old, replacement);
      modified = true;
    }
  });

  // 6. Dependency arrays (navigate → router)
  if (content.match(/\[.*navigate.*\]/)) {
    content = content.replace(/\[([^\]]*?)navigate([^\]]*?)\]/g, '[$1router$2]');
    modified = true;
  }

  return { content, modified };
}

function migrateDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return { files: 0, modifications: 0 };
  }

  let filesProcessed = 0;
  let filesModified = 0;

  function processDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullEntryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        processDir(fullEntryPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        filesProcessed++;
        const { content, modified } = migrateFile(fullEntryPath);
        
        if (modified) {
          fs.writeFileSync(fullEntryPath, content);
          filesModified++;
          const relativePath = path.relative(process.cwd(), fullEntryPath);
          console.log(`✅ ${relativePath}`);
        }
      }
    }
  }

  processDir(fullPath);
  return { files: filesProcessed, modifications: filesModified };
}

async function main() {
  console.log('🔄 Starting routing migration...\n');

  let totalFiles = 0;
  let totalModifications = 0;

  for (const dir of TARGET_DIRS) {
    console.log(`\n📁 Processing ${dir}/...`);
    const { files, modifications } = migrateDirectory(dir);
    totalFiles += files;
    totalModifications += modifications;
    console.log(`   Processed: ${files} files, Modified: ${modifications} files`);
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Total files processed: ${totalFiles}`);
  console.log(`📊 Total files modified: ${totalModifications}`);
}

main().catch(console.error);

