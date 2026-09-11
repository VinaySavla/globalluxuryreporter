import { NextResponse } from 'next/server';
import { addPublishedReportFilters } from '@/lib/publication.mjs';

const directusUrl = process.env.DIRECTUS_URL?.replace(/\/$/, '');
const allowedValues = {
  width: (value) => /^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 2400,
  height: (value) => /^\d+$/.test(value) && Number(value) >= 16 && Number(value) <= 2400,
  quality: (value) => /^\d+$/.test(value) && Number(value) >= 20 && Number(value) <= 90,
  fit: (value) => ['cover', 'contain', 'inside', 'outside'].includes(value),
  format: (value) => ['auto', 'jpg', 'png', 'webp', 'avif'].includes(value)
};

function authHeaders() {
  return process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {};
}

async function isPublicAsset(id) {
  const categoryQuery = new URLSearchParams({ fields: 'id', limit: '1' });
  categoryQuery.set('filter[cover_image][_eq]', id);
  const reportQuery = new URLSearchParams({ fields: 'id', limit: '1' });
  reportQuery.set('filter[_or][0][cover_image][_eq]', id);
  reportQuery.set('filter[_or][1][content][_contains]', id);
  addPublishedReportFilters(reportQuery);

  const [categories, reports] = await Promise.all([
    fetch(`${directusUrl}/items/categories?${categoryQuery}`, { headers: authHeaders(), cache: 'no-store', signal: AbortSignal.timeout(8000) }),
    fetch(`${directusUrl}/items/reports?${reportQuery}`, { headers: authHeaders(), cache: 'no-store', signal: AbortSignal.timeout(8000) })
  ]);
  if (!categories.ok || !reports.ok) throw new Error('Unable to authorize asset');
  const [categoryBody, reportBody] = await Promise.all([categories.json(), reports.json()]);
  return Boolean(categoryBody.data?.length || reportBody.data?.length);
}

export async function GET(request, { params }) {
  if (!directusUrl) return NextResponse.json({ error: 'Asset service is not configured' }, { status: 503 });

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
    if (!(await isPublicAsset(id))) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    const upstream = await fetch(`${directusUrl}/assets/${encodeURIComponent(id)}${query.size ? `?${query}` : ''}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store'
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: upstream.status === 404 ? 'Asset not found' : 'Asset service unavailable' }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    for (const name of ['content-type', 'content-length', 'etag', 'last-modified']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Authorization depends on the asset still being referenced by published content.
    // Never let a browser or CDN outlive that authorization decision.
    headers.set('cache-control', 'private, no-store, max-age=0');
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('Directus asset proxy failed', error);
    return NextResponse.json({ error: 'Asset service unavailable' }, { status: 502 });
  }
}
