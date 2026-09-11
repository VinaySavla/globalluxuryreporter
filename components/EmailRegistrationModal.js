'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

export default function EmailRegistrationModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return undefined;
    const timer = window.setTimeout(() => {
      setEmail('');
      setMessage('');
      setStatus('idle');
      setOpen(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [pathname]);

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
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const background = [...document.body.children].filter((element) => !element.classList.contains('registration-backdrop') && element.tagName !== 'SCRIPT');
    const backgroundState = background.map((element) => ({ element, ariaHidden: element.getAttribute('aria-hidden'), inert: element.inert }));
    for (const element of background) { element.setAttribute('aria-hidden', 'true'); element.inert = true; }
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') dismiss();
      if (event.key === 'Tab') {
        const focusable = [...dialogRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      for (const state of backgroundState) {
        if (state.ariaHidden === null) state.element.removeAttribute('aria-hidden'); else state.element.setAttribute('aria-hidden', state.ariaHidden);
        state.element.inert = state.inert;
      }
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  const dismiss = () => {
    setOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: form.website })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed.');
      setStatus('success');
      setMessage(result.message || 'Welcome to Global Luxury Reporter.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="registration-backdrop fixed inset-0 z-[100] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="email-registration-title" aria-describedby="email-registration-description" className="registration-panel relative w-full max-w-3xl overflow-hidden bg-cream shadow-[0_30px_100px_rgba(28,0,7,.45)]">
        <button type="button" onClick={dismiss} aria-label="Close registration dialog" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-ink/15 bg-cream/90 text-heading transition hover:bg-heading hover:text-white"><X size={18} /></button>

        <div className="grid md:grid-cols-[.8fr_1.2fr]">
          <div className="relative hidden min-h-[480px] bg-wine md:block">
            <Image src="/images/jewelry.jpg" alt="" fill priority sizes="320px" className="object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <p className="absolute bottom-8 left-8 right-8 font-serif text-3xl leading-tight text-white">A considered view of global luxury.</p>
          </div>

          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <Image src="/GLR-Logo-dp.png" alt="Global Luxury Reporter" width={96} height={96} className="h-20 w-20 object-cover sm:h-24 sm:w-24" />
            {status === 'success' ? (
              <div className="py-10">
                <p className="eyebrow text-heading">Check your inbox</p>
                <h2 id="email-registration-title" className="mt-4 font-serif text-4xl leading-none text-heading sm:text-5xl">Confirm your email.</h2>
                <p id="email-registration-description" className="mt-5 text-sm leading-7 text-ink/65">{message}</p>
                <button type="button" onClick={() => setOpen(false)} className="button-primary mt-8">Continue reading</button>
              </div>
            ) : (
              <>
                <p className="eyebrow mt-3 text-heading sm:mt-4">The GLR edit</p>
                <h2 id="email-registration-title" className="mt-3 font-serif text-4xl leading-[.95] text-heading sm:text-5xl">Stay close to the world of luxury.</h2>
                <p id="email-registration-description" className="mt-5 text-sm leading-7 text-ink/60">Register for carefully selected reports, cultural intelligence and exceptional destinations from Global Luxury Reporter.</p>
                <form onSubmit={submit} className="mt-8">
                  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
                  <label htmlFor="registration-email" className="eyebrow text-heading">Email address</label>
                  <div className="mt-3 flex border-b border-heading/40">
                    <input ref={inputRef} id="registration-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-ink/35" />
                    <button type="submit" disabled={status === 'loading'} aria-label="Register email" className="px-3 text-heading transition hover:text-brand disabled:opacity-40"><ArrowRight size={22} /></button>
                  </div>
                  {message && <p role="alert" className="mt-3 text-xs text-brand">{message}</p>}
                  <button type="submit" disabled={status === 'loading'} className="button-primary mt-6 w-full">{status === 'loading' ? 'Registering…' : 'Register with email'}</button>
                </form>
                <p className="mt-5 text-[10px] leading-5 text-ink/70">By registering, you ask GLR to send editorial updates. Confirm through the email we send you. You can unsubscribe at any time. Read our <a href="/information/privacy" className="underline">Privacy Policy</a>.</p>
                <button type="button" onClick={dismiss} className="mt-4 text-[9px] font-semibold uppercase tracking-editorial text-ink/45 underline-offset-4 hover:text-heading hover:underline">Not now</button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
