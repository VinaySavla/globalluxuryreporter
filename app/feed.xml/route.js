import { getReports } from '@/lib/data-service';
import { absoluteUrl } from '@/lib/site';

function xml(value) {
  return String(value ?? '').replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
}

export async function GET() {
  const reports = (await getReports({ limit: 24 })).data;
  const items = reports.map((report) => `<item><title>${xml(report.title)}</title><link>${xml(absoluteUrl(`/reports/${report.slug}`))}</link><guid>${xml(absoluteUrl(`/reports/${report.slug}`))}</guid><description>${xml(report.excerpt)}</description><pubDate>${new Date(report.published_at).toUTCString()}</pubDate><author>${xml(report.author)}</author></item>`).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Global Luxury Reporter</title><link>${xml(absoluteUrl('/'))}</link><description>Independent reporting on global luxury.</description>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
