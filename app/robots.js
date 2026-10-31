import { absoluteUrl, indexingEnabled, siteOrigin } from '@/lib/site';

export default function robots() {
  if (!indexingEnabled) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: ['/', '/api/assets/'], disallow: ['/api/', '/cms/', '/wp-admin/', '/wp-login.php'] }, sitemap: absoluteUrl('/sitemap.xml'), host: siteOrigin };
}
