import { Instagram, Linkedin } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import ContactForm from '@/components/ContactForm';

export const metadata = { title: 'Contact', description: 'Contact the Global Luxury Reporter editorial team.', alternates: { canonical: '/contact' } };

export default function ContactPage() {
  return (
    <SiteShell>
      <main id="main-content" className="editorial-container py-12 sm:py-16 lg:py-12 xl:py-16">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 xl:gap-28">
          <section>
            <p className="eyebrow text-heading">Contact</p><h1 className="hero-title mt-5 text-heading">Get in touch.</h1><p className="mt-6 text-base text-ink/70">Where global luxury stories find their voice.</p>
            <div className="mt-10 lg:mt-12"><h2 className="font-serif text-3xl text-heading">Email</h2><a href="mailto:info@readglr.com" className="mt-3 inline-block text-sm hover:text-brand">info@readglr.com</a></div>
            <div className="mt-9 lg:mt-10"><h2 className="font-serif text-3xl text-heading">Socials</h2><div className="mt-4 flex gap-4 text-wine"><a href="https://www.instagram.com/global_luxury_reporter" target="_blank" rel="noreferrer" aria-label="Visit GLR on Instagram" className="transition hover:text-brand"><Instagram size={31} strokeWidth={1.6} /></a><a href="https://www.linkedin.com/company/global-luxury-reporter" target="_blank" rel="noreferrer" aria-label="Visit GLR on LinkedIn" className="transition hover:text-brand"><Linkedin size={31} fill="currentColor" /></a></div></div>
          </section>
          <section><ContactForm /></section>
        </div>
      </main>
    </SiteShell>
  );
}
