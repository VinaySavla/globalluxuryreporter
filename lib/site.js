const configuredSiteUrl = process.env.SITE_URL || 'http://localhost:3000';

export const siteUrl = new URL(configuredSiteUrl);
export const siteOrigin = siteUrl.origin;

export function absoluteUrl(path = '/') {
  return new URL(path, `${siteOrigin}/`).toString();
}
