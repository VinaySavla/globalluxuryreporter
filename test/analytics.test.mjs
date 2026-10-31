import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsUrl, googleAnalyticsId } from '../lib/analytics.mjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { transformSync } = require('next/dist/build/swc');
const component = transformSync(readFileSync(new URL('../components/WebsiteAnalytics.js', import.meta.url), 'utf8'), {
  filename: 'WebsiteAnalytics.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' }
}).code;

function renderAnalytics({ consent = 'declined', ready = false, href = 'https://readglr.com/reports/luxury?token=secret' } = {}) {
  const effects = [], writes = [], stored = new Map();
  const state = [consent, true, ready];
  let hook = 0, reloads = 0;
  const window = { location: { href, hostname: new URL(href).hostname, reload: () => { reloads += 1; } }, addEventListener() {}, removeEventListener() {} };
  const document = { title: 'Luxury report', referrer: 'https://example.com/path?email=private', get cookie() { return '_ga=one; _ga_ABC1234567=two; essential=keep'; }, set cookie(value) { writes.push(value); } };
  const module = { exports: {} };
  const context = { module, exports: module.exports, URL, Date, window, document, process: { env: { NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-ABC1234567' } }, localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) }, require: name => {
    if (name === 'react') return { useEffect: fn => effects.push(fn), useState: () => [state[hook++], () => {}] };
    if (name === 'next/navigation') return { usePathname: () => new URL(href).pathname };
    if (name === 'next/script') return { __esModule: true, default: 'GoogleScript' };
    if (name === 'next/link') return { __esModule: true, default: 'Link' };
    if (name === '@vercel/analytics/next') return { Analytics: 'VercelAnalytics' };
    if (name === '@/lib/analytics.mjs') return { analyticsUrl, googleAnalyticsId };
    return require(name);
  } };
  vm.runInNewContext(component, context);
  const element = module.exports.default({ enabled: true });
  effects[1]();
  return { element, window, writes, stored, reloads: () => reloads };
}

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

test('analytics URLs exclude query strings, fragments and private routes', () => {
  assert.equal(analyticsUrl('https://readglr.com/reports/luxury?email=private@example.invalid#secret'), 'https://readglr.com/reports/luxury');
  assert.equal(analyticsUrl('https://www.readglr.com/search?q=private'), 'https://www.readglr.com/search');
  for (const path of ['/subscription/confirm?token=secret', '/subscription', '/Subscription%2fconfirm?token=secret', '/api/assets/private', '/cms/wp-admin/', '/wp-admin/', '/wp-login.php']) assert.equal(analyticsUrl(`https://readglr.com${path}`), null, path);
  for (const url of ['https://marketing.readglr.com/cms', 'https://preview.vercel.app/', 'http://readglr.com/', 'javascript:alert(1)', 'not a URL', 'https://readglr.com/%ZZ']) assert.equal(analyticsUrl(url), null, url);
});

test('Google Analytics configuration accepts only a measurement ID', () => {
  assert.equal(googleAnalyticsId('G-ABC1234567'), 'G-ABC1234567');
  for (const value of ['', 'G-ABC"</script>', 'UA-123-1', 'GTM-123', 'secret-key']) assert.equal(googleAnalyticsId(value), null, value);
});

test('Google tracking waits for consent and sends sanitized page views after acceptance', () => {
  const declined = renderAnalytics();
  assert.ok(!elements(declined.element).some(node => node.type === 'GoogleScript'));
  assert.equal(declined.window.dataLayer, undefined);
  const accepted = renderAnalytics({ consent: 'accepted', ready: true });
  assert.ok(elements(accepted.element).some(node => node.type === 'GoogleScript'));
  const commands = accepted.window.dataLayer.map(command => Array.from(command));
  const config = commands.find(command => command[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.page_referrer, 'https://example.com');
  assert.equal(commands.find(command => command[1] === 'page_view')[2].page_location, 'https://readglr.com/reports/luxury');
  const privatePage = renderAnalytics({ consent: 'accepted', ready: true, href: 'https://readglr.com/subscription/confirm?token=secret' });
  assert.ok(!elements(privatePage.element).some(node => node.type === 'GoogleScript'));
  assert.equal(privatePage.window.dataLayer, undefined);
  assert.equal(privatePage.window['ga-disable-G-ABC1234567'], true);
});

test('withdrawing consent disables Google tracking, clears only GA cookies and reloads the active tag', () => {
  const current = renderAnalytics({ consent: 'accepted', ready: true });
  elements(current.element).find(node => node.type === 'button' && node.props.children === 'Decline').props.onClick();
  assert.equal(current.stored.get('glr-analytics-consent'), 'declined');
  assert.equal(current.window['ga-disable-G-ABC1234567'], true);
  assert.equal(current.reloads(), 1);
  assert.equal(current.writes.length, 6);
  assert.ok(current.writes.every(value => value.startsWith('_ga') && value.includes('Max-Age=0')));
});
