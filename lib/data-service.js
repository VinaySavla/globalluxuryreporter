import 'server-only';
import { fallbackCategories, fallbackReports } from './fallback-data';

const directusUrl = process.env.DIRECTUS_URL?.replace(/\/$/, '');
const useMockData = process.env.USE_MOCK_DATA === 'true' || !directusUrl;

function assetUrl(value) {
  if (!value) return null;
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) return value;
  const id = typeof value === 'object' ? value.id : value;
  return `${directusUrl}/assets/${id}`;
}

function mapCategory(item) {
  return { ...item, cover_image: assetUrl(item.cover_image) };
}

function mapReport(item) {
  return {
    ...item,
    cover_image: assetUrl(item.cover_image),
    category: item.category && typeof item.category === 'object' ? mapCategory(item.category) : item.category
  };
}

async function directusRequest(path, options = {}) {
  const response = await fetch(`${directusUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {}),
      ...options.headers
    },
    signal: AbortSignal.timeout(8000),
    cache: options.method ? 'no-store' : undefined,
    next: options.method ? undefined : { revalidate: 60 }
  });

  if (!response.ok) {
    const error = new Error(`Directus request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function getReports({ category, featured, search, page = 1, limit = 9 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(24, Math.max(1, Number(limit) || 9));

  if (useMockData) {
    let items = [...fallbackReports];
    if (category) items = items.filter((item) => item.category.slug === category);
    if (featured !== undefined) items = items.filter((item) => item.featured === Boolean(featured));
    if (search) {
      const query = search.toLowerCase();
      items = items.filter((item) => `${item.title} ${item.excerpt}`.toLowerCase().includes(query));
    }
    const total = items.length;
    return {
      data: items.slice((safePage - 1) * safeLimit, safePage * safeLimit),
      meta: { total_count: total, page: safePage, limit: safeLimit }
    };
  }

  const params = new URLSearchParams({
    fields: 'id,title,slug,excerpt,content,cover_image,author,published_at,featured,category.id,category.name,category.slug,category.cover_image',
    sort: '-published_at',
    page: String(safePage),
    limit: String(safeLimit),
    meta: 'filter_count'
  });
  params.append('filter[status][_eq]', 'published');
  if (category) params.append('filter[category][slug][_eq]', category);
  if (featured !== undefined) params.append('filter[featured][_eq]', String(Boolean(featured)));
  if (search) params.append('search', search);
  const result = await directusRequest(`/items/reports?${params}`);
  return {
    data: result.data.map(mapReport),
    meta: { total_count: result.meta?.filter_count || 0, page: safePage, limit: safeLimit }
  };
}

export async function getReport(slug) {
  if (useMockData) return fallbackReports.find((item) => item.slug === slug) || null;
  const params = new URLSearchParams({
    fields: 'id,title,slug,excerpt,content,cover_image,author,published_at,featured,category.id,category.name,category.slug,category.cover_image',
    limit: '1'
  });
  params.append('filter[slug][_eq]', slug);
  params.append('filter[status][_eq]', 'published');
  const result = await directusRequest(`/items/reports?${params}`);
  return result.data[0] ? mapReport(result.data[0]) : null;
}

export async function getCategories() {
  if (useMockData) return fallbackCategories;
  const result = await directusRequest('/items/categories?fields=id,name,slug,description,cover_image&sort=sort,name');
  return result.data.map(mapCategory);
}

export async function createInquiry(payload) {
  if (useMockData) return { id: `mock-${Date.now()}`, ...payload };
  const result = await directusRequest('/items/inquiries', {
    method: 'POST',
    body: JSON.stringify({ ...payload, status: 'new' })
  });
  return result.data;
}

export async function createSubscriber(payload) {
  if (useMockData) return { id: `mock-subscriber-${Date.now()}`, ...payload };
  const result = await directusRequest('/items/subscribers', {
    method: 'POST',
    body: JSON.stringify({ ...payload, status: 'active', source: 'website_dialog' })
  });
  return result.data;
}
