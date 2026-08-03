import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

const editorialLinks = [
  ['Explore', [['Fashion & Style', '/categories/fashion'], ['Travel & Experiences', '/categories/travel'], ['Culture', '/categories/culture'], ['Design', '/categories/design'], ['Wellness', '/categories/wellness'], ['Automotive', '/categories/automotive']]],
  ['The Journal', [['Latest Reports', '/categories/all'], ['About GLR', '/about'], ['Our Mission', '/about'], ['Global Reach', '/about'], ['Contact', '/contact']]],
  ['Information', [['Editorial Standards', '#'], ['Contributors', '#'], ['Privacy Policy', '#'], ['Terms of Use', '#'], ['Cookie Policy', '#']]]
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="editorial-container py-16 lg:py-20">
        <Link href="/" aria-label="Global Luxury Reporter home" className="flex justify-center border-b border-white/15 pb-12">
          <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" width={176} height={176} className="h-36 w-36 object-cover lg:h-44 lg:w-44" />
        </Link>
        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div><p className="eyebrow text-white/45">Independent perspective</p><p className="mt-5 max-w-sm font-serif text-2xl leading-snug text-white">Reporting on the people, places and ideas shaping a more considered world of luxury.</p><div className="mt-8 flex gap-5"><Instagram size={18} /><Facebook size={18} /><Youtube size={19} /><Linkedin size={18} /></div></div>
          {editorialLinks.map(([title, links]) => <div key={title}><h3 className="eyebrow text-white">{title}</h3><ul className="mt-5 space-y-3 text-xs">{links.map(([label, href]) => <li key={label}><Link href={href} className="transition hover:text-white">{label}</Link></li>)}</ul></div>)}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/15 pt-6 text-[9px] uppercase tracking-editorial sm:flex-row sm:justify-between"><span>© 2026 Global Luxury Reporter</span><span>India · Reporting globally</span></div>
      </div>
    </footer>
  );
}
