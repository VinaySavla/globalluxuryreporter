import assert from 'node:assert/strict';
import test from 'node:test';
import { wordpressRequest, wordpressUrl } from '../lib/wordpress-client.mjs';

test('WordPress routing keeps the CMS subdirectory and query values intact', () => {
  process.env.WORDPRESS_URL = 'https://cms.example.invalid/cms';
  process.env.WORDPRESS_SERVICE_TOKEN = 'test-only';
  const url = wordpressUrl('/reports?slug=one%26two&featured=false');
  assert.equal(url.pathname, '/cms/index.php');
  assert.equal(url.searchParams.get('rest_route'), '/glr/v1/reports');
  assert.equal(url.searchParams.get('slug'), 'one&two');
  assert.equal(url.searchParams.get('featured'), 'false');
});

test('CMS requests are authenticated server-side, uncached, and fail closed', async (t) => {
  process.env.WORDPRESS_URL = 'https://cms.example.invalid/cms';
  process.env.WORDPRESS_SERVICE_TOKEN = 'test-only';
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-only');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    return new Response('{}', { status: 401 });
  });
  await assert.rejects(wordpressRequest('/subscribers'), { status: 401 });
});
