'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'glr-email-registration-v1';
const DISMISSAL_DAYS = 7;

export default function EmailRegistrationModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let shouldShow = true;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored?.registered) shouldShow = false;
      if (stored?.dismissedAt) {
        const elapsed = Date.now() - Number(stored.dismissedAt);
        shouldShow = elapsed > DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (!shouldShow) return undefined;
    const timer = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reopen = () => {
      setEmail('');
      setMessage('');
      setStatus('idle');
      setOpen(true);
    };
    window.addEventListener('glr:open-registration', reopen);
    return () => window.removeEventListener('glr:open-registration', reopen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', closeOnEscape);
    window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    setOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed.');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ registered: true, email }));
      setStatus('success');
      setMessage(result.message || 'Welcome to Global Luxury Reporter.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="email-registration-title" aria-describedby="email-registration-description" className="relative w-full max-w-3xl overflow-hidden bg-cream shadow-[0_30px_100px_rgba(28,0,7,.45)]">
        <button type="button" onClick={dismiss} aria-label="Close registration dialog" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-ink/15 bg-cream/90 text-heading transition hover:bg-heading hover:text-white"><X size={18} /></button>

        <div className="grid md:grid-cols-[.8fr_1.2fr]">
          <div className="relative hidden min-h-[480px] bg-wine md:block">
            <Image src="/images/jewelry.jpg" alt="" fill priority sizes="320px" className="object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <p className="absolute bottom-8 left-8 right-8 font-serif text-3xl leading-tight text-white">A considered view of global luxury.</p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" width={72} height={72} className="h-16 w-16 object-cover" />
            {status === 'success' ? (
              <div className="py-10">
                <p className="eyebrow text-heading">Registration complete</p>
                <h2 id="email-registration-title" className="mt-4 font-serif text-4xl leading-none text-heading sm:text-5xl">You’re on the list.</h2>
                <p id="email-registration-description" className="mt-5 text-sm leading-7 text-ink/65">{message}</p>
                <button type="button" onClick={() => setOpen(false)} className="button-primary mt-8">Continue reading</button>
              </div>
            ) : (
              <>
                <p className="eyebrow mt-8 text-heading">The GLR edit</p>
                <h2 id="email-registration-title" className="mt-3 font-serif text-4xl leading-[.95] text-heading sm:text-5xl">Stay close to the world of luxury.</h2>
                <p id="email-registration-description" className="mt-5 text-sm leading-7 text-ink/60">Register for carefully selected reports, cultural intelligence and exceptional destinations from Global Luxury Reporter.</p>
                <form onSubmit={submit} className="mt-8">
                  <label htmlFor="registration-email" className="eyebrow text-heading">Email address</label>
                  <div className="mt-3 flex border-b border-heading/40">
                    <input ref={inputRef} id="registration-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-ink/35" />
                    <button type="submit" disabled={status === 'loading'} aria-label="Register email" className="px-3 text-heading transition hover:text-brand disabled:opacity-40"><ArrowRight size={22} /></button>
                  </div>
                  {message && <p role="alert" className="mt-3 text-xs text-brand">{message}</p>}
                  <button type="submit" disabled={status === 'loading'} className="button-primary mt-6 w-full">{status === 'loading' ? 'Registering…' : 'Register with email'}</button>
                </form>
                <p className="mt-5 text-[9px] leading-4 text-ink/45">By registering, you agree to receive editorial updates from GLR. You can unsubscribe at any time.</p>
                <button type="button" onClick={dismiss} className="mt-4 text-[9px] font-semibold uppercase tracking-editorial text-ink/45 underline-offset-4 hover:text-heading hover:underline">Not now</button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
