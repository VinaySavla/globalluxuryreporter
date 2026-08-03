'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Instagram, Linkedin, Menu, Search, X } from 'lucide-react';

export default function Header({ categories = [], overlay = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const closeOverlays = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setCategoriesOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', closeOverlays);
    return () => window.removeEventListener('keydown', closeOverlays);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const theme = overlay
    ? 'absolute inset-x-0 top-0 border-white/20 bg-ink/20 text-white backdrop-blur-[3px]'
    : 'relative border-ink/10 bg-white text-ink';

  return (
    <>
      <header className={`${theme} z-50 border-b`}>
        <div className="editorial-container hidden h-28 grid-cols-[1fr_auto_1fr] items-center xl:grid">
          <nav className="flex items-center gap-8 text-[10px] font-semibold uppercase tracking-editorial">
            <div className="relative">
              <button onClick={() => setCategoriesOpen(!categoriesOpen)} aria-expanded={categoriesOpen} className="flex items-center gap-1.5 transition hover:text-brand">Categories <ChevronDown size={13} /></button>
              {categoriesOpen && (
                <div className="absolute left-0 top-9 grid min-w-64 gap-1 border border-ink/10 bg-white p-3 text-ink shadow-[0_18px_50px_rgba(28,0,7,.14)]">
                  {categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setCategoriesOpen(false)} className="px-4 py-3 transition hover:bg-cream hover:text-brand">{category.name}</Link>)}
                </div>
              )}
            </div>
            <Link href="/categories/all" className="transition hover:text-brand">Latest</Link>
            <Link href="/about" className="transition hover:text-brand">About</Link>
          </nav>

          <Link href="/" aria-label="Global Luxury Reporter home" className="relative h-[88px] w-[88px] overflow-hidden shadow-[0_8px_28px_rgba(28,0,7,.16)]">
            <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" fill priority sizes="88px" className="object-cover" />
          </Link>

          <div className="flex items-center justify-end gap-7 text-[10px] font-semibold uppercase tracking-editorial">
            <Link href="/contact" className="transition hover:text-brand">Contact</Link>
            <div className="flex items-center gap-4 border-l border-current/20 pl-6">
              <Link href="#" aria-label="Instagram" className="transition hover:text-brand"><Instagram size={16} strokeWidth={1.6} /></Link>
              <Link href="#" aria-label="LinkedIn" className="transition hover:text-brand"><Linkedin size={16} strokeWidth={1.6} /></Link>
            </div>
            <button onClick={() => setSearchOpen(true)} aria-label="Open search" className="transition hover:text-brand"><Search size={18} strokeWidth={1.6} /></button>
          </div>
        </div>

        <div className="grid h-24 grid-cols-3 items-center px-5 sm:px-8 xl:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Open navigation" className="justify-self-start"><Menu size={23} /></button>
          <Link href="/" aria-label="Global Luxury Reporter home" className="relative h-16 w-16 justify-self-center overflow-hidden shadow-md">
            <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" fill priority sizes="64px" className="object-cover" />
          </Link>
          <button onClick={() => setSearchOpen(true)} aria-label="Open search" className="justify-self-end"><Search size={22} strokeWidth={1.7} /></button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[70] bg-ink text-white transition duration-500 xl:hidden ${menuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} aria-hidden={!menuOpen}>
        <div className="grid h-24 grid-cols-3 items-center border-b border-white/15 px-5 sm:px-8">
          <span className="eyebrow text-white/50">Explore</span>
          <Image src="/GLR-Logo-dp.png" alt="" width={64} height={64} className="h-16 w-16 justify-self-center object-cover" />
          <button onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="justify-self-end"><X /></button>
        </div>
        <nav className="h-[calc(100%-6rem)] overflow-y-auto px-6 py-9 sm:px-10">
          <div className="divide-y divide-white/15">{categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 font-serif text-3xl"><span>{category.name}</span><span className="text-sm text-white/35">→</span></Link>)}</div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-[10px] font-semibold uppercase tracking-editorial"><Link href="/categories/all" onClick={() => setMenuOpen(false)}>Latest</Link><Link href="/about" onClick={() => setMenuOpen(false)}>About</Link><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link><Link href="#" aria-label="Instagram"><Instagram size={17} /></Link><Link href="#" aria-label="LinkedIn"><Linkedin size={17} /></Link></div>
        </nav>
      </div>

      <div className={`fixed inset-0 z-[80] flex items-start justify-center bg-ink/95 px-5 pt-[20vh] text-white backdrop-blur-xl transition duration-500 ${searchOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} aria-hidden={!searchOpen}>
        <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="absolute right-6 top-6 sm:right-10 sm:top-10"><X size={28} /></button>
        <div className="w-full max-w-4xl">
          <p className="eyebrow text-white/50">Search Global Luxury Reporter</p>
          <form onSubmit={submitSearch} className="mt-5 flex border-b border-white/50">
            <input autoFocus={searchOpen} value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search reports" placeholder="What are you looking for?" className="min-w-0 flex-1 bg-transparent py-4 font-serif text-4xl outline-none placeholder:text-white/30 sm:text-6xl" />
            <button aria-label="Submit search"><Search size={28} /></button>
          </form>
          <div className="mt-10 flex flex-wrap gap-3">{categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setSearchOpen(false)} className="border border-white/25 px-4 py-2 text-[9px] uppercase tracking-editorial transition hover:bg-white hover:text-ink">{category.name}</Link>)}</div>
        </div>
      </div>
    </>
  );
}
