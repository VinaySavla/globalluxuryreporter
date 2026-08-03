import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

const editorialLinks = [
  ['Explore', [['Fashion & Style', '/categories/fashion'], ['Travel & Experiences', '/categories/travel'], ['Culture', '/categories/culture'], ['Design', '/categories/design'], ['Wellness', '/categories/wellness'], ['Automotive', '/categories/automotive']]],
  ['The Journal', [['Latest Reports', '/categories/all'], ['About GLR', '/about'], ['Our Mission', '/about'], ['Global Reach', '/about'], ['Contact', '/contact']]],
  ['Information', [['Editorial Standards', '#'], ['Contributors', '#'], ['Privacy Policy', '#'], ['Terms of Use', '#'], ['Cookie Policy', '#']]]
];

const socialLinks = [
  ['Instagram', 'https://www.instagram.com/', Instagram],
  ['Facebook', 'https://www.facebook.com/', Facebook],
  ['YouTube', 'https://www.youtube.com/', Youtube],
  ['LinkedIn', 'https://www.linkedin.com/', Linkedin]
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="editorial-container py-8 sm:py-14 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[.8fr_2fr] lg:gap-20">
          <div className="border-b border-white/15 pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
            <p className="eyebrow text-white/45">Independent perspective</p>
            <Link href="/" aria-label="Global Luxury Reporter home" className="mt-5 inline-block">
              <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" width={96} height={96} className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
            </Link>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(([label, href, Icon]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Visit GLR on ${label}`} className="grid h-9 w-9 place-items-center border border-white/20 transition hover:border-white hover:bg-white hover:text-ink">
                  <Icon size={17} strokeWidth={1.7} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-4 sm:gap-x-8">
            {editorialLinks.map(([title, links]) => (
              <div key={title}>
                <h3 className="eyebrow text-white">{title}</h3>
                <ul className="mt-4 space-y-2 text-[9px] leading-4 sm:mt-5 sm:space-y-3 sm:text-xs">
                  {links.map(([label, href]) => <li key={label}><Link href={href} className="transition hover:text-white">{label}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-5 text-[8px] uppercase tracking-editorial sm:mt-12 sm:flex-row sm:justify-between sm:text-[9px]">
          <span>© 2026 Global Luxury Reporter</span>
          <span>India · Reporting globally</span>
        </div>
      </div>
    </footer>
  );
}
