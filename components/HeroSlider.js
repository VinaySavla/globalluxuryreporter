'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pause, Play } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function HeroSlider({ reports }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const heroRef = useRef(null);
  const total = reports.length;

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return undefined;
    const fitTitles = () => {
      for (const slot of hero.querySelectorAll('[data-hero-content]')) {
        const content = slot.firstElementChild;
        const title = content.querySelector('h1');
        title.style.fontSize = '';
        const style = getComputedStyle(slot);
        const available = slot.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        let largest = parseFloat(getComputedStyle(title).fontSize);
        let smallest = 1;
        if (content.getBoundingClientRect().height <= available && title.scrollWidth <= title.clientWidth) continue;
        // Measure actual wrapping, including the excerpt and action, rather than counting characters.
        for (let step = 0; step < 12; step += 1) {
          const size = (smallest + largest) / 2;
          title.style.fontSize = `${size}px`;
          if (content.getBoundingClientRect().height <= available && title.scrollWidth <= title.clientWidth) smallest = size;
          else largest = size;
        }
        title.style.fontSize = `${smallest}px`;
      }
    };
    const observer = new ResizeObserver(fitTitles);
    observer.observe(hero);
    fitTitles();
    let disposed = false;
    document.fonts.ready.then(() => { if (!disposed) fitTitles(); });
    return () => { disposed = true; observer.disconnect(); };
  }, [reports]);

  useEffect(() => {
    if (paused || total < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % total), 6500);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  const move = (direction) => setActive((current) => (current + direction + total) % total);

  if (!total) return <section className="grid h-[100svh] place-items-center bg-ink px-6 text-center text-white"><div><p className="eyebrow text-white/80">Global Luxury Reporter</p><h1 className="mt-5 font-serif text-6xl">Independent perspective.</h1><p className="mt-6 text-white/80">New reports are coming soon.</p></div></section>;

  return (
    <section
      ref={heroRef}
      className="relative h-[100svh] overflow-hidden bg-ink text-white"
      aria-label="Featured reports"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === 'ArrowDown') move(1); if (event.key === 'ArrowUp') move(-1); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-full transition-transform duration-1000 ease-[cubic-bezier(.76,0,.24,1)]" style={{ transform: `translateY(-${active * 100}%)` }}>
        {reports.map((report, index) => (
          <article key={report.slug} className="relative h-full" aria-hidden={index !== active} inert={index !== active}>
            {report.cover_image && <Image src={report.cover_image} alt={report.cover_alt || report.title} fill priority={index === 0} sizes="100vw" unoptimized className="object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/30 to-ink/10" />
            <div data-hero-content className="editorial-container relative flex h-full items-end pb-[clamp(2.5rem,8svh,6rem)] pt-28 min-[900px]:landscape:pt-40 xl:!pt-52">
              <div className="min-w-0 max-w-4xl pr-16 sm:pr-20 lg:pr-28">
                <p className="eyebrow text-white/80">Featured · {report.category?.name}</p>
                <h1 className="mt-[clamp(.5rem,2.5svh,1.25rem)] max-w-4xl break-words text-balance font-serif text-[clamp(2.75rem,7vw,6.5rem)] leading-[.92] transition-none">{report.title}</h1>
                {report.excerpt && <p className="mt-[clamp(.5rem,3svh,1.5rem)] max-w-2xl text-sm leading-7 text-white/80">{report.excerpt}</p>}
                <div className="mt-[clamp(.75rem,4svh,2rem)] flex items-center gap-6"><Link href={`/reports/${report.slug}`} className="border-b border-white pb-1 font-serif text-xl">Read the report</Link><span className="text-[9px] uppercase tracking-editorial text-white/55">{report.reading_time} min read</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-20 right-5 z-10 flex flex-col items-center gap-3 sm:right-8 lg:bottom-24 lg:right-12">
        <button onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume featured reports' : 'Pause featured reports'} aria-pressed={paused} className="grid h-10 w-10 place-items-center border border-white/40 transition hover:bg-white hover:text-ink">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button onClick={() => move(-1)} aria-label="Previous featured report" className="grid h-10 w-10 place-items-center border border-white/40 transition hover:bg-white hover:text-ink"><ArrowUp size={17} /></button>
        <div className="my-1 flex max-h-[calc(100svh-280px)] flex-col gap-2 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{reports.map((report, index) => <button key={report.slug} onClick={() => setActive(index)} aria-label={`Show ${report.title}`} aria-current={index === active ? 'true' : undefined} className={`h-7 w-[2px] shrink-0 transition ${index === active ? 'bg-white' : 'bg-white/30'}`} />)}</div>
        <button onClick={() => move(1)} aria-label="Next featured report" className="grid h-10 w-10 place-items-center border border-white/40 transition hover:bg-white hover:text-ink"><ArrowDown size={17} /></button>
      </div>
      <div className="absolute bottom-6 right-5 text-[9px] uppercase tracking-editorial text-white/60 sm:right-8 lg:right-12">{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
    </section>
  );
}
