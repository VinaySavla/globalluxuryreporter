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

  return (
    <SiteShell overlayHeader>
      <main>
        <HeroSlider reports={featured} />

        <section className="editorial-container py-20 lg:py-28">
          <div className="flex items-end justify-between border-b border-ink/20 pb-5">
            <div><p className="eyebrow text-heading">Updated daily</p><h2 className="section-title mt-3">The Latest</h2></div>
            <Link href="/categories/all" className="hidden text-[10px] font-semibold uppercase tracking-editorial text-heading sm:block">All reports →</Link>
          </div>
          <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-16">
            <ReportCard report={reports[3] || reports[0]} variant="feature" priority />
            <div>{reports.slice(4, 8).map((report) => <ReportCard key={report.slug} report={report} variant="compact" />)}</div>
          </div>
        </section>

        <section className="py-24 lg:py-36">
          <div className="editorial-container">
            <h2 className="section-title">Categories</h2>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-ink/65">From private escapes to the ateliers defining our time, discover reporting shaped by curiosity, discernment and a global point of view.</p>
          </div>
          <div className="category-marquee-viewport mt-16 overflow-hidden">
            <div className="category-marquee-track flex">
              {[false, true].map((duplicate) => (
                <div key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex shrink-0 gap-16 pr-16 sm:gap-24 sm:pr-24">
                  {categoryList.map((category) => (
                    <article key={`${duplicate}-${category.slug}`} className="relative w-[320px] shrink-0 pb-16 sm:w-[400px]">
                      <Link href={`/categories/${category.slug}`} tabIndex={duplicate ? -1 : undefined} className="group relative block aspect-[4/5] w-[82%] overflow-hidden bg-parchment">
                        <Image src={category.cover_image} alt={`${category.name} editorial`} fill sizes="(max-width: 640px) 263px, 328px" className="object-cover transition duration-700 group-hover:scale-105" />
                      </Link>
                      <div className="absolute bottom-0 right-0 w-[66%] bg-cream px-5 py-6 text-center shadow-[0_18px_40px_rgba(28,0,7,0.08)] sm:px-7 sm:py-8">
                        <h3 className="card-title">{category.name}</h3>
                        <p className="mt-3 text-[11px] leading-5 text-ink/65">{category.description}</p>
                        <Link href={`/categories/${category.slug}`} tabIndex={duplicate ? -1 : undefined} className="button-primary mt-5">Explore</Link>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-wine py-20 text-white lg:py-28">
          <div className="editorial-container">
            <div className="flex flex-col justify-between gap-5 border-b border-white/20 pb-6 sm:flex-row sm:items-end">
              <div><p className="eyebrow text-white/55">Selected by our editors</p><h2 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">Editor’s Picks</h2></div>
              <Link href="/categories/all" className="text-[9px] font-semibold uppercase tracking-editorial text-white/65 transition hover:text-white">View all reports →</Link>
            </div>

            <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 xl:gap-6">
              {editorPicks.map((report, index) => (
                <article key={report.slug} className="group w-full shrink-0 snap-start sm:w-auto">
                  <Link href={`/reports/${report.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-ink/25">
                    <Image src={report.cover_image} alt={report.cover_alt || report.title} fill sizes="(max-width:640px) calc(100vw - 40px), (max-width:1280px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/10" />
                    <span className="absolute left-5 top-5 grid h-10 w-10 place-items-center border border-white/45 font-serif text-xl">{String(index + 1).padStart(2, '0')}</span>
                  </Link>
                  <div className="pt-5">
                    <Link href={`/categories/${report.category?.slug}`} className="eyebrow text-white/55">{report.category?.name}</Link>
                    <h3 className="mt-2 font-serif text-2xl leading-[1.08] sm:text-3xl xl:text-[1.7rem]"><Link href={`/reports/${report.slug}`} className="transition hover:text-white/70">{report.title}</Link></h3>
                    <p className="mt-4 border-t border-white/15 pt-4 text-[9px] uppercase tracking-wider text-white/45">{reportMeta(report, { includeAuthor: false })}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: 'rgb(247 242 236 / var(--tw-bg-opacity, 1))' }} className="py-20 lg:py-28">
          <div className="editorial-container grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
            <div><p className="eyebrow text-heading">What readers are discovering</p><h2 className="section-title mt-3">Most Read</h2><p className="mt-6 max-w-sm text-sm leading-7 text-ink/60">The reports drawing attention across the GLR journal this week.</p></div>
            <ol className="border-t border-ink/20">{popular.map((report, index) => <li key={report.slug} className="grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-ink/15 py-6"><span className="font-serif text-3xl text-heading/45">{String(index + 1).padStart(2, '0')}</span><div><p className="eyebrow text-heading">{report.category?.name}</p><h3 className="mt-1 font-serif text-2xl leading-tight text-heading"><Link href={`/reports/${report.slug}`} className="hover:text-brand">{report.title}</Link></h3></div><span className="hidden text-[9px] uppercase tracking-wider text-ink/45 sm:block">{report.reading_time} min</span></li>)}</ol>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
