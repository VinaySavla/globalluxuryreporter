import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ReportCard from '@/components/ReportCard';
import ShareActions from '@/components/ShareActions';
import SiteShell from '@/components/SiteShell';
import { getReport, getReports } from '@/lib/api';
import { formatReportDate } from '@/lib/format';

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
  if (related.length < 3) related = (await getReports({ limit: 8 })).data.filter((item) => item.slug !== report.slug).slice(0, 3);
  const date = formatReportDate(report.published_at);

  return (
    <SiteShell>
      <main>
        <header className="editorial-container py-14 text-center sm:py-20 lg:py-24">
          <nav className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-editorial text-ink/45"><Link href="/">Home</Link><span>/</span><Link href={`/categories/${report.category?.slug}`}>{report.category?.name}</Link></nav>
          <p className="eyebrow mt-9 text-heading">{report.category?.name}</p>
          <h1 className="hero-title mx-auto mt-5 max-w-5xl text-heading">{report.title}</h1>
          <p className="mx-auto mt-7 max-w-2xl font-serif text-xl leading-8 text-ink/65 sm:text-2xl">{report.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] uppercase tracking-editorial text-ink/50"><span>By {report.author}</span><span>·</span><time>{date}</time><span>·</span><span>{report.reading_time} min read</span></div>
        </header>

        <figure className="editorial-container"><div className="relative aspect-[16/9] overflow-hidden bg-parchment"><Image src={report.cover_image} alt={report.cover_alt || report.title} fill priority sizes="100vw" className="object-cover" /></div><figcaption className="mt-3 text-[9px] uppercase tracking-wider text-ink/45">{report.cover_alt || report.title} · GLR Archive</figcaption></figure>

        <div className="editorial-container grid gap-10 py-20 lg:grid-cols-[180px_minmax(0,760px)_1fr] lg:py-28">
          <aside className="lg:sticky lg:top-8 lg:self-start"><p className="eyebrow text-heading">Written by</p><p className="mt-3 font-serif text-2xl text-heading">{report.author}</p><p className="mt-3 text-[11px] leading-5 text-ink/55">Reporting on contemporary culture, craft and the changing language of luxury.</p><div className="mt-6"><ShareActions title={report.title} /></div></aside>
          <article><ReactMarkdown className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:text-heading prose-h2:mt-16 prose-h2:text-4xl prose-p:font-sans prose-p:text-[15px] prose-p:leading-8 prose-p:text-ink/75 prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:mr-3 prose-p:first-of-type:first-letter:font-serif prose-p:first-of-type:first-letter:text-7xl prose-p:first-of-type:first-letter:leading-[.8] prose-p:first-of-type:first-letter:text-heading">{report.content}</ReactMarkdown><div className="mt-16 border-y border-ink/15 py-8"><p className="eyebrow text-heading">About the author</p><h2 className="mt-3 font-serif text-3xl text-heading">{report.author}</h2><p className="mt-3 text-sm leading-7 text-ink/60">A contributor to Global Luxury Reporter covering the ideas, destinations and creative voices shaping contemporary luxury.</p></div></article>
        </div>

        <section className="bg-cream py-20 lg:py-28"><div className="editorial-container"><div className="flex items-end justify-between border-b border-ink/20 pb-5"><h2 className="section-title">Continue Reading</h2><Link href={`/categories/${report.category?.slug}`} className="hidden text-[10px] uppercase tracking-editorial text-heading sm:block">More in {report.category?.name} →</Link></div><div className="mt-10 grid gap-10 md:grid-cols-3">{related.map((item) => <ReportCard key={item.slug} report={item} showExcerpt={false} />)}</div></div></section>
      </main>
    </SiteShell>
  );
}
