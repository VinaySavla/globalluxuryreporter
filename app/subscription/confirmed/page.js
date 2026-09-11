import Link from 'next/link';
export const metadata = { title: 'Email confirmed', robots: { index: false, follow: false } };
export default function ConfirmedPage() { return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-6 text-center"><div><p className="eyebrow text-heading">Registration complete</p><h1 className="hero-title mt-4 text-heading">You’re on the list.</h1><p className="mt-6 text-sm text-ink/70">Your email has been confirmed.</p><Link href="/" className="button-primary mt-8">Continue reading</Link></div></main>; }
