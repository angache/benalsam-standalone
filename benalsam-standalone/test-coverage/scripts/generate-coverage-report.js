/**
 * Coverage Report Generator
 * Tüm servislerin coverage raporlarını birleştirir
 */

const fs = require('fs');
const path = require('path');

class CoverageReportGenerator {
  constructor() {
    this.services = [
      'benalsam-queue-service',
      'benalsam-search-service', 
      'benalsam-categories-service',
      'benalsam-upload-service',
      'benalsam-shared-types'
    ];
    this.rootDir = path.join(__dirname, '../..');
  }

  async generateReport() {
    console.log('📊 Generating comprehensive coverage report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      services: {},
      summary: {
        totalLines: 0,
        coveredLines: 0,
        totalFunctions: 0,
        coveredFunctions: 0,
        totalBranches: 0,
        coveredBranches: 0,
        totalStatements: 0,
        coveredStatements: 0
      }
    };

    // Her servis için coverage verilerini topla
    for (const service of this.services) {
      const serviceReport = await this.getServiceCoverage(service);
      if (serviceReport) {
        report.services[service] = serviceReport;
        this.updateSummary(report.summary, serviceReport);
      }
    }

    // Genel coverage yüzdesini hesapla
    report.summary.coverage = this.calculateOverallCoverage(report.summary);

    // Raporu kaydet
    await this.saveReport(report);

    // Console'a yazdır
    this.printReport(report);

    return report;
  }

  async getServiceCoverage(serviceName) {
    const coveragePath = path.join(this.rootDir, serviceName, 'coverage', 'coverage-summary.json');
    
    try {
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverageData.total;
      }
    } catch (error) {
      console.warn(`⚠️ Could not read coverage for ${serviceName}:`, error.message);
    }
    
    return null;
  }

  updateSummary(summary, serviceData) {
    summary.totalLines += serviceData.lines.total;
    summary.coveredLines += serviceData.lines.covered;
    summary.totalFunctions += serviceData.functions.total;
    summary.coveredFunctions += serviceData.functions.covered;
    summary.totalBranches += serviceData.branches.total;
    summary.coveredBranches += serviceData.branches.covered;
    summary.totalStatements += serviceData.statements.total;
    summary.coveredStatements += serviceData.statements.covered;
  }

  calculateOverallCoverage(summary) {
    return {
      lines: summary.totalLines > 0 ? (summary.coveredLines / summary.totalLines * 100).toFixed(2) : 0,
      functions: summary.totalFunctions > 0 ? (summary.coveredFunctions / summary.totalFunctions * 100).toFixed(2) : 0,
      branches: summary.totalBranches > 0 ? (summary.coveredBranches / summary.totalBranches * 100).toFixed(2) : 0,
      statements: summary.totalStatements > 0 ? (summary.coveredStatements / summary.totalStatements * 100).toFixed(2) : 0
    };
  }

  async saveReport(report) {
    const reportPath = path.join(__dirname, '../coverage-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Coverage report saved to: ${reportPath}`);
  }

  printReport(report) {
    console.log('\n🎯 BENALSAM COVERAGE REPORT');
    console.log('='.repeat(50));
    console.log(`📅 Generated: ${report.timestamp}`);
    console.log('');

    // Genel özet
    console.log('📊 OVERALL SUMMARY:');
    console.log(`   Lines:      ${report.summary.coverage.lines}% (${report.summary.coveredLines}/${report.summary.totalLines})`);
    console.log(`   Functions:  ${report.summary.coverage.functions}% (${report.summary.coveredFunctions}/${report.summary.totalFunctions})`);
    console.log(`   Branches:   ${report.summary.coverage.branches}% (${report.summary.coveredBranches}/${report.summary.totalBranches})`);
    console.log(`   Statements: ${report.summary.coverage.statements}% (${report.summary.coveredStatements}/${report.summary.totalStatements})`);
    console.log('');

    // Servis detayları
    console.log('🔧 SERVICE BREAKDOWN:');
    for (const [serviceName, serviceData] of Object.entries(report.services)) {
      if (serviceData) {
        console.log(`   ${serviceName}:`);
        console.log(`     Lines:      ${serviceData.lines.pct}% (${serviceData.lines.covered}/${serviceData.lines.total})`);
        console.log(`     Functions:  ${serviceData.functions.pct}% (${serviceData.functions.covered}/${serviceData.functions.total})`);
        console.log(`     Branches:   ${serviceData.branches.pct}% (${serviceData.branches.covered}/${serviceData.branches.total})`);
        console.log(`     Statements: ${serviceData.statements.pct}% (${serviceData.statements.covered}/${serviceData.statements.total})`);
      } else {
        console.log(`   ${serviceName}: No coverage data available`);
      }
    }

    console.log('');
    console.log('🎯 COVERAGE THRESHOLDS:');
    const thresholds = { lines: 80, functions: 80, branches: 80, statements: 80 };
    let allPassed = true;

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const coverage = parseFloat(report.summary.coverage[metric]);
      const status = coverage >= threshold ? '✅' : '❌';
      if (coverage < threshold) allPassed = false;
      console.log(`   ${metric.toUpperCase()}: ${status} ${coverage}% (threshold: ${threshold}%)`);
    }

    console.log('');
    if (allPassed) {
      console.log('🎉 All coverage thresholds passed!');
    } else {
      console.log('⚠️ Some coverage thresholds not met. Consider adding more tests.');
    }
    console.log('='.repeat(50));
  }
}

// Script'i çalıştır
if (require.main === module) {
  const generator = new CoverageReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = CoverageReportGenerator;
