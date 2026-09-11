import { getSitemapContent } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

export default async function sitemap() {
  if (process.env.ROBOTS_INDEXING !== 'true') return [];
  const { categories, reports } = await getSitemapContent();
  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/contact'), changeFrequency: 'yearly', priority: 0.4 },
    ...['editorial-standards', 'contributors', 'privacy', 'terms', 'cookies'].map((slug) => ({ url: absoluteUrl(`/information/${slug}`), changeFrequency: 'yearly', priority: 0.3 })),
    { url: absoluteUrl('/categories/all'), changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), changeFrequency: 'daily', priority: 0.8 })),
    ...reports.map((report) => ({ url: absoluteUrl(`/reports/${report.slug}`), lastModified: report.date_updated || report.published_at, changeFrequency: 'weekly', priority: 0.7 }))
  ];
}
