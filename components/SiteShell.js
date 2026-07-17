import Header from './Header';
import Footer from './Footer';
import { getCategories } from '@/lib/api';

export default async function SiteShell({ children, overlayHeader = false, footer = true }) {
  const categories = await getCategories();
  return <><Header categories={categories} overlay={overlayHeader} />{children}{footer && <Footer />}</>;
}
