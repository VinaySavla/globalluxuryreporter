import Image from 'next/image';
import Link from 'next/link';
import { reportMeta } from '@/lib/format';

export default function ReportCard({ report, priority = false, className = '', variant = 'standard', showExcerpt = true }) {
  if (variant === 'compact') {
    return (
      <article className={`group grid grid-cols-[112px_1fr] gap-5 border-t border-ink/15 py-5 sm:grid-cols-[140px_1fr] ${className}`}>
        <Link href={`/reports/${report.slug}`} className="relative aspect-[4/3] overflow-hidden bg-parchment"><Image src={report.cover_image} alt={report.cover_alt || report.title} fill sizes="140px" className="object-cover transition duration-700 group-hover:scale-105" /></Link>
        <div className="self-center"><Link href={`/categories/${report.category?.slug}`} className="eyebrow text-heading">{report.category?.name}</Link><h3 className="mt-2 font-serif text-xl leading-tight text-heading sm:text-2xl"><Link href={`/reports/${report.slug}`} className="hover:text-brand">{report.title}</Link></h3><p className="mt-2 text-[9px] uppercase tracking-wider text-ink/50">{reportMeta(report, { includeAuthor: false })}</p></div>
      </article>
    );
  }

  const feature = variant === 'feature';
  return (
    <article className={`group ${className}`}>
      <Link href={`/reports/${report.slug}`} className="block overflow-hidden bg-parchment">
        <div className={`relative ${feature ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}><Image src={report.cover_image} alt={report.cover_alt || report.title} fill priority={priority} sizes={feature ? '(max-width: 1024px) 100vw, 52vw' : '(max-width: 768px) 100vw, 33vw'} className="object-cover transition duration-700 ease-out group-hover:scale-105" /></div>
      </Link>
      <div className="pt-5">
        <Link href={`/categories/${report.category?.slug}`} className="eyebrow text-heading">{report.category?.name}</Link>
        <h3 className={`${feature ? 'font-serif text-4xl leading-[1.02] text-heading sm:text-5xl' : 'card-title'} mt-2`}><Link href={`/reports/${report.slug}`} className="hover:text-brand">{report.title}</Link></h3>
        {showExcerpt && <p className={`${feature ? 'max-w-2xl text-sm leading-7' : 'text-xs leading-6'} mt-3 text-ink/65`}>{report.excerpt}</p>}
        <p className="mt-4 text-[9px] uppercase tracking-wider text-ink/50">{reportMeta(report)}</p>
      </div>
    </article>
  );
}
