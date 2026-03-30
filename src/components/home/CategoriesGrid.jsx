'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/api';

// Imagen por slug  agregá las tuyas acá
const CATEGORY_IMAGES = {
  'single':       'https://res.cloudinary.com/di7baglxg/image/upload/v1774460749/gemini-watermark-removed_9_i977nm.png',
  'slab':         'https://res.cloudinary.com/di7baglxg/image/upload/v1774461207/Gemini_Generated_Image_qwjtqhqwjtqhqwjt_rcuo6r.png',
  'sellado':      'https://zardocards.com/cdn/shop/files/Carousel_Tins_3d29024b-abf0-4f81-8859-037884551ddb.png?v=1762190773&width=400',
  'accesorio':    'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
  'mystery-pack': 'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
};

function CategoryCard({ cat, size }) {
  const img = CATEGORY_IMAGES[cat.slug];
  if (!img) return null;
  return (
    <Link href={`/tienda?category=${cat.slug}`}
      className={`group flex-shrink-0 ${size}`}>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E8E4DD]/80 bg-[#F8F6F2] group-hover:border-[#C8972E]/40 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(200,151,46,0.1)]">
        <Image src={img} alt={cat.name} fill
          sizes="(max-width: 640px) 140px, (max-width: 1024px) 33vw, 285px"
          className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
    </Link>
  );
}

export default function CategoriesGrid() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  if (!categories.length) return null;

  return (
    <section className="py-8 sm:py-10 border-t border-[#E8E4DD]">
      {/* Mobile: scroll horizontal */}
      <div className="sm:hidden flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-1">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} size="w-[140px]" />
        ))}
      </div>
      {/* Desktop: grid */}
      <div className="hidden sm:grid max-w-[1400px] mx-auto px-8 grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.slug} cat={cat} size="w-full" />
        ))}
      </div>
    </section>
  );
}