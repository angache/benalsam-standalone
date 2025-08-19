import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MAX_URLS_PER_SITEMAP = 45000; // Google limiti 50,000, güvenli margin

async function generateSitemap() {
  try {
    console.log('🔍 Generating sitemap...');

    // Static pages
    const staticPages = [
      { url: 'https://benalsam.com/', priority: '1.0', changefreq: 'daily' },
      { url: 'https://benalsam.com/ilanlar', priority: '0.9', changefreq: 'hourly' },
      { url: 'https://benalsam.com/kategoriler', priority: '0.8', changefreq: 'weekly' },
      { url: 'https://benalsam.com/hakkimizda', priority: '0.7', changefreq: 'monthly' },
      { url: 'https://benalsam.com/iletisim', priority: '0.7', changefreq: 'monthly' },
      { url: 'https://benalsam.com/kullanim-sartlari', priority: '0.6', changefreq: 'monthly' },
      { url: 'https://benalsam.com/gizlilik-politikasi', priority: '0.6', changefreq: 'monthly' },
      { url: 'https://benalsam.com/ilan-olustur', priority: '0.8', changefreq: 'weekly' },
    ];

    // Get active listings from Supabase (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, updated_at, status, views_count')
      .eq('status', 'active')
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(100000); // Limit to prevent memory issues

    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    console.log(`📋 Found ${listings.length} active listings`);

    // Generate static sitemap
    generateStaticSitemap(staticPages);

    // Generate listing sitemaps with pagination
    const sitemapFiles = generateListingSitemaps(listings);

    // Generate sitemap index
    generateSitemapIndex(sitemapFiles);

    console.log(`✅ Sitemap generation completed!`);
    console.log(`📁 Generated ${sitemapFiles.length + 1} sitemap files`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

function generateStaticSitemap(staticPages) {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  staticPages.forEach(page => {
    sitemap += `  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  sitemap += '</urlset>';

  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap-static.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Static sitemap generated: sitemap-static.xml`);
}

function generateListingSitemaps(listings) {
  const sitemapFiles = [];
  const chunks = chunkArray(listings, MAX_URLS_PER_SITEMAP);

  chunks.forEach((chunk, index) => {
    const sitemapNumber = index + 1;
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    chunk.forEach(listing => {
      const lastmod = new Date(listing.updated_at).toISOString().split('T')[0];
      const priority = listing.views_count > 100 ? '0.8' : '0.7';
      
      sitemap += `  <url>
    <loc>https://benalsam.com/ilan/${listing.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    });

    sitemap += '</urlset>';

    const filename = `sitemap-listings-${sitemapNumber}.xml`;
    const sitemapPath = path.join(process.cwd(), 'public', filename);
    fs.writeFileSync(sitemapPath, sitemap);
    
    sitemapFiles.push(filename);
    console.log(`✅ Listing sitemap ${sitemapNumber} generated: ${filename} (${chunk.length} URLs)`);
  });

  return sitemapFiles;
}

function generateSitemapIndex(sitemapFiles) {
  let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://benalsam.com/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
`;

  sitemapFiles.forEach(filename => {
    sitemapIndex += `  <sitemap>
    <loc>https://benalsam.com/${filename}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
`;
  });

  sitemapIndex += '</sitemapindex>';

  const indexPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(indexPath, sitemapIndex);
  console.log(`✅ Sitemap index generated: sitemap.xml`);
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export default generateSitemap;
