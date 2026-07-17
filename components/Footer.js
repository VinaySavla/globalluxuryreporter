import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

const columns = [
  ['Customer Services', ['Contact Us', 'Track your Order', 'Shipping & Returns', 'Frequently Asked Questions', 'Schedule an appointment']],
  ['About Us', ['Origins', 'Our Purpose', 'Careers', 'Sustainability', 'Giving Back']],
  ['Material Care', ['Jewelry Repair', 'Ring Sizing', 'Metal Allergy Resources', 'Styling Tips']],
  ['Main Locations', ['Chicago, IL', 'San Francisco, CA', 'New York, NY', 'Seattle, WA']]
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white/75">
      <div className="mx-auto max-w-editorial px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-16">{columns.map(([title, links]) => <div key={title}><h3 className="mb-5 font-serif text-sm uppercase tracking-wide text-white">{title}</h3><ul className="space-y-3 text-[11px]">{links.map((link) => <li key={link}><Link href={link === 'Contact Us' ? '/contact' : '#'} className="transition hover:text-white">{link}</Link></li>)}</ul></div>)}</div>
        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 pt-7 text-[9px] uppercase tracking-wider md:flex-row md:items-center md:justify-between"><span>© 2026 Global Luxury Reporter</span><div className="flex gap-5 text-white/70"><Instagram size={17} /><Facebook size={17} /><Youtube size={18} /><Linkedin size={17} /></div><span>Privacy Policy &nbsp; · &nbsp; Terms of Use &nbsp; · &nbsp; Cookies</span></div>
      </div>
    </footer>
  );
}
