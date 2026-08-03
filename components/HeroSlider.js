'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HeroSlider({ reports }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = reports.length;

  useEffect(() => {
    if (paused || total < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % total), 6500);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  const move = (direction) => setActive((current) => (current + direction + total) % total);

  return (
    <section
      className="relative h-[100svh] min-h-[680px] overflow-hidden bg-ink text-white"
      aria-label="Featured reports"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'ArrowDown') move(1); if (event.key === 'ArrowUp') move(-1); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-full transition-transform duration-1000 ease-[cubic-bezier(.76,0,.24,1)]" style={{ transform: `translateY(-${active * 100}%)` }}>
        {reports.map((report, index) => (
          <article key={report.slug} className="relative h-full">
            <Image src={report.cover_image} alt={report.cover_alt || report.title} fill priority={index === 0} sizes="100vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/30 to-ink/10" />
            <div className="editorial-container relative flex h-full items-end pb-20 pt-36 lg:pb-24 lg:pt-48">
              <div className="max-w-4xl">
                <p className="eyebrow text-white/80">Featured · {report.category?.name}</p>
                <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[.92] sm:text-7xl lg:text-[6.5rem]">{report.title}</h1>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-white/80">{report.excerpt}</p>
                <div className="mt-8 flex items-center gap-6"><Link href={`/reports/${report.slug}`} className="border-b border-white pb-1 font-serif text-xl">Read the report</Link><span className="text-[9px] uppercase tracking-editorial text-white/55">{report.reading_time} min read</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-20 right-5 z-10 flex flex-col items-center gap-3 sm:right-8 lg:bottom-24 lg:right-12">
        <button onClick={() => move(-1)} aria-label="Previous featured report" className="grid h-10 w-10 place-items-center border border-white/40 transition hover:bg-white hover:text-ink"><ArrowUp size={17} /></button>
        <div className="my-1 flex flex-col gap-2">{reports.map((report, index) => <button key={report.slug} onClick={() => setActive(index)} aria-label={`Show ${report.title}`} aria-current={index === active ? 'true' : undefined} className={`h-7 w-[2px] transition ${index === active ? 'bg-white' : 'bg-white/30'}`} />)}</div>
        <button onClick={() => move(1)} aria-label="Next featured report" className="grid h-10 w-10 place-items-center border border-white/40 transition hover:bg-white hover:text-ink"><ArrowDown size={17} /></button>
      </div>
      <div className="absolute bottom-6 right-5 text-[9px] uppercase tracking-editorial text-white/60 sm:right-8 lg:right-12">{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
    </section>
  );
}
