'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import { getFeaturedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

import 'swiper/css';

function FeaturedCard({ product }) {
  const cardRef = useRef(null);
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addToCart(product);
    if (success) openCart();
    else toast.error('Stock máximo alcanzado');
  };

  return (
    <Link href={`/tienda/${product.slug}`} className="group block">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative aspect-[3/4] bg-[#F8F6F2] rounded-xl overflow-hidden border border-[#E8E4DD]/80 group-hover:border-[#C8972E]/25 transition-all duration-500 card-glow group-hover:shadow-[0_12px_40px_rgba(200,151,46,0.1)]"
      >
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8972E 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {product.image_url && (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-6 sm:p-8 product-image-zoom relative z-0 drop-shadow-sm" sizes="(max-width: 640px) 50vw, 25vw" />
        )}

        {product.discount_percent > 0 && (
          <span className="absolute top-3 left-3 bg-[#C8972E] text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10 shadow-sm">
            -{product.discount_percent}%
          </span>
        )}

        <button
          onClick={handleAddToCart}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm text-[#C8972E] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#C8972E] hover:text-white shadow-md z-10 border border-[#E8E4DD]/50"
        >
          <ShoppingBag size={14} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
          <p className="text-[9px] text-[#C8972E]/70 uppercase tracking-[0.15em] font-medium mb-1">
            {typeof product.category === 'object' ? product.category.name : product.category}
          </p>
          <h3 className="text-[13px] sm:text-sm font-bold text-[#1A1A1A] mb-2 group-hover:text-[#C8972E] transition-colors line-clamp-2 leading-tight">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#C8972E]">{formatPrice(product.final_price)}</span>
            {product.discount_percent > 0 && (
              <span className="text-[11px] text-[#6B6560]/35 line-through">{formatPrice(product.price_ars)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => { getFeaturedProducts().then(setProducts); }, []);
  if (products.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-6 h-px bg-[#C8972E]" />
              <p className="text-[10px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Ofertas</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#1A1A1A]">En descuento</h2>
          </div>
          <Link
            href="/tienda?has_discount=true"
            className="hidden sm:inline text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] hover:border-[#C8972E]/40 pb-0.5"
          >
            Ver todo →
          </Link>
        </div>

        {/* Slider */}
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
                <FeaturedCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Ver todo — mobile */}
        <div className="sm:hidden text-center mt-5 px-5">
          <Link
            href="/tienda?has_discount=true"
            className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#6B6560] border border-[#E8E4DD] px-6 py-2.5 hover:border-[#C8972E]/40 hover:text-[#C8972E] transition-all"
          >
            Ver todo →
          </Link>
        </div>
      </div>
    </section>
  );
}
