'use client';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    name: 'Singles',
    slug: 'single',
    image: 'https://res.cloudinary.com/di7baglxg/image/upload/v1774460749/gemini-watermark-removed_9_i977nm.png',
  },
  {
    name: 'Slabs',
    slug: 'slab',
    image: 'https://res.cloudinary.com/di7baglxg/image/upload/v1774461207/Gemini_Generated_Image_qwjtqhqwjtqhqwjt_rcuo6r.png',
  },
  {
    name: 'Sellados',
    slug: 'sellado',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_Tins_3d29024b-abf0-4f81-8859-037884551ddb.png?v=1762190773&width=400',
  },
  {
    name: 'Accesorios',
    slug: 'accesorio',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
  },
  {
    name: 'Mystery Packs',
    slug: 'mystery-pack',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
  },
];

function CategoryCard({ cat }) {
  return (
    <Link
      href={`/tienda?category=${cat.slug}`}
      className="group flex-shrink-0 w-[160px] sm:w-auto"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E8E4DD]/80 bg-[#F8F6F2] group-hover:border-[#C8972E]/40 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(200,151,46,0.1)]">
        <Image
          src={cat.image}
          alt={cat.name}
          fill
          sizes="(max-width: 699px) 160px, 285px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-sm tracking-[0.05em] uppercase leading-tight">
            {cat.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesGrid() {
  return (
    <section className="py-8 sm:py-10 border-t border-[#E8E4DD]">
      {/* Mobile: scroll horizontal sin scrollbar */}
      <div className="sm:hidden flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-1">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid max-w-[1400px] mx-auto px-8 grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>
    </section>
  );
}
