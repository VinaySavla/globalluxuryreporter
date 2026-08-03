export const fallbackCategories = [
  { id: 1, name: 'Fashion & Style', slug: 'fashion', description: 'The ateliers, collections and creative voices defining modern elegance.', cover_image: '/images/fashion.jpg' },
  { id: 2, name: 'Travel & Experiences', slug: 'travel', description: 'Extraordinary destinations and considered escapes for the curious traveler.', cover_image: '/images/travel.jpg' },
  { id: 3, name: 'Culture', slug: 'culture', description: 'Art, ideas and cultural movements shaping how we see the world.', cover_image: '/images/culture.jpg' },
  { id: 4, name: 'Design', slug: 'design', description: 'Remarkable interiors, objects and architecture with a lasting point of view.', cover_image: '/images/design.jpg' },
  { id: 5, name: 'Wellness', slug: 'wellness', description: 'A refined approach to restoration, ritual and living beautifully.', cover_image: '/images/wellness.jpg' },
  { id: 6, name: 'Automotive', slug: 'automotive', description: 'Engineering, performance and the theatre of the open road.', cover_image: '/images/automotive.jpg' }
];

const storyContent = `Luxury is changing. Today, its most compelling expression is thoughtful, personal and quietly assured. It values provenance as much as polish, and places experience ahead of spectacle.

## A more considered perspective

The makers leading this shift are working with patience and purpose. Their work invites us to slow down, notice the details and understand the human stories behind exceptional objects and unforgettable places.

This is not novelty for its own sake. It is the lasting pleasure of something made well: materials chosen with care, ideas refined over time and experiences designed to remain vivid long after they end.

## The enduring appeal of craft

Across disciplines, a common language is emerging. It is one of restraint, integrity and deep knowledge. The result feels both timely and timeless—a confident vision of luxury for a more discerning world.`;

const storySeeds = [
  ['the-new-language-of-high-jewelry', 'The New Language of High Jewelry', 'culture', '/images/jewelry.jpg', 'How a new generation of maisons is replacing spectacle with intimacy, symbolism and extraordinary craft.'],
  ['an-island-made-for-slow-mornings', 'An Island Made for Slow Mornings', 'travel', '/images/travel.jpg', 'A private escape where thoughtful architecture and unhurried rituals define the experience.'],
  ['the-quiet-power-of-tailoring', 'The Quiet Power of Modern Tailoring', 'fashion', '/images/fashion.jpg', 'Inside the ateliers reshaping a classic language through fluid form and exacting construction.'],
  ['collecting-art-with-instinct', 'Collecting Art With Instinct', 'culture', '/images/culture.jpg', 'Curators and collectors explain why the most meaningful collections begin with curiosity.'],
  ['rooms-that-change-the-way-we-live', 'Rooms That Change the Way We Live', 'design', '/images/design.jpg', 'Interiors that place emotion, material and daily ritual at the center of contemporary design.'],
  ['the-new-rituals-of-restoration', 'The New Rituals of Restoration', 'wellness', '/images/wellness.jpg', 'From sleep retreats to thermal traditions, restoration is becoming deeply personal.'],
  ['grand-touring-reimagined', 'Grand Touring, Reimagined', 'automotive', '/images/automotive.jpg', 'The new grand tourers balance formidable engineering with effortless long-distance comfort.'],
  ['the-private-villa-renaissance', 'The Private Villa Renaissance', 'travel', '/images/travel.jpg', 'Why discerning travellers are choosing residences that feel connected to place.'],
  ['inside-the-independent-atelier', 'Inside the Independent Atelier', 'fashion', '/images/fashion.jpg', 'Meet the independent designers building slower, more distinctive fashion businesses.'],
  ['the-art-of-the-listening-room', 'The Art of the Listening Room', 'design', '/images/design.jpg', 'Acoustic precision meets warm materiality in the return of rooms made purely for music.'],
  ['why-wellness-is-going-wild', 'Why Wellness Is Going Wild', 'wellness', '/images/wellness.jpg', 'The most compelling retreats are moving beyond the spa and into the landscape.'],
  ['the-collectors-road-trip', 'The Collector’s Road Trip', 'automotive', '/images/automotive.jpg', 'A journey through mountain passes in machines chosen for character rather than speed.'],
  ['a-new-era-of-cultural-patronage', 'A New Era of Cultural Patronage', 'culture', '/images/culture.jpg', 'Private foundations are finding more inclusive ways to sustain artists and institutions.'],
  ['the-hotel-as-a-work-of-art', 'The Hotel as a Work of Art', 'travel', '/images/travel.jpg', 'Five remarkable stays where architecture is as memorable as the destination.'],
  ['objects-with-a-long-memory', 'Objects With a Long Memory', 'design', '/images/design.jpg', 'Designers reveal how provenance and patina create objects worth keeping for generations.'],
  ['the-new-codes-of-evening-dress', 'The New Codes of Evening Dress', 'fashion', '/images/fashion.jpg', 'Designers are rewriting occasion dressing with ease, individuality and an exacting eye.']
];

export const fallbackReports = storySeeds.map(([slug, title, categorySlug, cover_image, excerpt], index) => ({
  id: index + 1,
  slug,
  title,
  excerpt,
  content: storyContent,
  cover_image,
  cover_alt: `${title} editorial photograph`,
  author: index % 3 === 0 ? 'The GLR Editorial Team' : index % 2 ? 'Amelia Hart' : 'Arjun Mehta',
  published_at: new Date(Date.UTC(2026, 7, 3 - index)).toISOString(),
  reading_time: 4 + (index % 5),
  featured: index < 3,
  editor_pick: [0, 3, 4, 7, 9].includes(index),
  popularity: 100 - index * 4 + (index % 3) * 7,
  category: fallbackCategories.find((item) => item.slug === categorySlug)
}));
