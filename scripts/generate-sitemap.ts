import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS_SEO, SITE_URL } from '../src/seo/site';
import { GUIDES } from '../src/data/guidesData';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const TODAY = new Date().toISOString().split('T')[0];

interface SitemapUrl {
  loc: string;
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
}

const urls: SitemapUrl[] = [
  { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
  ...TOOLS_SEO.map((tool) => ({
    loc: `${SITE_URL}/${tool.slug}`,
    priority: '0.9',
    changefreq: 'weekly' as const,
  })),
  { loc: `${SITE_URL}/image-tools`, priority: '0.8', changefreq: 'weekly' },
  { loc: `${SITE_URL}/pdf-tools`, priority: '0.8', changefreq: 'weekly' },
  { loc: `${SITE_URL}/privacy-tools`, priority: '0.8', changefreq: 'weekly' },
  { loc: `${SITE_URL}/guides`, priority: '0.7', changefreq: 'weekly' },
  ...GUIDES.map((guide) => ({
    loc: `${SITE_URL}/guides/${guide.slug}`,
    priority: '0.7',
    changefreq: 'monthly' as const,
  })),
  { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
  { loc: `${SITE_URL}/privacy`, priority: '0.5', changefreq: 'monthly' },
  { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly' },
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
await writeFile(resolve(publicDir, 'robots.txt'), robotsTxt, 'utf8');

console.log(`Generated public/sitemap.xml with ${urls.length} URLs and public/robots.txt`);

