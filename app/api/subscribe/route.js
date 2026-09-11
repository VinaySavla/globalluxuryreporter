import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createSubscriber } from '@/lib/data-service';
import { sendConfirmationEmail } from '@/lib/email';
import { absoluteUrl } from '@/lib/site';
import { consentIpHash, rateLimited, rateLimitedKey, requestBodyTooLarge } from '@/lib/request-security';

function clean(value) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim().toLowerCase();
}

export async function POST(request) {
  if (requestBodyTooLarge(request)) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });

  try {
    if (await rateLimited(request, 'subscribe-ip', 10)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }
    const body = await request.json();
    if (body.website) return NextResponse.json({ message: 'If this address is eligible, a confirmation email will arrive shortly.' }, { status: 202 });
    const email = clean(body.email);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
    }

    if (await rateLimitedKey('subscribe-email', email, 4)) {
      return NextResponse.json({ message: 'If this address is eligible, a confirmation email will arrive shortly.' }, { status: 202 });
    }
    const subscriber = await createSubscriber({ email, consent_ip_hash: consentIpHash(request) });
    if (subscriber.confirmationToken) {
      try {
        await sendConfirmationEmail(email, absoluteUrl(`/subscription/confirm?token=${encodeURIComponent(subscriber.confirmationToken)}`));
      } catch (error) {
        console.error('Unable to deliver subscription confirmation email', error);
      }
    }
    return NextResponse.json({ message: 'If this address is eligible, a confirmation email will arrive shortly.' }, { status: 202 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to register your email right now.' }, { status: error.status === 422 ? 422 : 503 });
  }
}
