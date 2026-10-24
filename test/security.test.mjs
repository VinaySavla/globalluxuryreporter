import assert from 'node:assert/strict';
import test from 'node:test';
import { createSubscriptionToken, hashPrivateValue, verifySubscriptionToken } from '../lib/subscription-tokens.mjs';

process.env.SUBSCRIPTION_SECRET = 'test-secret-that-is-not-used-outside-tests';

test('subscription tokens are purpose-bound, tamper-evident, and nonce-verifiable', () => {
  const subscriber = { id: 'subscriber-1', email: 'reader@example.com' };
  const { token, nonce } = createSubscriptionToken('confirm', subscriber, 60);
  assert.equal(verifySubscriptionToken(token, 'confirm').email, subscriber.email);
  assert.equal(verifySubscriptionToken(token, 'unsubscribe'), null);
  assert.equal(verifySubscriptionToken(`${token}x`, 'confirm'), null);
  assert.equal(hashPrivateValue(nonce).length, 64);
});
