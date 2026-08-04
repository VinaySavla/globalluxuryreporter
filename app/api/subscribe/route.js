import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createSubscriber } from '@/lib/data-service';

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clean(value) {
  return sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }).trim().toLowerCase();
}

function rateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const recent = (attempts.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

export async function POST(request) {
  if (rateLimited(request)) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });

  try {
    const body = await request.json();
    const email = clean(body.email);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
    }

    const subscriber = await createSubscriber({ email });
    return NextResponse.json({ data: { id: subscriber.id }, message: 'Welcome to Global Luxury Reporter.' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to register your email right now.' }, { status: error.status || 500 });
  }
}
