import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// Generate sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch active listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('status', 'active')
      .eq('is_approved', true);

    // Fetch public user profiles
    const { data: users } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('is_public', true);

    // Generate sitemap content
    const currentDate = new Date().toISOString();
    const BASE_URL = 'https://benalsam.com';
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static routes
    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/giris', priority: '0.8', changefreq: 'monthly' },
      { path: '/kayit', priority: '0.8', changefreq: 'monthly' },
      { path: '/ayarlar', priority: '0.6', changefreq: 'monthly' },
      { path: '/premium', priority: '0.7', changefreq: 'weekly' },
      { path: '/premium-dashboard', priority: '0.6', changefreq: 'weekly' },
      { path: '/profil', priority: '0.8', changefreq: 'weekly' },
      { path: '/ilanlarim', priority: '0.9', changefreq: 'daily' },
      { path: '/envanterim', priority: '0.8', changefreq: 'weekly' },
      { path: '/favorilerim', priority: '0.7', changefreq: 'weekly' },
      { path: '/takip-edilenler', priority: '0.7', changefreq: 'weekly' },
      { path: '/mesajlarim', priority: '0.8', changefreq: 'daily' },
      { path: '/aldigim-teklifler', priority: '0.8', changefreq: 'daily' },
      { path: '/gonderdigim-teklifler', priority: '0.8', changefreq: 'daily' },
    ];

    staticRoutes.forEach(route => {
      sitemap += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
    });

    // Add listing URLs
    if (listings) {
      listings.forEach(listing => {
        sitemap += `  <url>
    <loc>${BASE_URL}/ilan/${listing.id}</loc>
    <lastmod>${listing.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
      });
    }

    // Add user profile URLs
    if (users) {
      users.forEach(user => {
        sitemap += `  <url>
    <loc>${BASE_URL}/profil/${user.id}</loc>
    <lastmod>${user.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
    }

    sitemap += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://benalsam.com/sitemap.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /ayarlar/
Disallow: /premium-dashboard/

# Allow important pages
Allow: /ilan/
Allow: /profil/
Allow: /kategori/

# Crawl delay
Crawl-delay: 1`;

  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;
