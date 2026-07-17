import Image from 'next/image';
import Link from 'next/link';

export default function ReportCard({ report, priority = false, className = '' }) {
  return (
    <article className={`group ${className}`}>
      <Link href={`/reports/${report.slug}`} className="block overflow-hidden bg-parchment">
        <div className="relative aspect-[4/3]"><Image src={report.cover_image} alt="" fill priority={priority} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 ease-out group-hover:scale-105" /></div>
      </Link>
      <div className="pt-5">
        <Link href={`/categories/${report.category?.slug}`} className="text-[10px] font-semibold uppercase tracking-editorial text-brand">{report.category?.name}</Link>
        <h3 className="card-title mt-2"><Link href={`/reports/${report.slug}`} className="hover:text-brand">{report.title}</Link></h3>
        <p className="mt-3 text-xs leading-6 text-ink/65">{report.excerpt}</p>
      </div>
    </article>
  );
}
