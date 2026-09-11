'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [state, setState] = useState({ status: 'idle', message: '' });
  async function submit(event) {
    event.preventDefault();
    setState({ status: 'loading', message: '' });
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your message.');
      event.currentTarget.reset();
      setState({ status: 'success', message: result.message });
    } catch (error) { setState({ status: 'error', message: error.message }); }
  }
  const fieldClass = 'mt-2 w-full border-0 bg-cream px-5 py-3 text-sm outline-none ring-brand/20 transition focus:ring-2';
  return (
    <form onSubmit={submit} className="space-y-5">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" />
      <label className="block text-sm font-medium">Name<input name="name" required minLength={2} maxLength={100} placeholder="Enter your name" className={fieldClass} /></label>
      <label className="block text-sm font-medium">Email<input name="email" type="email" required placeholder="Enter your email address" className={fieldClass} /></label>
      <label className="block text-sm font-medium">Message<textarea name="message" required minLength={10} maxLength={3000} rows={5} placeholder="How can we help?" className={`${fieldClass} resize-none`} /></label>
      <p className="text-xs leading-5 text-ink/70">GLR uses these details only to respond to your inquiry. See our <a href="/information/privacy" className="underline">Privacy Policy</a>.</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"><p aria-live="polite" className={`text-xs ${state.status === 'error' ? 'text-red-700' : 'text-brand'}`}>{state.message}</p><button disabled={state.status === 'loading'} className="button-primary min-w-40 disabled:opacity-60">{state.status === 'loading' ? 'Sending…' : 'Submit'}</button></div>
    </form>
  );
}
