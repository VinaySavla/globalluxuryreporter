import ReportCard from '@/components/ReportCard';
import SiteShell from '@/components/SiteShell';
import { getReports } from '@/lib/data-service';

export const metadata = { title: 'Search', robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const query = String(q).trim().slice(0, 100);
  const result = query ? await getReports({ search: query, limit: 24 }) : { data: [] };
  return <SiteShell><main id="main-content" className="editorial-container min-h-[60vh] py-20 lg:py-28"><p className="eyebrow text-heading">Search</p><h1 className="hero-title mt-4 text-heading">{query ? `Results for “${query}”` : 'Search reports'}</h1><p className="mt-5 text-sm text-ink/70">{result.data.length} {result.data.length === 1 ? 'report' : 'reports'} found</p><div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{result.data.map((report) => <ReportCard key={report.slug} report={report} />)}</div></main></SiteShell>;
}
