'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import ProductCard from '@/components/ui/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getNewArrivals } from '@/lib/api';

import 'swiper/css';
import 'swiper/css/free-mode';

export default function NewProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    getNewArrivals()
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-[#C8972E]" />
              <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Lo nuevo</p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#1A1A1A]">Últimos ingresos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button ref={prevRef} className="w-10 h-10 flex items-center justify-center border border-[#E8E4DD] text-[#6B6560]/50 hover:text-[#1A1A1A] hover:border-[#C8972E]/30 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button ref={nextRef} className="w-10 h-10 flex items-center justify-center border border-[#E8E4DD] text-[#6B6560]/50 hover:text-[#1A1A1A] hover:border-[#C8972E]/30 transition-all">
              <ChevronRight size={18} />
            </button>
            <Link href="/tienda" className="ml-4 text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] hover:border-[#C8972E]/40 pb-0.5 hidden sm:block">
              Ver todo →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <Swiper
            modules={[Navigation, FreeMode]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            freeMode={{ enabled: true, sticky: true }}
            grabCursor={true}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 2, spaceBetween: 16 },
              640: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="!pb-2"
          >
            {products.map((product, i) => (
              <SwiperSlide key={product.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : null}
      </div>
    </section>
  );
}
