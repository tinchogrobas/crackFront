'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import ProductCard from '@/components/ui/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getNewArrivals } from '@/lib/api';

import 'swiper/css';

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
    <section className="py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-6 h-px bg-[#C8972E]" />
              <p className="text-[10px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Lo nuevo</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#1A1A1A]">Últimos ingresos</h2>
          </div>
          <Link
            href="/tienda"
            className="hidden sm:inline text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] hover:border-[#C8972E]/40 pb-0.5"
          >
            Ver todo →
          </Link>
        </div>

        {/* Slider */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 sm:px-8">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="relative group/slider">
            {/* Flechas — solo desktop */}
            <button
              ref={prevRef}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 items-center justify-center rounded-full
                         bg-white border border-[#E8E4DD] shadow-md
                         text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E]
                         transition-all duration-200
                         opacity-0 group-hover/slider:opacity-100 -translate-x-2 group-hover/slider:translate-x-0"
              aria-label="Anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              ref={nextRef}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10
                         w-11 h-11 items-center justify-center rounded-full
                         bg-white border border-[#E8E4DD] shadow-md
                         text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E]
                         transition-all duration-200
                         opacity-0 group-hover/slider:opacity-100 translate-x-2 group-hover/slider:translate-x-0"
              aria-label="Siguiente"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <Swiper
              modules={[Navigation, FreeMode]}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              freeMode={{ enabled: true }}
              grabCursor={true}
              slidesPerView={2.2}
              spaceBetween={12}
              breakpoints={{
                640:  { slidesPerView: 3.2, spaceBetween: 14 },
                1024: { slidesPerView: 4,   spaceBetween: 16 },
                1280: { slidesPerView: 4,   spaceBetween: 20 },
              }}
              slidesOffsetBefore={20}
              slidesOffsetAfter={20}
              className="!pb-1"
            >
              {products.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : null}

        {/* Ver todo — mobile */}
        <div className="sm:hidden text-center mt-5 px-5">
          <Link
            href="/tienda"
            className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#6B6560] border border-[#E8E4DD] px-6 py-2.5 hover:border-[#C8972E]/40 hover:text-[#C8972E] transition-all"
          >
            Ver todo →
          </Link>
        </div>
      </div>
    </section>
  );
}
