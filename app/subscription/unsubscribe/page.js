import Link from 'next/link';

export const metadata = { title: 'Unsubscribe', robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }) {
  const { token = '' } = await searchParams;
  return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-6 text-center"><div className="max-w-xl"><p className="eyebrow text-heading">Email preferences</p><h1 className="hero-title mt-4 text-heading">Unsubscribe.</h1><p className="mt-6 text-sm leading-7 text-ink/70">Stop receiving editorial email from Global Luxury Reporter.</p>{token ? <form action="/api/subscription/unsubscribe" method="post" className="mt-8"><input type="hidden" name="token" value={token} /><button className="button-primary">Confirm unsubscribe</button></form> : <p className="mt-8 text-red-700">This unsubscribe link is incomplete.</p>}<Link href="/" className="mt-6 inline-block text-sm underline">Return to GLR</Link></div></main>;
}
