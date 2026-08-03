import Image from 'next/image';
import SiteShell from '@/components/SiteShell';
import { getCategories } from '@/lib/api';

export const metadata = { title: 'Our Mission' };

export default async function AboutPage() {
  const categories = await getCategories();
  return (
    <SiteShell overlayHeader>
      <main>
        <section className="relative min-h-[100svh] bg-ink">
          <Image src="/images/jewelry.jpg" alt="Fine jewelry editorial" fill priority className="object-cover opacity-65" sizes="100vw" />
          <div className="absolute inset-0 bg-ink/20" />
          <div className="relative flex min-h-[100svh] items-center justify-center px-6 pt-20 text-center text-white"><div className="max-w-3xl"><h1 className="hero-title">Our Mission</h1><p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/85">To report on global luxury with intelligence and imagination—celebrating the visionaries, craftspeople and places that make our world richer.</p></div></div>
        </section>
        <section className="editorial-container py-24 lg:py-32">
          <div className="text-center"><h2 className="section-title">What We Cover</h2><p className="mt-5 text-sm text-ink/65">Travel, fashion, automotive, jewelry, wellness, design and culture—our curated lens on global luxury.</p></div>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 md:hidden">
            {categories.slice(0, 6).map((category) => <div key={category.slug} className="group relative aspect-[4/5] overflow-hidden"><Image src={category.cover_image} alt={`${category.name} editorial`} fill sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" /><h3 className="absolute bottom-4 left-4 right-4 font-serif text-xl text-white sm:bottom-5 sm:left-6 sm:text-3xl">{category.name.replace(' & Style', '')}</h3></div>)}
          </div>
          <div className="mt-16 hidden auto-rows-[260px] grid-cols-4 gap-4 md:grid lg:gap-6">
            {categories.slice(0, 5).map((category, index) => <div key={category.slug} className={`group relative overflow-hidden ${index === 0 || index === 2 ? 'row-span-2' : ''} ${index === 1 ? 'col-span-2' : ''}`}><Image src={category.cover_image} alt={`${category.name} editorial`} fill sizes="25vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" /><h3 className="absolute bottom-5 left-6 font-serif text-3xl text-white">{category.name.replace(' & Style', '')}</h3></div>)}
          </div>
        </section>
        <section className="bg-cream py-24 lg:py-32"><div className="editorial-container"><h2 className="section-title text-center">Our Vision</h2><div className="mt-14 grid gap-10 md:grid-cols-3 md:divide-x md:divide-brand/20"><p className="text-sm leading-7 text-ink/65 md:pr-10">We believe true luxury is a point of view: informed, curious and deeply personal. Our journalism looks beyond the obvious to find what will endure.</p><p className="text-sm leading-7 text-ink/65 md:px-10">We champion originality and craft in every form, giving space to established icons and independent voices working with uncommon purpose.</p><p className="text-sm leading-7 text-ink/65 md:pl-10">We connect a discerning global readership with stories that invite discovery, deepen understanding and make the world feel more expansive.</p></div></div></section>
        <section className="bg-cream py-20 lg:py-28"><div className="editorial-container"><div className="text-center"><p className="eyebrow text-heading/70">Across continents</p><h2 className="section-title mt-4">Global Reach</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-ink/65">Reporting from the world’s most influential centers of culture, design, hospitality and craft.</p></div><div className="relative mt-12 aspect-[16/9] overflow-hidden bg-wine"><Image src="/images/GLR-globalreach.png" alt="Global Luxury Reporter reach across New York, Paris, Dubai, India, Singapore and Sydney" fill sizes="100vw" className="object-contain" /></div></div></section>
      </main>
    </SiteShell>
  );
}
