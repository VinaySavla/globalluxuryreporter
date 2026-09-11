import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createInquiry } from '@/lib/data-service';
import { rateLimited, requestBodyTooLarge } from '@/lib/request-security';

function clean(value) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  if (requestBodyTooLarge(request)) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });

  try {
    if (await rateLimited(request, 'contact-ip', 8)) {
      return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }
    const body = await request.json();
    if (body.website) return NextResponse.json({ message: 'Thank you. Your message has been received.' }, { status: 202 });
    const payload = {
      name: clean(body.name),
      email: clean(body.email).toLowerCase(),
      message: clean(body.message)
    };

    const invalid =
      payload.name.length < 2 || payload.name.length > 100 ||
      !validEmail(payload.email) || payload.email.length > 254 ||
      payload.message.length < 10 || payload.message.length > 3000;

    if (invalid) {
      return NextResponse.json({ error: 'Please check the highlighted fields.' }, { status: 422 });
    }

    await createInquiry(payload);
    return NextResponse.json(
      { message: 'Thank you. Your message has been received.' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to send your message' }, { status: error.status === 422 ? 422 : 503 });
  }
}
