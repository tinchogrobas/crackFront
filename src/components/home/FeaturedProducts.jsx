'use client'
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { getFeaturedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

function FeaturedCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const cat = typeof product.category === 'object' ? product.category.name : product.category;
  const onAdd = (e) => { e.preventDefault(); e.stopPropagation(); if (addToCart(product)) openCart(); else toast.error('Stock maximo'); };
  return (
    <Link href={`/tienda/`} className="group block">
      <div className="relative aspect-[3/4] bg-[#F8F6F2] rounded-xl overflow-hidden border border-[#E8E4DD]/80 group-hover:border-[#C8972E]/25 transition-all duration-500">
        {product.image_url && <Image src={product.image_url} alt={product.name} fill className="object-contain p-6 sm:p-8 transition-transform duration-500 group-hover:scale-105" sizes="160px" />}
        {product.discount_percent > 0 && <span className="absolute top-3 left-3 bg-[#C8972E] text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10">-{product.discount_percent}%</span>}
        <button onClick={onAdd} className="absolute top-3 right-3 w-9 h-9 bg-white/90 text-[#C8972E] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#C8972E] hover:text-white shadow-md z-10"><ShoppingBag size={14} /></button>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
          <p className="text-[9px] text-[#C8972E]/70 uppercase tracking-[0.15em] font-medium mb-1">{cat}</p>
          <h3 className="text-[13px] font-bold text-[#1A1A1A] mb-1.5 group-hover:text-[#C8972E] transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2"><span className="text-sm font-bold text-[#C8972E]">{formatPrice(product.final_price)}</span>{product.discount_percent > 0 && <span className="text-[11px] text-[#6B6560]/35 line-through">{formatPrice(product.price_ars)}</span>}</div>
        </div>
      </div>
    </Link>
  );
}

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
          <div><div className="flex items-center gap-3 mb-1.5"><div className="w-6 h-px bg-[#C8972E]" /><p className="text-[10px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Ofertas</p></div><h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#1A1A1A]">En descuento</h2></div>
          <Link href="/tienda?has_discount=true" className="hidden sm:inline text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] pb-0.5">Ver todo</Link>
        </div>
        <div className="relative group/slider">
          <button onClick={() => scroll(-1)} className="hidden md:flex absolute left-1 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#E8E4DD] shadow-md text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <button onClick={() => scroll(1)} className="hidden md:flex absolute right-1 top-[42%] -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#E8E4DD] shadow-md text-[#1A1A1A] hover:bg-[#C8972E] hover:text-white transition-all opacity-0 group-hover/slider:opacity-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
          <div ref={ref} className="flex gap-3 overflow-x-auto hide-scrollbar px-5 sm:px-8 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
            {products.map((p) => <div key={p.id} className="flex-shrink-0 w-[160px] sm:w-[calc(25%-9px)] snap-start"><FeaturedCard product={p} /></div>)}
          </div>
        </div>
        <div className="sm:hidden text-center mt-5 px-5"><Link href="/tienda?has_discount=true" className="inline-block text-[11px] font-bold tracking-[0.1em] uppercase text-[#6B6560] border border-[#E8E4DD] px-6 py-2.5">Ver todo</Link></div>
      </div>
    </section>
  );
}