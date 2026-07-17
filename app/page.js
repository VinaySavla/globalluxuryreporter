import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import ReportCard from '@/components/ReportCard';
import { getCategories, getReports } from '@/lib/api';

export default async function HomePage() {
  const [categoryList, reportResult, featuredResult] = await Promise.all([getCategories(), getReports({ limit: 6 }), getReports({ featured: true, limit: 1 })]);
  const reports = reportResult.data;
  const featured = featuredResult.data[0] || reports[0];
  return (
    <SiteShell overlayHeader>
      <main>
        <section className="relative min-h-[680px] bg-ink lg:min-h-[760px]">
          <Image src={featured.cover_image} alt="" fill priority className="object-cover opacity-80" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/15 to-transparent" />
          <div className="editorial-container relative flex min-h-[680px] items-end pb-20 pt-32 text-white lg:min-h-[760px] lg:pb-28">
            <div className="max-w-3xl">
              <p className="eyebrow">Featured Reports</p>
              <h1 className="hero-title mt-5 max-w-2xl">{featured.title}</h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/85">{featured.excerpt}</p>
              <Link href={`/reports/${featured.slug}`} className="mt-8 inline-flex border-b border-white pb-1 font-serif text-xl">Read More</Link>
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-36">
          <div className="editorial-container"><h2 className="section-title">Categories</h2><p className="mt-6 max-w-3xl text-sm leading-7 text-ink/65">From private escapes to the ateliers defining our time, discover reporting shaped by curiosity, discernment and a global point of view.</p></div>
          <div className="mt-16 overflow-hidden">
            <div className="category-marquee-track flex">
              {[false, true].map((duplicate) => <div key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex shrink-0 gap-16 pr-16 sm:gap-24 sm:pr-24">{categoryList.map((category) => <article key={`${duplicate}-${category.slug}`} className="relative w-[320px] shrink-0 pb-16 sm:w-[400px]">
                <Link href={`/categories/${category.slug}`} tabIndex={duplicate ? -1 : undefined} className="group relative block aspect-[4/5] w-[82%] overflow-hidden bg-parchment"><Image src={category.cover_image} alt="" fill sizes="(max-width: 640px) 263px, 328px" className="object-cover transition duration-700 group-hover:scale-105" /></Link>
                <div className="absolute bottom-0 right-0 w-[66%] bg-cream px-5 py-6 text-center shadow-[0_18px_40px_rgba(28,0,7,0.08)] sm:px-7 sm:py-8"><h3 className="card-title">{category.name}</h3><p className="mt-3 text-[11px] leading-5 text-ink/65">{category.description}</p><Link href={`/categories/${category.slug}`} tabIndex={duplicate ? -1 : undefined} className="button-primary mt-5">Explore</Link></div>
              </article>)}</div>)}
            </div>
          </div>
        </section>

        <section className="bg-cream py-24 lg:py-32">
          <div className="editorial-container">
            <div className="flex items-end justify-between"><div><p className="eyebrow text-heading">The edit</p><h2 className="section-title mt-3">Latest Reports</h2></div><div className="hidden gap-3 sm:flex"><button className="grid h-11 w-11 place-items-center border border-heading text-heading" aria-label="Previous"><ArrowLeft size={18} /></button><button className="grid h-11 w-11 place-items-center bg-wine text-white" aria-label="Next"><ArrowRight size={18} /></button></div></div>
            <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">{reports.slice(0, 6).map((report, index) => <ReportCard report={report} priority={index < 2} key={report.slug} />)}</div>
            <div className="mt-14 text-center"><Link href="/categories/all" className="button-primary">View all reports</Link></div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
