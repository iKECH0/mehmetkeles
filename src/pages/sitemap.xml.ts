import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  const base = (import.meta.env.PUBLIC_SITE_URL || site?.toString() || 'https://mehmetkeles-site.vercel.app').replace(/\/$/, '');
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/#hakkinda', priority: '0.8', changefreq: 'monthly' },
    { loc: '/#hizmetler', priority: '0.9', changefreq: 'monthly' },
    { loc: '/#seviyeler', priority: '0.8', changefreq: 'monthly' },
    { loc: '/#neden-biz', priority: '0.7', changefreq: 'monthly' },
    { loc: '/#basvuru', priority: '0.9', changefreq: 'monthly' },
    { loc: '/#ogretmen-basvuru', priority: '0.7', changefreq: 'monthly' },
    { loc: '/#iletisim', priority: '0.8', changefreq: 'monthly' },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
