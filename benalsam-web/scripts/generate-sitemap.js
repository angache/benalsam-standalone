import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTgwNzAsImV4cCI6MjA2NTU3NDA3MH0.2lzsxTj4hoKTcZeoCGMsUC3Cmsm1pgcqXP-3j_GV_Ys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Get active listings from Supabase
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, updated_at, status')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching listings:', error);
      return;
    }

    console.log(`📋 Found ${listings.length} active listings`);

    // Generate sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add listing pages
    listings.forEach(listing => {
      const lastmod = new Date(listing.updated_at).toISOString().split('T')[0];
      sitemap += `  <url>
    <loc>https://benalsam.com/ilan/${listing.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    sitemap += '</urlset>';

    // Write to file
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);

    console.log(`✅ Sitemap generated successfully with ${staticPages.length + listings.length} URLs`);
    console.log(`📁 Saved to: ${sitemapPath}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export default generateSitemap;
