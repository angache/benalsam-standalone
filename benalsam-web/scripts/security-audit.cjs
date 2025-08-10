#!/usr/bin/env node

/**
 * Security Audit Script
 * Comprehensive security checks for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Security check results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Add check result
 */
function addCheck(name, status, message, details = null) {
  const check = {
    name,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  results.checks.push(check);

  switch (status) {
    case 'pass':
      results.passed++;
      log(`✅ ${name}: ${message}`, 'green');
      break;
    case 'fail':
      results.failed++;
      log(`❌ ${name}: ${message}`, 'red');
      break;
    case 'warning':
      results.warnings++;
      log(`⚠️  ${name}: ${message}`, 'yellow');
      break;
  }

  if (details) {
    console.log(`   Details: ${details}`);
  }
}

/**
 * Check for sensitive data in code
 */
function checkSensitiveData() {
  log('\n🔍 Checking for sensitive data...', 'blue');

  const sensitivePatterns = [
    /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /api_key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
    /private_key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  ];

  const srcDir = path.join(__dirname, '../src');
  const files = getAllFiles(srcDir);

  let foundSensitive = false;

  files.forEach(file => {
    // Skip test files and mock data
    if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
      return;
    }
    
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8');
      
      sensitivePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          foundSensitive = true;
          addCheck(
            'Sensitive Data Check',
            'fail',
            `Found potential sensitive data in ${path.relative(process.cwd(), file)}`,
            `Pattern: ${pattern.source}`
          );
        }
      });
    }
  });

  if (!foundSensitive) {
    addCheck('Sensitive Data Check', 'pass', 'No sensitive data found in source code');
  }
}

/**
 * Check for security vulnerabilities in dependencies
 */
function checkDependencies() {
  log('\n📦 Checking dependencies for vulnerabilities...', 'blue');

  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditOutput);

    if (audit.metadata.vulnerabilities.total === 0) {
      addCheck('Dependency Vulnerabilities', 'pass', 'No vulnerabilities found in dependencies');
    } else {
      const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
      addCheck(
        'Dependency Vulnerabilities',
        critical > 0 || high > 0 ? 'fail' : 'warning',
        `Found ${critical + high + moderate + low} vulnerabilities`,
        `Critical: ${critical}, High: ${high}, Moderate: ${moderate}, Low: ${low}`
      );
    }
  } catch (error) {
    addCheck('Dependency Vulnerabilities', 'warning', 'Could not run npm audit', error.message);
  }
}

/**
 * Check for environment variables
 */
function checkEnvironmentVariables() {
  log('\n🌍 Checking environment configuration...', 'blue');

  const envFile = path.join(__dirname, '../.env');
  const envExampleFile = path.join(__dirname, '../.env.example');

  if (fs.existsSync(envFile)) {
    addCheck('Environment File', 'pass', 'Environment file exists');
  } else {
    addCheck('Environment File', 'warning', 'No .env file found');
  }

  if (fs.existsSync(envExampleFile)) {
    addCheck('Environment Example', 'pass', 'Environment example file exists');
  } else {
    addCheck('Environment Example', 'warning', 'No .env.example file found');
  }
}

/**
 * Check for CORS configuration
 */
function checkCORS() {
  log('\n🛡️  Checking CORS configuration...', 'blue');

  const srcDir = path.join(__dirname, '../src');
  const files = getAllFiles(srcDir);
  let foundCORS = false;

  files.forEach(file => {
    // Skip test files
    if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
      return;
    }
    
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('cors') || content.includes('CORS') || content.includes('Access-Control')) {
        foundCORS = true;
        addCheck(
          'CORS Configuration',
          'pass',
          `CORS configuration found in ${path.relative(process.cwd(), file)}`
        );
      }
    }
  });

  if (!foundCORS) {
    addCheck('CORS Configuration', 'warning', 'No CORS configuration found');
  }
}

/**
 * Check for input validation
 */
function checkInputValidation() {
  log('\n✅ Checking input validation...', 'blue');

  const srcDir = path.join(__dirname, '../src');
  const files = getAllFiles(srcDir);
  let foundValidation = false;

  files.forEach(file => {
    // Skip test files
    if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
      return;
    }
    
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('validation') || content.includes('validate') || content.includes('zod')) {
        foundValidation = true;
        addCheck(
          'Input Validation',
          'pass',
          `Input validation found in ${path.relative(process.cwd(), file)}`
        );
      }
    }
  });

  if (!foundValidation) {
    addCheck('Input Validation', 'warning', 'No input validation found');
  }
}

/**
 * Check for HTTPS usage
 */
function checkHTTPS() {
  log('\n🔒 Checking HTTPS configuration...', 'blue');

  const srcDir = path.join(__dirname, '../src');
  const files = getAllFiles(srcDir);
  let foundHTTP = false;

  files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('http://') && !content.includes('localhost')) {
        foundHTTP = true;
        addCheck(
          'HTTPS Usage',
          'warning',
          `HTTP URLs found in ${path.relative(process.cwd(), file)}`,
          'Consider using HTTPS for production'
        );
      }
    }
  });

  if (!foundHTTP) {
    addCheck('HTTPS Usage', 'pass', 'No HTTP URLs found in production code');
  }
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dir) {
  const files = [];
  
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    });
  }
  
  return files;
}

/**
 * Generate security report
 */
function generateReport() {
  log('\n📊 Security Audit Report', 'blue');
  log('='.repeat(50), 'blue');
  
  log(`\nResults:`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  
  if (results.failed > 0) {
    log('\n❌ Failed Checks:', 'red');
    results.checks
      .filter(check => check.status === 'fail')
      .forEach(check => {
        log(`  - ${check.name}: ${check.message}`, 'red');
      });
  }
  
  if (results.warnings > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    results.checks
      .filter(check => check.status === 'warning')
      .forEach(check => {
        log(`  - ${check.name}: ${check.message}`, 'yellow');
      });
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, '../security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 Report saved to: ${reportPath}`, 'blue');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n❌ Security audit failed!', 'red');
    process.exit(1);
  } else {
    log('\n✅ Security audit passed!', 'green');
    process.exit(0);
  }
}

/**
 * Main function
 */
function main() {
  log('🔒 Starting Security Audit...', 'blue');
  log('='.repeat(50), 'blue');
  
  checkSensitiveData();
  checkDependencies();
  checkEnvironmentVariables();
  checkCORS();
  checkInputValidation();
  checkHTTPS();
  
  generateReport();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkSensitiveData,
  checkDependencies,
  checkEnvironmentVariables,
  checkCORS,
  checkInputValidation,
  checkHTTPS,
  generateReport,
}; 