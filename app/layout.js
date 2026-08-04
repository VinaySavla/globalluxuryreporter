import { Cormorant_Garamond, Poppins } from 'next/font/google';
import EmailRegistrationModal from '@/components/EmailRegistrationModal';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant', weight: ['400', '500', '600', '700'], display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-poppins', weight: ['300', '400', '500', '600'], display: 'swap' });

export const metadata = {
  title: { default: 'Global Luxury Reporter', template: '%s | Global Luxury Reporter' },
  description: 'Independent reporting on the people, places and ideas shaping global luxury.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body className={`${cormorant.variable} ${poppins.variable} font-sans text-ink antialiased`}>{children}<EmailRegistrationModal /></body></html>;
}
