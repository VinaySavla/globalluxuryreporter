import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function site(env) {
  const source = readFileSync(new URL('../lib/site.js', import.meta.url), 'utf8').replace(/export /g, '');
  return vm.runInNewContext(`${source}; ({ siteOrigin, absoluteUrl, indexingEnabled })`, { process: { env }, URL });
}

function route(file, context) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export default ', '').replace(/export /g, '');
  const name = file.includes('robots') ? 'robots' : 'sitemap';
  return vm.runInNewContext(`${source}; ${name}`, context);
}

test('only canonical production builds enable indexing; previews, local builds and explicit pauses stay noindex', () => {
  assert.equal(site({ NODE_ENV: 'production' }).siteOrigin, 'https://readglr.com');
  assert.equal(site({ NODE_ENV: 'production' }).indexingEnabled, true);
  assert.equal(site({ NODE_ENV: 'production', VERCEL_ENV: 'production', ROBOTS_INDEXING: 'true' }).indexingEnabled, true);
  for (const env of [
    { NODE_ENV: 'development', ROBOTS_INDEXING: 'true' },
    { NODE_ENV: 'production', VERCEL_ENV: 'preview', ROBOTS_INDEXING: 'true' },
    { NODE_ENV: 'production', ROBOTS_INDEXING: 'false' },
    { NODE_ENV: 'production', SITE_URL: 'https://marketing.readglr.com/cms', ROBOTS_INDEXING: 'true' },
    { NODE_ENV: 'production', SITE_URL: 'https://globalluxuryreporter.vercel.app', ROBOTS_INDEXING: 'true' }
  ]) assert.equal(site(env).indexingEnabled, false, JSON.stringify(env));
});

test('production robots expose the frontend sitemap and images while excluding internal APIs and CMS paths', () => {
  const context = site({ NODE_ENV: 'production' });
  const result = route('../app/robots.js', context)();
  assert.equal(result.sitemap, 'https://readglr.com/sitemap.xml');
  assert.ok(result.rules.allow.includes('/api/assets/'));
  assert.ok(result.rules.disallow.includes('/api/') && result.rules.disallow.includes('/cms/'));
  assert.ok(!result.rules.disallow.includes('/search') && !result.rules.disallow.includes('/subscription/'));
  assert.equal(route('../app/robots.js', { ...context, indexingEnabled: false })().rules.disallow, '/');
});

test('sitemap maps published records to frontend URLs and preserves real modification dates', async () => {
  const context = { ...site({ NODE_ENV: 'production' }), getSitemapContent: async () => ({ categories: [{ slug: 'culture' }], reports: [{ slug: 'published-report', published_at: '2026-10-01T10:00:00Z', date_updated: '2026-10-30T12:00:00Z' }] }) };
  const entries = await route('../app/sitemap.js', context)();
  assert.ok(entries.every(entry => entry.url.startsWith('https://readglr.com/')));
  assert.ok(entries.every(entry => !/marketing|wp-admin|\/cms|\/api|\/search|\/subscription/.test(entry.url)));
  assert.equal(entries.find(entry => entry.url.endsWith('/reports/published-report')).lastModified, '2026-10-30T12:00:00Z');
  const blocked = await route('../app/sitemap.js', { ...context, indexingEnabled: false, getSitemapContent: () => { throw new Error('No CMS read needed'); } })();
  assert.equal(blocked.length, 0);
});

test('logo icons have the advertised dimensions and the favicon contains valid PNG frames', () => {
  for (const [path, size] of [['../app/icon.png', 96], ['../app/apple-icon.png', 180], ['../public/icons/icon-192.png', 192], ['../public/icons/icon-512.png', 512]]) {
    const png = readFileSync(new URL(path, import.meta.url));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const ico = readFileSync(new URL('../app/favicon.ico', import.meta.url));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (let i = 0; i < 3; i += 1) {
    const entry = 6 + i * 16;
    const frame = ico.subarray(ico.readUInt32LE(entry + 12), ico.readUInt32LE(entry + 12) + ico.readUInt32LE(entry + 8));
    assert.equal(frame.readUInt32BE(16), ico[entry]);
    assert.equal(frame.readUInt32BE(20), ico[entry + 1]);
  }
});
