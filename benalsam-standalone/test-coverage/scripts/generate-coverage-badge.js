/**
 * Coverage Badge Generator
 * Coverage yüzdesine göre badge oluşturur
 */

const fs = require('fs');
const path = require('path');

class CoverageBadgeGenerator {
  constructor() {
    this.rootDir = path.join(__dirname, '../..');
  }

  async generateBadge() {
    console.log('🏷️ Generating coverage badge...');
    
    try {
      // Coverage raporunu oku
      const reportPath = path.join(__dirname, '../coverage-report.json');
      if (!fs.existsSync(reportPath)) {
        console.log('⚠️ Coverage report not found. Run coverage:report first.');
        return;
      }

      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const overallCoverage = report.summary.coverage;
      
      // En düşük coverage'ı al (lines, functions, branches, statements)
      const minCoverage = Math.min(
        parseFloat(overallCoverage.lines),
        parseFloat(overallCoverage.functions),
        parseFloat(overallCoverage.branches),
        parseFloat(overallCoverage.statements)
      );

      // Badge rengini belirle
      const color = this.getBadgeColor(minCoverage);
      
      // SVG badge oluştur
      const badge = this.createSVGBadge(minCoverage, color);
      
      // Badge'i kaydet
      const badgePath = path.join(__dirname, '../coverage-badge.svg');
      fs.writeFileSync(badgePath, badge);
      
      console.log(`🏷️ Coverage badge saved to: ${badgePath}`);
      console.log(`📊 Coverage: ${minCoverage.toFixed(1)}% (${color})`);
      
      return badge;
    } catch (error) {
      console.error('❌ Error generating coverage badge:', error);
    }
  }

  getBadgeColor(coverage) {
    if (coverage >= 90) return 'brightgreen';
    if (coverage >= 80) return 'green';
    if (coverage >= 70) return 'yellowgreen';
    if (coverage >= 60) return 'yellow';
    if (coverage >= 50) return 'orange';
    return 'red';
  }

  createSVGBadge(coverage, color) {
    const percentage = coverage.toFixed(1);
    const width = 120;
    const height = 20;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h67v20H0z"/>
    <path fill="#${color}" d="M67 0h53v20H67z"/>
    <path fill="url(#b)" d="M0 0h120v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="33.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
    <text x="33.5" y="14">coverage</text>
    <text x="93.5" y="15" fill="#010101" fill-opacity=".3">${percentage}%</text>
    <text x="93.5" y="14">${percentage}%</text>
  </g>
</svg>`;
  }
}

// Script'i çalıştır
if (require.main === module) {
  const generator = new CoverageBadgeGenerator();
  generator.generateBadge().catch(console.error);
}

module.exports = CoverageBadgeGenerator;
