import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Pagination({ current, total, basePath }) {
  if (total <= 1) return null;
  return <nav className="mt-16 flex items-center justify-center gap-3" aria-label="Pagination">
    {current > 1 && <Link href={`${basePath}?page=${current - 1}`} className="grid h-11 w-11 place-items-center border border-wine text-wine" aria-label="Previous page"><ArrowLeft size={17} /></Link>}
    {Array.from({ length: total }, (_, index) => index + 1).map((page) => <Link key={page} href={`${basePath}?page=${page}`} className={`grid h-11 w-11 place-items-center text-xs ${page === current ? 'bg-wine text-white' : 'border border-wine/25 text-ink'}`}>{page}</Link>)}
    {current < total && <Link href={`${basePath}?page=${current + 1}`} className="grid h-11 w-11 place-items-center bg-wine text-white" aria-label="Next page"><ArrowRight size={17} /></Link>}
  </nav>;
}
