import Image from 'next/image';
import { notFound } from 'next/navigation';
import Pagination from '@/components/Pagination';
import ReportCard from '@/components/ReportCard';
import SiteShell from '@/components/SiteShell';
import { getCategories, getReports } from '@/lib/api';

export async function generateMetadata({ params }) { const { slug } = await params; const categories = await getCategories(); const category = categories.find((item) => item.slug === slug); return { title: category?.name || 'Reports' }; }

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query?.page) || 1);
  const categories = await getCategories();
  const category = slug === 'all' ? { name: 'All Reports', slug: 'all', description: 'The latest stories from across the world of considered luxury.', cover_image: categories[0]?.cover_image } : categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const result = await getReports({ category: slug === 'all' ? undefined : slug, page, limit: 9 });
  const totalPages = Math.max(1, Math.ceil((result.meta?.total_count || result.data.length) / 9));
  return (
    <SiteShell>
      <main>
        <header className="relative min-h-[420px] bg-ink"><Image src={category.cover_image} alt="" fill priority className="object-cover opacity-55" sizes="100vw" /><div className="absolute inset-0 bg-ink/25" /><div className="editorial-container relative flex min-h-[420px] items-center justify-center text-center text-white"><div><p className="eyebrow">The GLR edit</p><h1 className="mt-5 font-serif text-6xl sm:text-7xl lg:text-8xl">{category.name}</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">{category.description}</p></div></div></header>
        <section className="editorial-container py-20 lg:py-28"><div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">{result.data.map((report, index) => <ReportCard key={report.slug} report={report} priority={index < 3} className={index % 5 === 1 ? 'lg:mt-16' : ''} />)}</div>{result.data.length === 0 && <p className="py-24 text-center font-serif text-3xl text-ink/60">New reports are coming soon.</p>}<Pagination current={page} total={totalPages} basePath={`/categories/${slug}`} /></section>
      </main>
    </SiteShell>
  );
}
