// Sitemap generator for SEO
const BASE_URL = 'https://benalsam.com'; // Production URL

const routes = [
  // Static pages
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/giris', priority: '0.8', changefreq: 'monthly' },
  { path: '/kayit', priority: '0.8', changefreq: 'monthly' },
  { path: '/ayarlar', priority: '0.6', changefreq: 'monthly' },
  { path: '/premium', priority: '0.7', changefreq: 'weekly' },
  { path: '/premium-dashboard', priority: '0.6', changefreq: 'weekly' },
  
  // User pages
  { path: '/profil', priority: '0.8', changefreq: 'weekly' },
  { path: '/ilanlarim', priority: '0.9', changefreq: 'daily' },
  { path: '/envanterim', priority: '0.8', changefreq: 'weekly' },
  { path: '/favorilerim', priority: '0.7', changefreq: 'weekly' },
  { path: '/takip-edilenler', priority: '0.7', changefreq: 'weekly' },
  { path: '/mesajlarim', priority: '0.8', changefreq: 'daily' },
  { path: '/aldigim-teklifler', priority: '0.8', changefreq: 'daily' },
  { path: '/gonderdigim-teklifler', priority: '0.8', changefreq: 'daily' },
  
  // Settings pages
  { path: '/ayarlar/profil', priority: '0.6', changefreq: 'monthly' },
  { path: '/ayarlar/guvenlik', priority: '0.6', changefreq: 'monthly' },
  { path: '/ayarlar/bildirimler', priority: '0.6', changefreq: 'monthly' },
  { path: '/ayarlar/gizlilik', priority: '0.6', changefreq: 'monthly' },
  { path: '/ayarlar/premium', priority: '0.7', changefreq: 'weekly' },
  
  // Dynamic routes (will be populated from database)
  // { path: '/ilan/{id}', priority: '0.9', changefreq: 'weekly' },
  // { path: '/profil/{userId}', priority: '0.8', changefreq: 'weekly' },
];

export const generateSitemap = async (listings = [], users = []) => {
  const currentDate = new Date().toISOString();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static routes
  routes.forEach(route => {
    sitemap += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  });

  // Add dynamic listing routes
  listings.forEach(listing => {
    sitemap += `  <url>
    <loc>${BASE_URL}/ilan/${listing.id}</loc>
    <lastmod>${listing.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
  });

  // Add dynamic user profile routes
  users.forEach(user => {
    sitemap += `  <url>
    <loc>${BASE_URL}/profil/${user.id}</loc>
    <lastmod>${user.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  sitemap += `</urlset>`;
  
  return sitemap;
};

export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

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
};
