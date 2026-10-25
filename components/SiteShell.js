import Header from './Header';
import Footer from './Footer';
import { getCategories } from '@/lib/data-service';

export default async function SiteShell({ children, overlayHeader = false, categories: suppliedCategories }) {
  const categories = suppliedCategories || await getCategories();
  return <><Header categories={categories} overlay={overlayHeader} />{children}<Footer /></>;
}
