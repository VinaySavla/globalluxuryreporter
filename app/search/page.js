import ReportCard from '@/components/ReportCard';
import SiteShell from '@/components/SiteShell';
import { getReports } from '@/lib/api';

export const metadata = { title: 'Search' };
export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const result = q ? await getReports({ search: q, limit: 24 }) : { data: [] };
  return <SiteShell><main className="editorial-container min-h-[60vh] py-20 lg:py-28"><p className="eyebrow text-heading">Search</p><h1 className="hero-title mt-4 text-heading">{q ? `Results for “${q}”` : 'Search reports'}</h1><p className="mt-5 text-sm text-ink/60">{result.data.length} {result.data.length === 1 ? 'report' : 'reports'} found</p><div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">{result.data.map((report) => <ReportCard key={report.slug} report={report} />)}</div></main></SiteShell>;
}
