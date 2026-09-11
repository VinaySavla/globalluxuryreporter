import { Cormorant_Garamond, Poppins } from 'next/font/google';
import EmailRegistrationModal from '@/components/EmailRegistrationModal';
import { siteUrl } from '@/lib/site';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['400', '500', '600', '700'], display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['300', '400', '500', '600'], display: 'swap' });

export const metadata = {
  metadataBase: siteUrl,
  title: { default: 'Global Luxury Reporter', template: '%s | Global Luxury Reporter' },
  description: 'Independent reporting on the people, places and ideas shaping global luxury.',
  applicationName: 'Global Luxury Reporter',
  alternates: { canonical: '/', types: { 'application/rss+xml': [{ url: '/feed.xml', title: 'Global Luxury Reporter' }] } },
  openGraph: {
    type: 'website', siteName: 'Global Luxury Reporter', title: 'Global Luxury Reporter',
    description: 'Independent reporting on the people, places and ideas shaping global luxury.',
    url: '/', images: [{ url: '/images/jewelry.jpg', alt: 'Global Luxury Reporter' }]
  },
  twitter: { card: 'summary_large_image', title: 'Global Luxury Reporter', description: 'Independent reporting on global luxury.', images: ['/images/jewelry.jpg'] },
  robots: process.env.ROBOTS_INDEXING === 'true' ? { index: true, follow: true } : { index: false, follow: false }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body className={`${cormorant.variable} ${poppins.variable} font-sans text-ink antialiased`}><a href="#main-content" className="skip-link">Skip to main content</a>{children}<EmailRegistrationModal /></body></html>;
}
