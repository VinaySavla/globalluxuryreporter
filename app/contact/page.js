import { Instagram, Linkedin } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import ContactForm from '@/components/ContactForm';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <SiteShell>
      <main className="editorial-container py-20 sm:py-28 lg:py-36">
        <div className="grid gap-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-28">
          <section>
            <p className="eyebrow text-heading">Contact</p><h1 className="hero-title mt-5 text-heading">Get in touch.</h1><p className="mt-6 text-base text-ink/70">Where global luxury stories find their voice.</p>
            <div className="mt-16"><h2 className="font-serif text-3xl text-heading">Email</h2><a href="mailto:info@readglr.com" className="mt-4 inline-block text-sm hover:text-brand">info@readglr.com</a></div>
            <div className="mt-14"><h2 className="font-serif text-3xl text-heading">Socials</h2><div className="mt-5 flex gap-4 text-wine"><a href="#" aria-label="Instagram"><Instagram size={31} strokeWidth={1.6} /></a><a href="#" aria-label="LinkedIn"><Linkedin size={31} fill="currentColor" /></a></div></div>
          </section>
          <section><ContactForm /></section>
        </div>
      </main>
    </SiteShell>
  );
}
