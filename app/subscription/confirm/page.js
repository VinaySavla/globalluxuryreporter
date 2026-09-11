import Link from 'next/link';

export const metadata = { title: 'Confirm registration', robots: { index: false, follow: false } };

export default async function ConfirmSubscriptionPage({ searchParams }) {
  const { token = '', delivery } = await searchParams;
  return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-6 text-center"><div className="max-w-xl"><p className="eyebrow text-heading">Email registration</p><h1 className="hero-title mt-4 text-heading">Confirm your email.</h1><p className="mt-6 text-sm leading-7 text-ink/70">Confirm that you asked to receive editorial updates from Global Luxury Reporter.</p>{delivery === 'failed' && <p className="mt-6 text-sm text-red-700">We could not send your welcome email. Your address has not been activated; please try again.</p>}{token ? <form action="/api/subscription/confirm" method="post" className="mt-8"><input type="hidden" name="token" value={token} /><button className="button-primary">Confirm registration</button></form> : <p className="mt-8 text-red-700">This confirmation link is incomplete.</p>}<Link href="/" className="mt-6 inline-block text-sm underline">Return to GLR</Link></div></main>;
}
