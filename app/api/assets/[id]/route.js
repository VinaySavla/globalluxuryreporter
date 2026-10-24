import { NextResponse } from 'next/server';
import { wordpressFetch } from '@/lib/wordpress-client.mjs';

const allowedValues = {
  width: (value) => /^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 2400,
  height: (value) => /^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 2400,
  quality: (value) => /^\d+$/.test(value) && Number(value) >= 20 && Number(value) <= 90,
  fit: (value) => ['cover', 'contain', 'inside', 'outside'].includes(value),
  format: (value) => ['auto', 'jpg', 'png', 'webp', 'avif'].includes(value)
};

export async function GET(request, { params }) {
  if (!process.env.WORDPRESS_URL || !process.env.WORDPRESS_SERVICE_TOKEN) return NextResponse.json({ error: 'Asset service is not configured' }, { status: 503 });

  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{1,128}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid asset identifier' }, { status: 400 });
  }

  const query = new URLSearchParams();
  for (const [key, valid] of Object.entries(allowedValues)) {
    const value = request.nextUrl.searchParams.get(key);
    if (value && valid(value)) query.set(key, value);
  }

  try {
    const range = request.headers.get('range');
    if (range && (range.length > 100 || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))) return NextResponse.json({ error: 'Invalid media range' }, { status: 400 });
    // WordPress repeats the publication check for every full or partial media request.
    const upstream = await wordpressFetch(`/assets/${encodeURIComponent(id)}${query.size ? `?${query}` : ''}`, range ? { headers: { Range: range } } : {});
    if (upstream.status === 416) return new Response(null, { status: 416, headers: { 'Content-Range': upstream.headers.get('content-range') || 'bytes */0', 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes' } });
    if (!upstream.ok) {
      return NextResponse.json({ error: upstream.status === 404 ? 'Asset not found' : 'Asset service unavailable' }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition', 'etag', 'last-modified']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Authorization depends on the asset still being referenced by published content.
    // Never let a browser or CDN outlive that authorization decision.
    headers.set('cache-control', 'private, no-store, max-age=0');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error('WordPress asset proxy failed', error);
    return NextResponse.json({ error: 'Asset service unavailable' }, { status: 502 });
  }
}
