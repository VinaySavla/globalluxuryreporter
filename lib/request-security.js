import { consumeRateLimit } from './data-service';
import { hashPrivateValue } from './subscription-tokens.mjs';

export function clientIdentifier(request) {
  if (process.env.NODE_ENV === 'production' && !process.env.RATE_LIMIT_IP_HEADER) {
    throw Object.assign(new Error('Trusted ingress identity is not configured'), { status: 503 });
  }
  const header = (process.env.RATE_LIMIT_IP_HEADER || 'x-real-ip').toLowerCase();
  return request.headers.get(header)?.split(',')[0]?.trim() || 'unknown';
}

export function requestBodyTooLarge(request, maximumBytes = 16 * 1024) {
  const length = Number(request.headers.get('content-length'));
  return Number.isFinite(length) && length > maximumBytes;
}

export async function rateLimited(request, scope, max, windowMs = 15 * 60 * 1000) {
  return consumeRateLimit({ scope, key: clientIdentifier(request), max, windowMs });
}

export async function rateLimitedKey(scope, key, max, windowMs = 15 * 60 * 1000) {
  return consumeRateLimit({ scope, key, max, windowMs });
}

export function consentIpHash(request) {
  return hashPrivateValue(`consent:${clientIdentifier(request)}`);
}
