import assert from 'node:assert/strict';
import test from 'node:test';
import { addPublishedReportFilters } from '../lib/publication.mjs';
import { createSubscriptionToken, hashPrivateValue, verifySubscriptionToken } from '../lib/subscription-tokens.mjs';

process.env.SUBSCRIPTION_SECRET = 'test-secret-that-is-not-used-outside-tests';

test('public report filters reject drafts and future publication dates', () => {
  const params = addPublishedReportFilters(new URLSearchParams());
  assert.equal(params.get('filter[status][_eq]'), 'published');
  assert.equal(params.get('filter[published_at][_lte]'), '$NOW');
});

test('subscription tokens are purpose-bound, tamper-evident, and nonce-verifiable', () => {
  const subscriber = { id: 'subscriber-1', email: 'reader@example.com' };
  const { token, nonce } = createSubscriptionToken('confirm', subscriber, 60);
  assert.equal(verifySubscriptionToken(token, 'confirm').email, subscriber.email);
  assert.equal(verifySubscriptionToken(token, 'unsubscribe'), null);
  assert.equal(verifySubscriptionToken(`${token}x`, 'confirm'), null);
  assert.equal(hashPrivateValue(nonce).length, 64);
});
