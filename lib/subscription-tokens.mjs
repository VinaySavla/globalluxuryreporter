import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function secret() {
  const value = process.env.SUBSCRIPTION_SECRET || (process.env.NODE_ENV !== 'production' ? process.env.WORDPRESS_SERVICE_TOKEN : '');
  if (!value) throw Object.assign(new Error('SUBSCRIPTION_SECRET is not configured'), { status: 503 });
  return value;
}

function signature(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSubscriptionToken(purpose, subscriber, lifetimeSeconds = 24 * 60 * 60) {
  const nonce = randomBytes(24).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ purpose, id: subscriber.id, email: subscriber.email, nonce, exp: Math.floor(Date.now() / 1000) + lifetimeSeconds })).toString('base64url');
  return { token: `${payload}.${signature(payload)}`, nonce };
}

export function verifySubscriptionToken(token, purpose) {
  const [payload, suppliedSignature, extra] = String(token || '').split('.');
  if (!payload || !suppliedSignature || extra) return null;
  const expected = signature(payload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (value.purpose !== purpose || !value.id || !value.email || !value.nonce || value.exp < Math.floor(Date.now() / 1000)) return null;
    return value;
  } catch {
    return null;
  }
}

export function hashPrivateValue(value) {
  return createHmac('sha256', secret()).update(String(value)).digest('hex');
}
