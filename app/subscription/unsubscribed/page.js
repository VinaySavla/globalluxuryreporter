import Link from 'next/link';
export const metadata = { title: 'Unsubscribed', robots: { index: false, follow: false } };
export default function UnsubscribedPage() { return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-6 text-center"><div><p className="eyebrow text-heading">Email preferences</p><h1 className="hero-title mt-4 text-heading">You’re unsubscribed.</h1><p className="mt-6 text-sm text-ink/70">GLR will no longer send editorial email to this address.</p><Link href="/" className="button-primary mt-8">Return to GLR</Link></div></main>; }
