'use client';

import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { analyticsUrl, googleAnalyticsId } from '@/lib/analytics.mjs';

const consentKey = 'glr-analytics-consent';
const measurementId = googleAnalyticsId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-S2R2KWQNS7');

export function AnalyticsPreferencesButton() {
  if (!measurementId) return null;
  return <button type="button" className="transition hover:text-white" onClick={() => window.dispatchEvent(new Event('glr:analytics-preferences'))}>Analytics preferences</button>;
}

export default function WebsiteAnalytics({ enabled }) {
  const pathname = usePathname();
  const publicRoute = Boolean(analyticsUrl(`https://readglr.com${pathname}`));
  const [consent, setConsent] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!measurementId || !enabled || !['readglr.com', 'www.readglr.com'].includes(window.location.hostname)) return undefined;
    let saved;
    try { saved = localStorage.getItem(consentKey); } catch { /* Storage may be disabled. */ }
    setConsent(saved === 'accepted' ? 'accepted' : 'declined');
    setShowPreferences(!saved);
    const openPreferences = () => setShowPreferences(true);
    window.addEventListener('glr:analytics-preferences', openPreferences);
    return () => window.removeEventListener('glr:analytics-preferences', openPreferences);
  }, [enabled]);

  useEffect(() => {
    if (!measurementId) return;
    const url = analyticsUrl(window.location.href);
    window[`ga-disable-${measurementId}`] = consent !== 'accepted' || !url;
    if (!ready || consent !== 'accepted' || !url) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false, page_location: url, page_referrer: document.referrer ? new URL(document.referrer).origin : '', allow_google_signals: false, allow_ad_personalization_signals: false });
    window.gtag('event', 'page_view', { page_location: url, page_title: document.title });
  }, [ready, consent, pathname]);

  const choose = (value) => {
    try { localStorage.setItem(consentKey, value); } catch { /* Keep this choice for the current page. */ }
    setConsent(value);
    setShowPreferences(false);
    if (value === 'declined') {
      window[`ga-disable-${measurementId}`] = true;
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', `; Domain=${window.location.hostname}`, '; Domain=.readglr.com']) document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
      }
      // Reload to stop an already loaded Google tag immediately after withdrawal.
      if (ready) window.location.reload();
    }
  };

  if (!enabled) return null;
  return <>
    <Analytics beforeSend={(event) => { const url = analyticsUrl(event.url); return url ? { ...event, url } : null; }} />
    {publicRoute && measurementId && consent === 'accepted' && <Script id="glr-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onReady={() => setReady(true)} />}
    {publicRoute && measurementId && showPreferences && <section aria-label="Analytics preferences" className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl border border-ink/20 bg-white p-5 text-ink shadow-lg sm:flex sm:items-center sm:gap-6">
      <p className="text-xs leading-6">GLR uses cookie-free Vercel Analytics. With your permission, Google Analytics also uses cookies to measure readership. <Link href="/information/cookies" className="underline">Cookie policy</Link></p>
      <div className="mt-4 flex shrink-0 gap-3 sm:mt-0"><button type="button" className="border border-ink/30 px-4 py-2 text-xs" onClick={() => choose('declined')}>Decline</button><button type="button" className="bg-heading px-4 py-2 text-xs text-white" onClick={() => choose('accepted')}>Accept analytics</button></div>
    </section>}
  </>;
}
