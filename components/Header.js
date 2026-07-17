'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Menu, Search, X } from 'lucide-react';

export default function Header({ categories = [], overlay = false }) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const submitSearch = (event) => {
    event.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className={`${overlay ? 'absolute inset-x-0 top-0 z-50 border-white/15 bg-ink/25 text-white backdrop-blur-sm' : 'relative z-50 border-ink/10 bg-white text-ink'} border-b`}>
      <div className="mx-auto flex h-20 max-w-editorial items-center justify-between px-5 sm:px-8 lg:h-24 lg:px-12">
        <Link href="/" aria-label="Global Luxury Reporter home" className="relative block h-12 w-12 shrink-0 overflow-hidden shadow-md lg:h-14 lg:w-14"><Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" fill priority sizes="56px" className="object-cover" /></Link>
        <button className="ml-auto p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
        <div className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-7 border-b border-ink/10 bg-white p-7 text-ink shadow-xl lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${overlay ? 'lg:text-white' : ''}`}>
          <nav className="flex flex-col gap-6 text-xs font-medium uppercase tracking-editorial lg:flex-row lg:items-center lg:gap-11">
            <div className="relative">
              <button onClick={() => setCategoriesOpen(!categoriesOpen)} className="flex items-center gap-1.5">Categories <ChevronDown size={14} /></button>
              {categoriesOpen && <div className="mt-4 grid min-w-56 gap-1 bg-white p-3 text-ink shadow-xl lg:absolute lg:left-1/2 lg:-translate-x-1/2">{categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={() => setOpen(false)} className="px-3 py-2.5 hover:bg-cream hover:text-brand">{category.name}</Link>)}</div>}
            </div>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <form onSubmit={submitSearch} className="flex h-10 w-full items-center border border-ink/15 bg-white/95 px-3 text-ink lg:ml-7 lg:w-64">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none" placeholder="Search reports" aria-label="Search reports" />
            <button aria-label="Submit search"><Search size={15} /></button>
          </form>
        </div>
      </div>
    </header>
  );
}
