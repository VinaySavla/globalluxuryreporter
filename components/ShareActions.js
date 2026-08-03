'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function ShareActions({ title }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) return navigator.share({ title, url: window.location.href });
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="flex gap-2 lg:flex-col"><button onClick={share} className="grid h-10 w-10 place-items-center border border-ink/20 text-heading hover:bg-heading hover:text-white" aria-label="Share report"><Share2 size={16} /></button><button onClick={copy} className="grid h-10 w-10 place-items-center border border-ink/20 text-heading hover:bg-heading hover:text-white" aria-label="Copy report link">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>;
}
