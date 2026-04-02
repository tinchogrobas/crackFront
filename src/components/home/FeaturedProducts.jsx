'use client'
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { getFeaturedProducts } from '@/lib/api';

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const ref = useRef(null);
  useEffect(() => { getFeaturedProducts().then(setProducts); }, []);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 320, behavior: 'smooth' });
  if (!products.length) return null;
  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-5 px-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-6 h-px bg-[#C8972E]" />
              <p className="text-[10px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Ofertas</p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#1A1A1A]">En descuento</h2>
          </div>
          <Link href="/tienda?has_discount=true" className="hidden sm:inline text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] hover:border-[#C8972E]/40 pb-0.5">
            Ver todo →
          </Link>
        </div>

        <div className="relative group/slider">
          <button onClick={() => scroll(-1)} aria-label="Anterior"
            className="hidden md:flex absolute left-1 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#E8E4DD] shadow-md text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E] transition-all duration-200 opacity-0 group-hover/slider:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={() => scroll(1)} aria-label="Siguiente"
            className="hidden md:flex absolute right-1 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#E8E4DD] shadow-md text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E] transition-all duration-200 opacity-0 group-hover/slider:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <div
            ref={ref}
            className="flex gap-3 overflow-x-auto hide-scrollbar px-5 sm:px-8 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {products.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[160px] sm:w-[calc(25%-9px)] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>

        <div className="sm:hidden text-center mt-5 px-5">
          <Link href="/tienda?has_discount=true" className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#6B6560] border border-[#E8E4DD] px-6 py-2.5 hover:border-[#C8972E]/40 hover:text-[#C8972E] transition-all">
            Ver todo →
          </Link>
        </div>
      </div>
    </section>
  );
}