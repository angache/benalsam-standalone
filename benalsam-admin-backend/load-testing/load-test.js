#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}🔄 ${description}${colors.reset}`);
  log(`${colors.yellow}Command: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    return output;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

function saveResults(results, filename) {
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  log(`📁 Results saved to: ${filepath}`, 'green');
}

function parseArtilleryOutput(output) {
  try {
    // Extract key metrics from Artillery output
    const lines = output.split('\n');
    const metrics = {};
    
    for (const line of lines) {
      if (line.includes('Summary report')) {
        // Extract summary metrics
        const summaryMatch = line.match(/Summary report @ (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (summaryMatch) {
          metrics.timestamp = summaryMatch[1];
        }
      }
      
      if (line.includes('All VUs finished')) {
        const finishedMatch = line.match(/All VUs finished @ (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (finishedMatch) {
          metrics.finished_at = finishedMatch[1];
        }
      }
      
      if (line.includes('Summary:')) {
        // Extract summary statistics
        const summaryLines = lines.slice(lines.indexOf(line) + 1, lines.indexOf(line) + 20);
        for (const summaryLine of summaryLines) {
          if (summaryLine.includes('Request latency:')) {
            const latencyMatch = summaryLine.match(/min: (\d+\.?\d*), max: (\d+\.?\d*), median: (\d+\.?\d*), p95: (\d+\.?\d*), p99: (\d+\.?\d*)/);
            if (latencyMatch) {
              metrics.latency = {
                min: parseFloat(latencyMatch[1]),
                max: parseFloat(latencyMatch[2]),
                median: parseFloat(latencyMatch[3]),
                p95: parseFloat(latencyMatch[4]),
                p99: parseFloat(latencyMatch[5])
              };
            }
          }
          
          if (summaryLine.includes('Request duration:')) {
            const durationMatch = summaryLine.match(/min: (\d+\.?\d*), max: (\d+\.?\d*), median: (\d+\.?\d*), p95: (\d+\.?\d*), p99: (\d+\.?\d*)/);
            if (durationMatch) {
              metrics.duration = {
                min: parseFloat(durationMatch[1]),
                max: parseFloat(durationMatch[2]),
                median: parseFloat(durationMatch[3]),
                p95: parseFloat(durationMatch[4]),
                p99: parseFloat(durationMatch[5])
              };
            }
          }
          
          if (summaryLine.includes('Codes:')) {
            const codesMatch = summaryLine.match(/200: (\d+), 404: (\d+), 500: (\d+)/);
            if (codesMatch) {
              metrics.status_codes = {
                '200': parseInt(codesMatch[1]),
                '404': parseInt(codesMatch[2]),
                '500': parseInt(codesMatch[3])
              };
            }
          }
        }
      }
    }
    
    return metrics;
  } catch (error) {
    log(`❌ Error parsing Artillery output: ${error.message}`, 'red');
    return {};
  }
}

async function runLoadTest() {
  log(`${colors.bright}${colors.blue}🚀 Starting Load Test Suite${colors.reset}`);
  log(`${colors.cyan}================================${colors.reset}`);
  
  // Check if TOKEN environment variable is set
  if (!process.env.TOKEN) {
    log('❌ TOKEN environment variable is required', 'red');
    log('Please set TOKEN environment variable with a valid JWT token', 'yellow');
    process.exit(1);
  }
  
  // Check if server is running
  log(`\n${colors.cyan}🔍 Checking server health...${colors.reset}`);
  const healthCheck = runCommand('curl -s http://localhost:3002/health', 'Health check');
  if (!healthCheck || !healthCheck.includes('healthy')) {
    log('❌ Server is not healthy. Please start the server first.', 'red');
    process.exit(1);
  }
  log('✅ Server is healthy', 'green');
  
  // Run baseline test (without cache)
  log(`\n${colors.cyan}📊 Running Baseline Test (No Cache)${colors.reset}`);
  const baselineConfig = path.join(__dirname, 'artillery-config.yml');
  const baselineOutput = runCommand(
    `artillery run ${baselineConfig} --output results/baseline-report.json`,
    'Baseline load test'
  );
  
  if (!baselineOutput) {
    log('❌ Baseline test failed', 'red');
    process.exit(1);
  }
  
  const baselineMetrics = parseArtilleryOutput(baselineOutput);
  log('✅ Baseline test completed', 'green');
  
  // Wait for cache to warm up
  log(`\n${colors.cyan}⏳ Waiting for cache to warm up...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
  
  // Run cache test
  log(`\n${colors.cyan}📊 Running Cache Test${colors.reset}`);
  const cacheOutput = runCommand(
    `artillery run ${baselineConfig} --output results/cache-report.json`,
    'Cache load test'
  );
  
  if (!cacheOutput) {
    log('❌ Cache test failed', 'red');
    process.exit(1);
  }
  
  const cacheMetrics = parseArtilleryOutput(cacheOutput);
  log('✅ Cache test completed', 'green');
  
  // Generate comparison report
  log(`\n${colors.cyan}📈 Generating Comparison Report${colors.reset}`);
  const comparison = {
    timestamp: new Date().toISOString(),
    baseline: baselineMetrics,
    cache: cacheMetrics,
    improvement: {}
  };
  
  // Calculate improvements
  if (baselineMetrics.latency && cacheMetrics.latency) {
    comparison.improvement.latency = {
      p95: ((baselineMetrics.latency.p95 - cacheMetrics.latency.p95) / baselineMetrics.latency.p95 * 100).toFixed(2),
      p99: ((baselineMetrics.latency.p99 - cacheMetrics.latency.p99) / baselineMetrics.latency.p99 * 100).toFixed(2),
      median: ((baselineMetrics.latency.median - cacheMetrics.latency.median) / baselineMetrics.latency.median * 100).toFixed(2)
    };
  }
  
  if (baselineMetrics.duration && cacheMetrics.duration) {
    comparison.improvement.duration = {
      p95: ((baselineMetrics.duration.p95 - cacheMetrics.duration.p95) / baselineMetrics.duration.p95 * 100).toFixed(2),
      p99: ((baselineMetrics.duration.p99 - cacheMetrics.duration.p99) / baselineMetrics.duration.p99 * 100).toFixed(2),
      median: ((baselineMetrics.duration.median - cacheMetrics.duration.median) / baselineMetrics.duration.median * 100).toFixed(2)
    };
  }
  
  // Save results
  saveResults(comparison, 'load-test-comparison.json');
  
  // Display summary
  log(`\n${colors.bright}${colors.green}📊 Load Test Results Summary${colors.reset}`);
  log(`${colors.cyan}================================${colors.reset}`);
  
  if (comparison.improvement.latency) {
    log(`\n${colors.yellow}Latency Improvements:${colors.reset}`);
    log(`  P95: ${comparison.improvement.latency.p95}% improvement`);
    log(`  P99: ${comparison.improvement.latency.p99}% improvement`);
    log(`  Median: ${comparison.improvement.latency.median}% improvement`);
  }
  
  if (comparison.improvement.duration) {
    log(`\n${colors.yellow}Duration Improvements:${colors.reset}`);
    log(`  P95: ${comparison.improvement.duration.p95}% improvement`);
    log(`  P99: ${comparison.improvement.duration.p99}% improvement`);
    log(`  Median: ${comparison.improvement.duration.median}% improvement`);
  }
  
  log(`\n${colors.green}✅ Load testing completed successfully!${colors.reset}`);
  log(`📁 Results saved in: ${path.join(__dirname, 'results')}`);
}

// Run the load test
runLoadTest().catch(error => {
  log(`❌ Load test failed: ${error.message}`, 'red');
  process.exit(1);
});
