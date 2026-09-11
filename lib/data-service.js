import 'server-only';
import { cache } from 'react';
import { fallbackCategories, fallbackReports } from './fallback-data';
import { sanitizeReportHtml } from './report-html';
import { addPublishedReportFilters } from './publication.mjs';
import { createSubscriptionToken, hashPrivateValue, verifySubscriptionToken } from './subscription-tokens.mjs';

const directusUrl = process.env.DIRECTUS_URL?.replace(/\/$/, '');
const useMockData = process.env.NODE_ENV !== 'production' && process.env.USE_MOCK_DATA === 'true';

const REPORT_LIST_FIELDS = [
  'id', 'title', 'slug', 'excerpt', 'cover_image', 'cover_alt', 'author',
  'published_at', 'reading_time', 'featured', 'editor_pick', 'popularity',
  'category.id', 'category.name', 'category.slug', 'category.description', 'category.cover_image'
].join(',');
const REPORT_FIELDS = `${REPORT_LIST_FIELDS},content,date_updated`;

function assetUrl(value) {
  if (!value) return null;
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) return value;
  const id = typeof value === 'object' ? value.id : value;
  return `/api/assets/${encodeURIComponent(id)}`;
}

function mapCategory(item) {
  return { ...item, cover_image: assetUrl(item.cover_image) };
}

function mapReport(item) {
  return {
    ...item,
    ...(Object.hasOwn(item, 'content') ? { content: sanitizeReportHtml(item.content) } : {}),
    cover_image: assetUrl(item.cover_image),
    category: item.category && typeof item.category === 'object' ? mapCategory(item.category) : item.category
  };
}

async function directusRequest(path, options = {}) {
  if (!directusUrl) throw Object.assign(new Error('DIRECTUS_URL is not configured'), { status: 503 });
  const response = await fetch(`${directusUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {}),
      ...options.headers
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = new Error(`Directus request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getReports({ category, featured, search, page = 1, limit = 9, unlimited = false } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = unlimited ? -1 : Math.min(24, Math.max(1, Number(limit) || 9));

  if (useMockData) {
    let items = [...fallbackReports];
    if (category) items = items.filter((item) => item.category.slug === category);
    if (featured !== undefined) items = items.filter((item) => item.featured === Boolean(featured));
    if (search) {
      const query = search.toLowerCase();
      items = items.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(query));
    }
    const total = items.length;
    return {
      data: (unlimited ? items : items.slice((safePage - 1) * safeLimit, safePage * safeLimit)).map(mapReport),
      meta: { total_count: total, page: safePage, limit: safeLimit }
    };
  }

  const params = new URLSearchParams({
    fields: REPORT_LIST_FIELDS,
    sort: '-published_at',
    limit: String(safeLimit),
    meta: 'filter_count'
  });
  if (!unlimited) params.set('page', String(safePage));
  addPublishedReportFilters(params);
  if (category) params.append('filter[category][slug][_eq]', category);
  if (featured !== undefined) params.append('filter[featured][_eq]', String(Boolean(featured)));
  if (search) params.append('search', search);
  const result = await directusRequest(`/items/reports?${params}`);
  return {
    data: result.data.map(mapReport),
    meta: { total_count: result.meta?.filter_count || 0, page: safePage, limit: unlimited ? result.data.length : safeLimit }
  };
}

async function fetchReport(slug) {
  if (useMockData) {
    const report = fallbackReports.find((item) => item.slug === slug);
    return report ? mapReport(report) : null;
  }
  const params = new URLSearchParams({
    fields: REPORT_FIELDS,
    limit: '1'
  });
  params.append('filter[slug][_eq]', slug);
  addPublishedReportFilters(params);
  const result = await directusRequest(`/items/reports?${params}`);
  return result.data[0] ? mapReport(result.data[0]) : null;
}

export const getReport = cache(fetchReport);

export async function getCategories() {
  if (useMockData) return fallbackCategories;
  const result = await directusRequest('/items/categories?fields=id,name,slug,description,cover_image&sort=sort,name');
  return result.data.map(mapCategory);
}

export async function getSitemapContent() {
  if (useMockData) {
    return {
      categories: fallbackCategories.map(({ slug }) => ({ slug })),
      reports: fallbackReports.map(({ slug, published_at }) => ({ slug, published_at, date_updated: published_at }))
    };
  }
  const reportParams = addPublishedReportFilters(new URLSearchParams({ fields: 'slug,published_at,date_updated', sort: '-published_at', limit: '-1' }));
  const [categories, reports] = await Promise.all([
    directusRequest('/items/categories?fields=slug&limit=-1&sort=sort,name'),
    directusRequest(`/items/reports?${reportParams}`)
  ]);
  return { categories: categories.data, reports: reports.data };
}

export async function createInquiry(payload) {
  if (useMockData) return { id: `mock-${Date.now()}`, ...payload };
  const result = await directusRequest('/items/inquiries', {
    method: 'POST',
    body: JSON.stringify({ ...payload, status: 'new' })
  });
  return result?.data || {};
}

export async function createSubscriber(payload) {
  if (useMockData) return { email: payload.email, confirmationToken: 'development-confirmation-token' };
  const lookup = new URLSearchParams({ fields: 'id,email,status', limit: '1' });
  lookup.append('filter[email][_eq]', payload.email);
  const existing = await directusRequest(`/items/subscribers?${lookup}`);
  if (existing.data[0]?.status === 'active') return { email: payload.email, confirmationToken: null };

  let subscriber = existing.data[0];
  if (!subscriber) {
    try {
      const result = await directusRequest('/items/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, status: 'pending', source: 'website_dialog', consent_version: '2026-09-11' })
      });
      subscriber = { ...result.data, email: result.data.email || payload.email };
    } catch (error) {
      if (error.status !== 400) throw error;
      const raced = await directusRequest(`/items/subscribers?${lookup}`);
      subscriber = raced.data[0];
      if (!subscriber || subscriber.status === 'active') return { email: payload.email, confirmationToken: null };
    }
  }

  const confirmation = createSubscriptionToken('confirm', subscriber);
  await directusRequest(`/items/subscribers/${subscriber.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'pending',
      confirmation_nonce_hash: hashPrivateValue(confirmation.nonce),
      confirmation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      consent_ip_hash: payload.consent_ip_hash || null,
      consent_version: '2026-09-11'
    })
  });
  return { email: payload.email, confirmationToken: confirmation.token };
}

export async function confirmSubscriber(token) {
  const claims = verifySubscriptionToken(token, 'confirm');
  if (!claims || useMockData) return null;
  const result = await directusRequest(`/items/subscribers/${encodeURIComponent(claims.id)}?fields=id,email,status,confirmation_nonce_hash,confirmation_expires_at`);
  const subscriber = result.data;
  if (!subscriber || subscriber.email !== claims.email || subscriber.status !== 'pending' ||
      subscriber.confirmation_nonce_hash !== hashPrivateValue(claims.nonce) || new Date(subscriber.confirmation_expires_at).getTime() < Date.now()) return null;

  return {
    id: subscriber.id,
    email: subscriber.email,
    confirmationNonceHash: subscriber.confirmation_nonce_hash,
    unsubscribeToken: createSubscriptionToken('unsubscribe', subscriber, 10 * 365 * 24 * 60 * 60).token
  };
}

export async function activateSubscriber(subscriber) {
  if (!subscriber || useMockData) return false;
  const result = await directusRequest(`/items/subscribers/${encodeURIComponent(subscriber.id)}?fields=id,email,status,confirmation_nonce_hash,confirmation_expires_at`);
  const current = result.data;
  if (!current || current.email !== subscriber.email) return false;
  if (current.status === 'active') return true;
  if (current.status !== 'pending' || current.confirmation_nonce_hash !== subscriber.confirmationNonceHash ||
      new Date(current.confirmation_expires_at).getTime() < Date.now()) return false;

  await directusRequest(`/items/subscribers/${encodeURIComponent(current.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active', confirmed_at: new Date().toISOString(), confirmation_nonce_hash: null, confirmation_expires_at: null })
  });
  return true;
}

export async function unsubscribeSubscriber(token) {
  const claims = verifySubscriptionToken(token, 'unsubscribe');
  if (!claims || useMockData) return false;
  const result = await directusRequest(`/items/subscribers/${encodeURIComponent(claims.id)}?fields=id,email,status`);
  if (!result.data || result.data.email !== claims.email) return false;
  if (result.data.status !== 'unsubscribed') {
    await directusRequest(`/items/subscribers/${encodeURIComponent(claims.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    });
  }
  return true;
}

export async function consumeRateLimit({ scope, key, max, windowMs }) {
  if (useMockData) return false;
  await purgeExpiredRateLimits();
  const keyHash = hashPrivateValue(`${scope}:${key}`);
  await directusRequest('/items/request_attempts', {
    method: 'POST',
    body: JSON.stringify({ scope, key_hash: keyHash, expires_at: new Date(Date.now() + windowMs).toISOString() })
  });
  const query = new URLSearchParams({ 'aggregate[count]': 'id', limit: '1' });
  query.set('filter[scope][_eq]', scope);
  query.set('filter[key_hash][_eq]', keyHash);
  query.set('filter[expires_at][_gt]', '$NOW');
  const result = await directusRequest(`/items/request_attempts?${query}`);
  const countValue = result.data?.[0]?.count;
  const count = Number(typeof countValue === 'object' ? countValue.id : countValue) || 0;
  return count > max;
}

export async function purgeExpiredRateLimits() {
  if (useMockData) return;
  const query = new URLSearchParams({ fields: 'id', limit: '1000' });
  query.set('filter[expires_at][_lt]', '$NOW');
  const expired = await directusRequest(`/items/request_attempts?${query}`);
  if (expired.data.length) {
    await directusRequest('/items/request_attempts', { method: 'DELETE', body: JSON.stringify(expired.data.map((item) => item.id)) });
  }
}

export async function getDirectusHealth() {
  if (useMockData) return { status: 'mock', productionReady: false };
  return directusRequest('/server/health');
}

export function getRuntimeConfiguration() {
  const missing = [];
  if (!directusUrl) missing.push('DIRECTUS_URL');
  if (!process.env.DIRECTUS_TOKEN) missing.push('DIRECTUS_TOKEN');
  if (process.env.NODE_ENV === 'production') {
    for (const name of ['SITE_URL', 'SUBSCRIPTION_SECRET', 'RATE_LIMIT_IP_HEADER', 'SMTP_HOST', 'EMAIL_FROM', 'LEGAL_ENTITY_NAME', 'LEGAL_ADDRESS', 'PRIVACY_EMAIL']) {
      if (!process.env[name]) missing.push(name);
    }
  }
  return { ready: missing.length === 0 && !useMockData, missing, mock: useMockData };
}
