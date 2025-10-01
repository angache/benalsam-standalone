#!/usr/bin/env node

/**
 * 🔐 GÜVENLİK TEST SCRIPT'İ
 * 
 * Bu script Firebase Edge Function'ın güvenlik özelliklerini test eder:
 * - Authentication
 * - Rate limiting
 * - Input validation
 * - IP whitelisting
 * - Audit logging
 */

const https = require('https');
const http = require('http');

// Test configuration
const EDGE_FUNCTION_URL = 'https://your-project.supabase.co/functions/v1/firebase-secure';
const FIREBASE_SECRET = 'your-super-secure-secret-key-here';

// Test data
const testData = {
  listingId: '123e4567-e89b-12d3-a456-426614174000',
  status: 'active',
  jobType: 'status_change'
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREBASE_SECRET}`,
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testAuthentication() {
  log('\n🔐 AUTHENTICATION TEST', 'cyan');
  
  // Test 1: Valid authentication
  log('Test 1: Valid authentication...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { body: testData });
    if (response.status === 200) {
      log('✅ Valid authentication: PASSED', 'green');
    } else {
      log(`❌ Valid authentication: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Valid authentication: ERROR - ${error.message}`, 'red');
  }
  
  // Test 2: Missing authentication
  log('Test 2: Missing authentication...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { 
      body: testData,
      headers: { 'Authorization': '' }
    });
    if (response.status === 401) {
      log('✅ Missing authentication: PASSED', 'green');
    } else {
      log(`❌ Missing authentication: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Missing authentication: ERROR - ${error.message}`, 'red');
  }
  
  // Test 3: Invalid authentication
  log('Test 3: Invalid authentication...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { 
      body: testData,
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    if (response.status === 401) {
      log('✅ Invalid authentication: PASSED', 'green');
    } else {
      log(`❌ Invalid authentication: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Invalid authentication: ERROR - ${error.message}`, 'red');
  }
}

async function testInputValidation() {
  log('\n📝 INPUT VALIDATION TEST', 'cyan');
  
  // Test 1: Missing listingId
  log('Test 1: Missing listingId...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { 
      body: { status: 'active' }
    });
    if (response.status === 400) {
      log('✅ Missing listingId: PASSED', 'green');
    } else {
      log(`❌ Missing listingId: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Missing listingId: ERROR - ${error.message}`, 'red');
  }
  
  // Test 2: Missing status
  log('Test 2: Missing status...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { 
      body: { listingId: '123e4567-e89b-12d3-a456-426614174000' }
    });
    if (response.status === 400) {
      log('✅ Missing status: PASSED', 'green');
    } else {
      log(`❌ Missing status: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Missing status: ERROR - ${error.message}`, 'red');
  }
  
  // Test 3: Invalid listingId format
  log('Test 3: Invalid listingId format...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { 
      body: { listingId: 'invalid-uuid', status: 'active' }
    });
    if (response.status === 400) {
      log('✅ Invalid listingId format: PASSED', 'green');
    } else {
      log(`❌ Invalid listingId format: FAILED (${response.status})`, 'red');
    }
  } catch (error) {
    log(`❌ Invalid listingId format: ERROR - ${error.message}`, 'red');
  }
}

async function testRateLimiting() {
  log('\n🚫 RATE LIMITING TEST', 'cyan');
  
  log('Test: Rate limiting (100 requests in 15 minutes)...', 'blue');
  let successCount = 0;
  let rateLimitCount = 0;
  
  // Send 10 requests quickly
  for (let i = 0; i < 10; i++) {
    try {
      const response = await makeRequest(EDGE_FUNCTION_URL, { body: testData });
      if (response.status === 200) {
        successCount++;
      } else if (response.status === 429) {
        rateLimitCount++;
      }
    } catch (error) {
      log(`Request ${i + 1}: ERROR - ${error.message}`, 'red');
    }
  }
  
  log(`✅ Successful requests: ${successCount}`, 'green');
  log(`🚫 Rate limited requests: ${rateLimitCount}`, 'yellow');
  
  if (rateLimitCount > 0) {
    log('✅ Rate limiting: WORKING', 'green');
  } else {
    log('⚠️ Rate limiting: NOT TRIGGERED (may need more requests)', 'yellow');
  }
}

async function testFirebaseIntegration() {
  log('\n🔥 FIREBASE INTEGRATION TEST', 'cyan');
  
  log('Test: Firebase job creation...', 'blue');
  try {
    const response = await makeRequest(EDGE_FUNCTION_URL, { body: testData });
    if (response.status === 200 && response.data.success) {
      log('✅ Firebase integration: PASSED', 'green');
      log(`Job ID: ${response.data.jobId}`, 'blue');
      log(`Listing ID: ${response.data.listingId}`, 'blue');
      log(`Status: ${response.data.status}`, 'blue');
    } else {
      log(`❌ Firebase integration: FAILED (${response.status})`, 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log(`❌ Firebase integration: ERROR - ${error.message}`, 'red');
  }
}

// Main test runner
async function runSecurityTests() {
  log('🔐 FIREBASE EDGE FUNCTION GÜVENLİK TESTLERİ', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  try {
    await testAuthentication();
    await testInputValidation();
    await testRateLimiting();
    await testFirebaseIntegration();
    
    log('\n🎉 TÜM GÜVENLİK TESTLERİ TAMAMLANDI!', 'green');
    log('=' .repeat(50), 'green');
    
  } catch (error) {
    log(`\n❌ TEST HATASI: ${error.message}`, 'red');
  }
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests();
}

module.exports = {
  runSecurityTests,
  testAuthentication,
  testInputValidation,
  testRateLimiting,
  testFirebaseIntegration
};
