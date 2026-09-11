'use client';

export default function ErrorPage({ reset }) {
  return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-6 text-center"><div><p className="eyebrow text-heading">Something went wrong</p><h1 className="hero-title mt-4 text-heading">The journal is temporarily unavailable.</h1><p className="mt-6 text-sm text-ink/70">Please try again in a moment.</p><button type="button" onClick={reset} className="button-primary mt-8">Try again</button></div></main>;
}
