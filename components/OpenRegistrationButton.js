'use client';

import { Mail } from 'lucide-react';

export default function OpenRegistrationButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('glr:open-registration'))} className="flex h-9 items-center gap-2 border border-white/20 px-3 text-[9px] font-semibold uppercase tracking-editorial text-white/80 transition hover:border-white hover:bg-white hover:text-ink" aria-label="Open email registration">
      <Mail size={15} strokeWidth={1.7} />
      Subscribe
    </button>
  );
}
