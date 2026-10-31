import { notFound } from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import { legalAddress, legalEntityName, privacyEmail } from '@/lib/legal';

const pages = {
  'editorial-standards': {
    title: 'Editorial Standards',
    intro: 'GLR aims to publish independent, accurate and clearly presented editorial work.',
    sections: [
      ['Accuracy and corrections', 'Writers and editors should verify names, dates, quotations and material factual claims before publication. Material errors are corrected promptly and transparently. Send correction requests to info@readglr.com with the article URL and supporting details.'],
      ['Independence', 'Editorial decisions are made independently of advertisers, commercial partners and subjects. Sponsored or paid material must be clearly labelled before publication.'],
      ['Sources and attribution', 'GLR attributes information to its source wherever practical. Anonymous sourcing is reserved for information that serves a clear public or editorial interest and cannot reasonably be obtained on the record.'],
      ['Conflicts and gifts', 'Contributors must disclose relationships, travel support, gifts or financial interests that could reasonably affect—or appear to affect—their work. Relevant support is disclosed to readers.'],
      ['Images and rights', 'Editors must have a documented right or licence to publish submitted photography, illustration and other media. Materially altered editorial images must not mislead readers.']
    ]
  },
  contributors: {
    title: 'Contributors',
    intro: 'GLR works with editors, writers, photographers and specialists whose expertise matches each assignment.',
    sections: [
      ['Contributor expectations', 'Contributors agree to GLR’s editorial standards, disclose conflicts, provide accurate attribution and confirm that submitted work does not infringe another party’s rights.'],
      ['Pitching GLR', 'Send concise pitches and relevant examples of previous work to info@readglr.com. Please do not send confidential information unless an editor has agreed on a secure method first.'],
      ['Author information', 'Published reports identify their author. Contributor biographies and contact details are added only with the contributor’s approval.']
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This notice explains how Global Luxury Reporter (GLR) handles personal information submitted through this website.',
    sections: [
      ['Information we collect', 'GLR collects the name, email address and message you submit through the contact form; the email address and confirmation records you submit for editorial updates; and limited security records such as a one-way hash derived from the network address used to submit a form.'],
      ['How we use it', 'Contact information is used to respond to inquiries. Subscription information is used only after email confirmation to deliver requested editorial updates, maintain an unsubscribe record and protect the service against abuse. GLR does not sell personal information.'],
      ['Website analytics', <>GLR uses Vercel Web Analytics to understand readership without analytics cookies. If you accept analytics cookies, Google Analytics also measures page views. GLR removes query strings and fragments from tracked page URLs and excludes subscription and internal pages. Advertising signals are disabled. See <a href="https://policies.google.com/technologies/partner-sites" className="underline" target="_blank" rel="noopener noreferrer">how Google uses information from sites that use its services</a>. Change your choice using Analytics preferences in the footer.</>],
      ['Legal basis and choices', 'GLR processes contact inquiries to respond to your request and processes editorial email registrations with your affirmative consent. You may withdraw email consent at any time using the unsubscribe link in an email.'],
      ['Retention', 'Unconfirmed registrations expire after 24 hours and should be deleted during routine maintenance. Contact inquiries are retained for up to 24 months unless a longer period is needed for an active matter or legal obligation. Active subscriber records are retained while subscribed; minimal suppression records may be retained to respect opt-outs.'],
      ['Service providers and transfers', 'GLR uses Vercel for frontend hosting and cookie-free web analytics, Hostinger for its private editorial backend, and Google for email delivery and consent-based Google Analytics. These providers may process information internationally.'],
      ['Your rights', 'Depending on your location, you may request access, correction, deletion, restriction, portability or objection, and may complain to your local data-protection authority. Email info@readglr.com to make a request. GLR may need to verify your identity.'],
      ['Contact', `The website is operated by ${legalEntityName}, ${legalAddress}. For privacy questions, requests or complaints, email ${privacyEmail}.`]
    ]
  },
  terms: {
    title: 'Terms of Use',
    intro: 'These terms apply when you access or use the Global Luxury Reporter website.',
    sections: [
      ['Editorial information', 'GLR content is provided for general editorial and informational purposes. It is not legal, medical, investment or other professional advice.'],
      ['Intellectual property', 'Unless otherwise stated, GLR and its licensors retain rights in the website and its original content. You may link to public pages and make personal, non-commercial use of the site. Republishing or commercial reuse requires written permission.'],
      ['Acceptable use', 'Do not interfere with the service, attempt unauthorized access, submit unlawful or harmful material, scrape the site in a way that degrades availability, or misuse forms and email functions.'],
      ['Third-party services', 'Links to third-party websites are provided for context or convenience. GLR does not control their content, availability or privacy practices.'],
      ['Availability and liability', 'GLR may correct, remove or update content and cannot promise uninterrupted availability. Nothing in these terms excludes liability that cannot lawfully be excluded.'],
      ['Contact and governing terms', `The website is operated by ${legalEntityName}, ${legalAddress}. Questions may be sent to ${privacyEmail}. Applicable mandatory consumer rights are unaffected; governing law and dispute terms should be confirmed by counsel for the launch markets.`]
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    intro: 'GLR uses cookie-free Vercel Web Analytics and offers optional Google Analytics cookies to understand readership.',
    sections: [
      ['Essential technology', 'The hosting platform may use strictly necessary security or load-balancing technology to deliver and protect the service. Such technology is not used by GLR for advertising.'],
      ['Google Analytics cookies', 'Google Analytics loads only after you choose Accept analytics. It can set _ga cookies to measure visits and engagement. GLR does not enable Google advertising signals or advertising personalization.'],
      ['Your choice', 'Choose Accept analytics or Decline in the analytics notice. Reopen Analytics preferences in the footer to change your choice. Declining stops Google Analytics, removes its accessible first-party _ga cookies and reloads the page if the tag was already active. Your preference is stored locally in this browser.'],
      ['Browser controls', 'You can use browser settings to inspect, block or delete stored website data. Blocking strictly necessary technology may affect service operation.'],
      ['Contact', 'Questions about website tracking may be sent to info@readglr.com.']
    ]
  }
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  return page ? { title: page.title, description: page.intro, alternates: { canonical: `/information/${slug}` }, openGraph: { title: page.title, description: page.intro, url: `/information/${slug}`, siteName: 'Global Luxury Reporter', images: ['/images/jewelry.jpg'] }, twitter: { card: 'summary_large_image', title: page.title, description: page.intro, images: ['/images/jewelry.jpg'] } } : {};
}

export default async function InformationPage({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <SiteShell><main id="main-content" className="editorial-container py-16 sm:py-24"><article className="mx-auto max-w-3xl"><p className="eyebrow text-heading">GLR information</p><h1 className="hero-title mt-4 text-heading">{page.title}</h1><p className="mt-6 text-base leading-8 text-ink/80">{page.intro}</p><p className="mt-3 text-xs uppercase tracking-wider text-ink/65">Last updated {['privacy', 'cookies'].includes(slug) ? '31 October 2026' : '11 September 2026'}</p><div className="mt-12 space-y-10">{page.sections.map(([title, content]) => <section key={title}><h2 className="font-serif text-3xl text-heading">{title}</h2><p className="mt-4 text-sm leading-7 text-ink/75">{content}</p></section>)}</div></article></main></SiteShell>;
}
