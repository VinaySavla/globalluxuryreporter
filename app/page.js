import Image from 'next/image';
import Link from 'next/link';
import HeroSlider from '@/components/HeroSlider';
import ReportCard from '@/components/ReportCard';
import SiteShell from '@/components/SiteShell';
import { getCategories, getReports } from '@/lib/api';
import { reportMeta } from '@/lib/format';

export default async function HomePage() {
  const [categoryList, reportResult, featuredResult] = await Promise.all([
    getCategories(),
    getReports({ limit: 15 }),
    getReports({ featured: true, limit: 3 })
  ]);
  const reports = reportResult.data;
  const featured = featuredResult.data.length ? featuredResult.data : reports.slice(0, 3);
  const editorPicks = reports.filter((report) => report.editor_pick).slice(0, 4);
  const popular = [...reports].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  const fashion = reports.filter((report) => report.category?.slug === 'fashion').slice(0, 3);
  const travel = reports.filter((report) => report.category?.slug === 'travel').slice(0, 3);

  return (
    <SiteShell overlayHeader>
      <main>
        <HeroSlider reports={featured} />

        <section className="editorial-container py-20 lg:py-28">
          <div className="flex items-end justify-between border-b border-ink/20 pb-5"><div><p className="eyebrow text-heading">Updated daily</p><h2 className="section-title mt-3">The Latest</h2></div><Link href="/categories/all" className="hidden text-[10px] font-semibold uppercase tracking-editorial text-heading sm:block">All reports →</Link></div>
          <div className="mt-10 grid gap-12 lg:grid-cols-[1.35fr_.85fr] lg:gap-16">
            <ReportCard report={reports[3] || reports[0]} variant="feature" priority />
            <div>{reports.slice(4, 8).map((report) => <ReportCard key={report.slug} report={report} variant="compact" />)}</div>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-cream py-20 lg:py-24">
          <div className="editorial-container"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-heading">Explore the world of GLR</p><h2 className="section-title mt-3">Categories</h2></div><p className="max-w-lg text-xs leading-6 text-ink/60">A curated lens on the people, places and ideas defining global luxury today.</p></div></div>
          <div className="category-marquee-viewport mt-12 overflow-hidden">
            <div className="category-marquee-track flex">
              {[false, true].map((duplicate) => <div key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex shrink-0 gap-12 pr-12 sm:gap-16 sm:pr-16">{categoryList.map((category) => <article key={`${duplicate}-${category.slug}`} className="group w-[260px] shrink-0 sm:w-[310px]">
                <Link href={`/categories/${category.slug}`} tabIndex={duplicate ? -1 : undefined} className="relative block aspect-[4/5] overflow-hidden bg-parchment"><Image src={category.cover_image} alt={`${category.name} editorial`} fill sizes="310px" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" /><span className="absolute bottom-5 left-5 right-5 font-serif text-3xl text-white">{category.name}</span></Link>
                <p className="mt-4 text-[11px] leading-5 text-ink/60">{category.description}</p>
              </article>)}</div>)}
            </div>
          </div>
        </section>

        <section className="bg-wine py-20 text-white lg:py-28">
          <div className="editorial-container"><div className="border-b border-white/20 pb-5"><p className="eyebrow text-white/60">Selected by our editors</p><h2 className="mt-3 font-serif text-5xl sm:text-6xl">Editor’s Picks</h2></div>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {editorPicks.map((report, index) => <article key={report.slug} className={`group relative overflow-hidden ${index === 0 ? 'min-h-[600px] lg:row-span-2' : 'min-h-[280px]'}`}><Image src={report.cover_image} alt={report.cover_alt || report.title} fill sizes={index === 0 ? '(max-width:1024px) 100vw, 50vw' : '(max-width:1024px) 100vw, 50vw'} className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" /><div className="absolute bottom-0 p-7 sm:p-9"><p className="eyebrow text-white/65">{report.category?.name}</p><h3 className={`${index === 0 ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'} mt-3 max-w-2xl font-serif leading-[.98]`}><Link href={`/reports/${report.slug}`}>{report.title}</Link></h3><p className="mt-4 text-[9px] uppercase tracking-wider text-white/55">{reportMeta(report)}</p></div></article>)}
            </div>
          </div>
        </section>

        <EditorialVertical title="Fashion & Style" description="The collections, ateliers and new creative codes worth knowing." reports={fashion} href="/categories/fashion" />
        <EditorialVertical title="Travel & Experiences" description="Remarkable destinations approached with curiosity and a sense of place." reports={travel} href="/categories/travel" cream />

        <section className="editorial-container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20"><div><p className="eyebrow text-heading">What readers are discovering</p><h2 className="section-title mt-3">Most Read</h2><p className="mt-6 max-w-sm text-sm leading-7 text-ink/60">The reports drawing attention across the GLR journal this week.</p></div><ol className="border-t border-ink/20">{popular.map((report, index) => <li key={report.slug} className="grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-ink/15 py-6"><span className="font-serif text-3xl text-heading/45">{String(index + 1).padStart(2, '0')}</span><div><p className="eyebrow text-heading">{report.category?.name}</p><h3 className="mt-1 font-serif text-2xl leading-tight text-heading"><Link href={`/reports/${report.slug}`} className="hover:text-brand">{report.title}</Link></h3></div><span className="hidden text-[9px] uppercase tracking-wider text-ink/45 sm:block">{report.reading_time} min</span></li>)}</ol></div>
        </section>
      </main>
    </SiteShell>
  );
}

function EditorialVertical({ title, description, reports, href, cream = false }) {
  if (!reports.length) return null;
  return <section className={`${cream ? 'bg-cream' : 'bg-white'} py-20 lg:py-28`}><div className="editorial-container"><div className="flex flex-col justify-between gap-5 border-b border-ink/20 pb-5 sm:flex-row sm:items-end"><div><h2 className="section-title">{title}</h2><p className="mt-4 max-w-xl text-xs leading-6 text-ink/60">{description}</p></div><Link href={href} className="text-[10px] font-semibold uppercase tracking-editorial text-heading">View all →</Link></div><div className="mt-10 grid gap-10 md:grid-cols-3">{reports.map((report) => <ReportCard key={report.slug} report={report} showExcerpt={false} />)}</div></div></section>;
}
