import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createInquiry } from '@/lib/data-service';

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clean(value) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function rateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const recent = (attempts.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 1000) {
    for (const [key, timestamps] of attempts) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) attempts.delete(key);
    }
  }
  return recent.length > MAX_ATTEMPTS;
}

export async function POST(request) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = {
      name: clean(body.name),
      email: clean(body.email).toLowerCase(),
      phone: clean(body.phone),
      message: clean(body.message)
    };

    const invalid =
      payload.name.length < 2 || payload.name.length > 100 ||
      !validEmail(payload.email) || payload.email.length > 254 ||
      payload.phone.length > 30 ||
      payload.message.length < 10 || payload.message.length > 3000;

    if (invalid) {
      return NextResponse.json({ error: 'Please check the highlighted fields.' }, { status: 422 });
    }

    const inquiry = await createInquiry(payload);
    return NextResponse.json(
      { data: { id: inquiry.id }, message: 'Thank you. Your message has been received.' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to send your message' }, { status: error.status || 500 });
  }
}
