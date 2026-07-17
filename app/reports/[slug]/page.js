import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ReportCard from '@/components/ReportCard';
import SiteShell from '@/components/SiteShell';
import { getReport, getReports } from '@/lib/api';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = await getReport(slug);
  return report ? { title: report.title, description: report.excerpt } : {};
}

export default async function ReportPage({ params }) {
  const { slug } = await params;
  const report = await getReport(slug);
  if (!report) notFound();
  const relatedResult = await getReports({ category: report.category?.slug, limit: 4 });
  let related = relatedResult.data.filter((item) => item.slug !== report.slug).slice(0, 3);
  if (related.length < 3) related = (await getReports({ limit: 6 })).data.filter((item) => item.slug !== report.slug).slice(0, 3);
  const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(report.published_at));
  return (
    <SiteShell>
      <main>
        <header className="editorial-container py-16 text-center sm:py-24 lg:py-28"><Link href={`/categories/${report.category?.slug}`} className="eyebrow text-heading">{report.category?.name}</Link><h1 className="hero-title mx-auto mt-6 max-w-5xl text-heading">{report.title}</h1><p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-ink/65">{report.excerpt}</p><div className="mt-8 text-[10px] uppercase tracking-editorial text-ink/55">By {report.author} &nbsp; · &nbsp; {date}</div></header>
        <div className="editorial-container"><div className="relative aspect-[16/8] overflow-hidden bg-parchment"><Image src={report.cover_image} alt="" fill priority sizes="100vw" className="object-cover" /></div></div>
        <article className="mx-auto max-w-3xl px-6 py-20 sm:py-28"><ReactMarkdown className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:text-heading prose-h2:mt-14 prose-h2:text-4xl prose-p:font-sans prose-p:text-[15px] prose-p:leading-8 prose-p:text-ink/75">{report.content}</ReactMarkdown></article>
        <section className="bg-cream py-20 lg:py-28"><div className="editorial-container"><h2 className="section-title text-center">More from Global Luxury Reporter</h2><div className="mt-14 grid gap-10 md:grid-cols-3">{related.map((item) => <ReportCard key={item.slug} report={item} />)}</div></div></section>
      </main>
    </SiteShell>
  );
}
