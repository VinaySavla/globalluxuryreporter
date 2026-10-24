export function wordpressUrl(path) {
  const base = process.env.WORDPRESS_URL?.replace(/\/$/, '');
  if (!base || !process.env.WORDPRESS_SERVICE_TOKEN) throw Object.assign(new Error('WordPress is not configured'), { status: 503 });
  const url = new URL(`${base}/index.php`);
  // Query routing also works before WordPress rewrite rules have been flushed.
  const [route, query = ''] = path.split('?');
  url.searchParams.set('rest_route', `/glr/v1${route}`);
  for (const [key, value] of new URLSearchParams(query)) url.searchParams.set(key, value);
  return url;
}

export async function wordpressFetch(path, options = {}) {
  return fetch(wordpressUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.WORDPRESS_SERVICE_TOKEN}`, ...options.headers },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
    redirect: 'error'
  });
}

export async function wordpressRequest(path, options = {}) {
  const response = await wordpressFetch(path, options);
  if (!response.ok) throw Object.assign(new Error(`WordPress request failed (${response.status})`), { status: response.status });
  return response.status === 204 ? null : response.json();
}
