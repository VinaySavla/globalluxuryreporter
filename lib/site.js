const configuredSiteUrl = process.env.SITE_URL || 'https://readglr.com';

export const siteUrl = new URL(configuredSiteUrl);
export const siteOrigin = siteUrl.origin;
export const indexingEnabled = process.env.ROBOTS_INDEXING !== 'false' &&
  (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production') &&
  siteOrigin === 'https://readglr.com';

export function absoluteUrl(path = '/') {
  return new URL(path, `${siteOrigin}/`).toString();
}
