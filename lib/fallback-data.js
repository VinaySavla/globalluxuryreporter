export const fallbackCategories = [
  { id: 1, name: 'Fashion & Style', slug: 'fashion', description: 'The ateliers, collections and creative voices defining modern elegance.', cover_image: '/images/fashion.jpg' },
  { id: 2, name: 'Travel & Experiences', slug: 'travel', description: 'Extraordinary destinations and considered escapes for the curious traveler.', cover_image: '/images/travel.jpg' },
  { id: 3, name: 'Culture', slug: 'culture', description: 'Art, ideas and cultural movements shaping how we see the world.', cover_image: '/images/culture.jpg' },
  { id: 4, name: 'Design', slug: 'design', description: 'Remarkable interiors, objects and architecture with a lasting point of view.', cover_image: '/images/design.jpg' },
  { id: 5, name: 'Wellness', slug: 'wellness', description: 'A refined approach to restoration, ritual and living beautifully.', cover_image: '/images/wellness.jpg' },
  { id: 6, name: 'Automotive', slug: 'automotive', description: 'Engineering, performance and the theatre of the open road.', cover_image: '/images/automotive.jpg' }
];

const titles = [
  ['the-new-language-of-high-jewelry', 'The New Language of High Jewelry', 'culture', '/images/jewelry.jpg'],
  ['an-island-made-for-slow-mornings', 'An Island Made for Slow Mornings', 'travel', fallbackCategories[1].cover_image],
  ['the-quiet-power-of-tailoring', 'The Quiet Power of Modern Tailoring', 'fashion', fallbackCategories[0].cover_image],
  ['collecting-art-with-instinct', 'Collecting Art With Instinct', 'culture', fallbackCategories[2].cover_image],
  ['rooms-that-change-the-way-we-live', 'Rooms That Change the Way We Live', 'design', fallbackCategories[3].cover_image],
  ['the-new-rituals-of-restoration', 'The New Rituals of Restoration', 'wellness', fallbackCategories[4].cover_image],
  ['grand-touring-reimagined', 'Grand Touring, Reimagined', 'automotive', fallbackCategories[5].cover_image],
  ['the-private-villa-renaissance', 'The Private Villa Renaissance', 'travel', fallbackCategories[1].cover_image],
  ['inside-the-independent-atelier', 'Inside the Independent Atelier', 'fashion', fallbackCategories[0].cover_image]
];

export const fallbackReports = titles.map(([slug, title, categorySlug, cover_image], index) => ({
  id: index + 1, slug, title, cover_image,
  excerpt: 'A considered look at the people, places and ideas setting a new standard for contemporary luxury.',
  author: index % 2 ? 'Amelia Hart' : 'The GLR Editorial Team',
  published_at: new Date(2026, 5, 18 - index).toISOString(),
  featured: index === 0,
  category: fallbackCategories.find((item) => item.slug === categorySlug),
  content: `Luxury is changing. Today, its most compelling expression is thoughtful, personal and quietly assured. It values provenance as much as polish, and places experience ahead of spectacle.\n\n## A more considered perspective\n\nThe makers leading this shift are working with patience and purpose. Their work invites us to slow down, to notice the details, and to understand the human stories behind exceptional objects and unforgettable places.\n\nThis is not about novelty for its own sake. It is about the lasting pleasure of something made well: materials chosen with care, ideas refined over time, and experiences designed to remain vivid long after they end.\n\n## The enduring appeal of craft\n\nAcross disciplines, a common language is emerging. It is one of restraint, integrity and deep knowledge. The result feels both timely and timeless—a confident vision of luxury for a more discerning world.`
}));
