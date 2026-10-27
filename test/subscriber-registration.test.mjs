import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('new active subscriptions get an unsubscribe token without a pending-status write', async () => {
  const calls = [];
  const source = readFileSync(new URL('../lib/data-service.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const context = {
    URLSearchParams, cache: fn => fn,
    createSubscriptionToken: (purpose, subscriber) => { assert.equal(purpose, 'unsubscribe'); assert.equal(subscriber.id, 'new-id'); return { token: 'unsubscribe-token' }; },
    wordpressRequest: async (path, options) => {
      calls.push({ path, options });
      if (!options) return { data: [] };
      assert.equal(options.method, 'POST');
      assert.equal(JSON.parse(options.body).consent_ip_hash, 'consent-hash');
      return { data: { id: 'new-id', email: 'reader@example.invalid', status: 'active' } };
    }
  };
  vm.createContext(context);
  vm.runInContext(source + '\nglobalThis.register = createSubscriber;', context);
  const result = await context.register({ email: 'reader@example.invalid', consent_ip_hash: 'consent-hash' });
  assert.equal(result.confirmationToken, null);
  assert.equal(result.unsubscribeToken, 'unsubscribe-token');
  assert.equal(calls.length, 2);
  context.wordpressRequest = async () => ({ data: [{ id: 'existing-id', status: 'active' }] });
  assert.equal((await context.register({ email: 'reader@example.invalid' })).unsubscribeToken, undefined);
});
