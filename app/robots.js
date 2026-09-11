import { absoluteUrl, siteOrigin } from '@/lib/site';

export default function robots() {
  if (process.env.ROBOTS_INDEXING !== 'true') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/search', '/subscription/'] }, sitemap: absoluteUrl('/sitemap.xml'), host: siteOrigin };
}
