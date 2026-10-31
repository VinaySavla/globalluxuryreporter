export function analyticsUrl(value) {
  try {
    const url = new URL(value);
    const pathname = decodeURIComponent(url.pathname);
    if (url.protocol !== 'https:' || !['readglr.com', 'www.readglr.com'].includes(url.hostname) ||
        /^\/(?:api|cms|wp-admin|subscription)(?:\/|$)/i.test(pathname) || /^\/wp-login\.php$/i.test(pathname)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function googleAnalyticsId(value = '') {
  return /^G-[A-Z0-9]+$/.test(value) ? value : null;
}
