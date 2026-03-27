'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    name: '',
    slug: 'single',
    desc: '',
    image: 'https://res.cloudinary.com/di7baglxg/image/upload/v1774460749/gemini-watermark-removed_9_i977nm.png',
  },
  {
    name: '',
    slug: 'slab',
    desc: '',
    image: 'https://res.cloudinary.com/di7baglxg/image/upload/v1774461207/Gemini_Generated_Image_qwjtqhqwjtqhqwjt_rcuo6r.png',
  },
  {
    name: 'Sellados',
    slug: 'sellado',
    desc: 'Booster Boxes & ETBs',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_Tins_3d29024b-abf0-4f81-8859-037884551ddb.png?v=1762190773&width=400',
  },
  {
    name: 'Accesorios',
    slug: 'accesorio',
    desc: 'Sleeves, Deck Boxes',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
  },
  {
    name: 'Mystery Packs',
    slug: 'mystery-pack',
    desc: 'Sorpresa garantizada',
    image: 'https://zardocards.com/cdn/shop/files/Carousel_SleevedPacks.png?v=1762270653&width=400',
  },
];

function CategoryCard({ cat, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.08 }}
    >
      <Link href={`/tienda?category=${cat.slug}`} className="block group">
        <div className="relative overflow-hidden rounded-xl border border-[#E8E4DD]/80 bg-[#F8F6F2] group-hover:border-[#C8972E]/40 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(200,151,46,0.1)]">
          {/* Imagen responsive */}
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 699px) 160px, 285px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay degradado */}
            <div className="absolute inset-0 bg-gradient-to-t" />

            {/* Texto sobre la imagen */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <p className="text-white font-bold text-sm sm:text-base tracking-[0.05em] uppercase leading-tight">
                {cat.name}
              </p>
              <p className="text-white/70 text-[10px] sm:text-[11px] tracking-[0.1em] mt-0.5 group-hover:text-white/90 transition-colors">
                {cat.desc}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CategoriesGrid() {
  return (
    <section className="py-16 sm:py-20 border-t border-[#E8E4DD]">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
