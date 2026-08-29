'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';

export default function Header({ categories = [], overlay = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') { setMenuOpen(false); setSearchOpen(false); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const desktopTheme = overlay ? 'border-white/20 text-white' : 'border-ink/15 bg-white text-ink';
  const categoryOrder = ['travel', 'fashion', 'design', 'wellness', 'automotive', 'culture'];
  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug);
    const bIndex = categoryOrder.indexOf(b.slug);
    return (aIndex === -1 ? categoryOrder.length : aIndex) - (bIndex === -1 ? categoryOrder.length : bIndex);
  });

  return (
    <>
      <header className={`${overlay ? 'absolute' : 'relative'} inset-x-0 top-0 z-50 border-b ${desktopTheme}`}>
        <div className={`${overlay ? 'bg-gradient-to-b from-ink/65 to-ink/10' : ''}`}>
          <div className="editorial-container hidden h-20 grid-cols-[minmax(0,1fr)_minmax(340px,auto)_minmax(0,1fr)] items-center gap-5 min-[900px]:landscape:grid xl:h-28 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(520px,auto)_minmax(0,1fr)] xl:gap-8">
            <div className="whitespace-nowrap text-[7px] font-semibold uppercase tracking-[.16em] text-current/70 lg:text-[8px] xl:text-[10px] xl:tracking-editorial">Global luxury journal</div>
            <Link href="/" className="whitespace-nowrap text-center font-serif text-[clamp(1.7rem,3.25vw,3rem)] uppercase leading-none tracking-[.07em] xl:tracking-[.09em]" aria-label="Global Luxury Reporter home">Global Luxury Reporter</Link>
            <div className="flex min-w-0 items-center justify-end gap-3 whitespace-nowrap text-[8px] font-medium uppercase tracking-[.14em] lg:gap-4 lg:text-[9px] xl:gap-7 xl:text-[10px] xl:tracking-editorial"><Link href="/about">About</Link><Link href="/contact">Contact</Link><button onClick={() => setSearchOpen(true)} className="flex items-center gap-2" aria-label="Open search">Search <Search size={15} /></button></div>
          </div>
          <div className="hidden h-12 border-t border-current/15 min-[900px]:landscape:block xl:h-14 xl:block"><nav className="editorial-container flex h-full items-center justify-center gap-5 text-[8px] font-semibold uppercase tracking-editorial lg:gap-6 lg:text-[9px] xl:gap-9 xl:text-[10px]">{orderedCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="transition hover:text-brand">{category.name}</Link>)}<Link href="/categories/all">All Reports</Link></nav></div>

          <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8 min-[900px]:landscape:hidden xl:hidden">
            <button onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} className="justify-self-start"><Menu /></button>
            <Link href="/" aria-label="Global Luxury Reporter home" className="relative h-12 w-12 overflow-hidden md:portrait:hidden min-[900px]:hidden"><Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" fill priority sizes="48px" className="object-cover" /></Link>
            <Link href="/" aria-label="Global Luxury Reporter home" className="hidden whitespace-nowrap font-serif text-3xl uppercase leading-none tracking-[.08em] md:portrait:block min-[900px]:block">Global Luxury Reporter</Link>
            <button onClick={() => setSearchOpen(true)} aria-label="Open search" className="justify-self-end"><Search size={21} /></button>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[70] bg-ink text-white transition duration-500 min-[900px]:landscape:hidden xl:hidden ${menuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} aria-hidden={!menuOpen}>
        <div className="flex h-20 items-center justify-between border-b border-white/15 px-5"><span className="font-serif text-2xl tracking-widest">GLR</span><button onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button></div>
        <nav className="h-[calc(100%-5rem)] overflow-y-auto px-6 py-10"><p className="eyebrow text-white/45">Explore</p><div className="mt-6 divide-y divide-white/15">{orderedCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 font-serif text-3xl"><span>{category.name}</span><span className="text-sm text-white/40">→</span></Link>)}</div><div className="mt-10 flex gap-7 text-[10px] uppercase tracking-editorial"><Link href="/about" onClick={() => setMenuOpen(false)}>About Us</Link><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link><Link href="/categories/all" onClick={() => setMenuOpen(false)}>All Reports</Link></div></nav>
      </div>

      <div className={`fixed inset-0 z-[80] flex items-start justify-center bg-ink/95 px-5 pt-[18vh] text-white backdrop-blur-xl transition duration-500 ${searchOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} aria-hidden={!searchOpen}>
        <button onClick={() => setSearchOpen(false)} className="absolute right-6 top-6 sm:right-10 sm:top-10" aria-label="Close search"><X size={28} /></button>
        <div className="w-full max-w-4xl"><p className="eyebrow text-white/50">Search the journal</p><form onSubmit={submitSearch} className="mt-5 flex border-b border-white/50"><input autoFocus={searchOpen} value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-4 font-serif text-4xl outline-none placeholder:text-white/30 sm:text-6xl" placeholder="What are you looking for?" aria-label="Search reports" /><button aria-label="Submit search"><Search size={28} /></button></form><div className="mt-10 flex flex-wrap gap-3">{orderedCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setSearchOpen(false)} className="border border-white/25 px-4 py-2 text-[9px] uppercase tracking-editorial hover:bg-white hover:text-ink">{category.name}</Link>)}</div></div>
      </div>
    </>
  );
}
