import 'server-only';
import { cache } from 'react';
import { sanitizeReportHtml } from './report-html';
import { wordpressRequest } from './wordpress-client.mjs';
import { createSubscriptionToken, hashPrivateValue, verifySubscriptionToken } from './subscription-tokens.mjs';

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

export async function getReports({ category, featured, search, page = 1, limit = 9, unlimited = false } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = unlimited ? -1 : Math.min(24, Math.max(1, Number(limit) || 9));

  const params = new URLSearchParams({ limit: String(safeLimit) });
  if (!unlimited) params.set('page', String(safePage));
  if (category) params.set('category', category);
  if (featured !== undefined) params.set('featured', String(Boolean(featured)));
  if (search) params.append('search', search);
  const result = await wordpressRequest(`/reports?${params}`);
  return {
    data: result.data.map(mapReport),
    meta: { total_count: result.meta?.total_count || 0, page: safePage, limit: unlimited ? result.data.length : safeLimit }
  };
}

async function fetchReport(slug) {
  const params = new URLSearchParams({ slug, limit: '1' });
  const result = await wordpressRequest(`/reports?${params}`);
  return result.data[0] ? mapReport(result.data[0]) : null;
}

export const getReport = cache(fetchReport);

export async function getCategories() {
  const result = await wordpressRequest('/categories');
  return result.data.map(mapCategory);
}

export async function getSitemapContent() {
  return wordpressRequest('/sitemap');
}

export async function createInquiry(payload) {
  const result = await wordpressRequest('/inquiries', {
    method: 'POST',
    body: JSON.stringify({ ...payload, status: 'new' })
  });
  return result?.data || {};
}

export async function createSubscriber(payload) {
  const lookup = new URLSearchParams({ email: payload.email });
  const existing = await wordpressRequest(`/subscribers?${lookup}`);
  if (existing.data[0]?.status === 'active') return { email: payload.email, confirmationToken: null };

  let subscriber = existing.data[0];
  if (!subscriber) {
    try {
      const result = await wordpressRequest('/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, status: 'active', source: 'website_dialog', consent_ip_hash: payload.consent_ip_hash || null, consent_version: '2026-09-11' })
      });
      subscriber = { ...result.data, email: result.data.email || payload.email };
    } catch (error) {
      if (error.status !== 400) throw error;
      const raced = await wordpressRequest(`/subscribers?${lookup}`);
      subscriber = raced.data[0];
      if (!subscriber || subscriber.status === 'active') return { email: payload.email, confirmationToken: null };
    }
  }

  if (subscriber.status === 'active') return { email: payload.email, confirmationToken: null, unsubscribeToken: createSubscriptionToken('unsubscribe', subscriber, 10 * 365 * 24 * 60 * 60).token };
  const confirmation = createSubscriptionToken('confirm', subscriber);
  await wordpressRequest(`/subscribers/${subscriber.id}`, {
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
  if (!claims) return null;
  const result = await wordpressRequest(`/subscribers/${encodeURIComponent(claims.id)}`);
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
  if (!subscriber) return false;
  const result = await wordpressRequest(`/subscribers/${encodeURIComponent(subscriber.id)}`);
  const current = result.data;
  if (!current || current.email !== subscriber.email) return false;
  if (current.status === 'active') return true;
  if (current.status !== 'pending' || current.confirmation_nonce_hash !== subscriber.confirmationNonceHash ||
      new Date(current.confirmation_expires_at).getTime() < Date.now()) return false;

  await wordpressRequest(`/subscribers/${encodeURIComponent(current.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active', expected_nonce_hash: subscriber.confirmationNonceHash, confirmed_at: new Date().toISOString(), confirmation_nonce_hash: null, confirmation_expires_at: null })
  });
  return true;
}

export async function unsubscribeSubscriber(token) {
  const claims = verifySubscriptionToken(token, 'unsubscribe');
  if (!claims) return false;
  const result = await wordpressRequest(`/subscribers/${encodeURIComponent(claims.id)}`);
  if (!result.data || result.data.email !== claims.email) return false;
  if (result.data.status !== 'unsubscribed') {
    await wordpressRequest(`/subscribers/${encodeURIComponent(claims.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    });
  }
  return true;
}

export async function consumeRateLimit({ scope, key, max, windowMs }) {
  const keyHash = hashPrivateValue(`${scope}:${key}`);
  const result = await wordpressRequest('/rate-limit', {
    method: 'POST',
    body: JSON.stringify({ scope, key_hash: keyHash, max, window_seconds: Math.ceil(windowMs / 1000) })
  });
  return result.limited;
}

export async function getCmsHealth() {
  return wordpressRequest('/health');
}

export function getRuntimeConfiguration() {
  const missing = [];
  if (!process.env.WORDPRESS_URL) missing.push('WORDPRESS_URL');
  if (!process.env.WORDPRESS_SERVICE_TOKEN) missing.push('WORDPRESS_SERVICE_TOKEN');
  if (process.env.NODE_ENV === 'production') {
    for (const name of ['SITE_URL', 'SUBSCRIPTION_SECRET', 'RATE_LIMIT_IP_HEADER', 'SMTP_HOST', 'EMAIL_FROM', 'LEGAL_ENTITY_NAME', 'LEGAL_ADDRESS', 'PRIVACY_EMAIL']) {
      if (!process.env[name]) missing.push(name);
    }
  }
  return { ready: missing.length === 0, missing };
}
