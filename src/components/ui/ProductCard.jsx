'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Eye } from 'lucide-react';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);
  const cardRef = useRef(null);
  const canAddToCart = getProductMaxQuantity(product) > 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!canAddToCart) {
      toast.error('Sin stock');
      return;
    }
    const success = addToCart(product);
    if (success) openCart();
    else toast.error('Stock máximo alcanzado');
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  const hasDiscount = product.discount_percent > 0;
  const categoryName = typeof product.category === 'object' ? product.category.name : product.category;

  return (
    <div onClick={() => router.push(`/tienda/${product.slug}`)} className="cursor-pointer group">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative aspect-[3/4] bg-[#F8F6F2] rounded-xl overflow-hidden border border-[#E8E4DD]/80 group-hover:border-[#C8972E]/25 card-glow product-card-elevated"
      >
        {/* Subtle pattern bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8972E 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {product.image_url ? (
          <>
            <Image src={product.image_url} alt={product.name} fill className="object-contain p-8 sm:p-11 pb-20 sm:pb-24 product-image-zoom relative z-[1]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
            {/* Contact shadow — elliptical ground shadow beneath product */}
            <div className="contact-shadow" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={28} className="text-[#6B6560]/15" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-[#C8972E] text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10 discount-badge">
            -{product.discount_percent}%
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button onClick={handleAddToCart} disabled={!canAddToCart} className="w-9 h-9 bg-[#C8972E] text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#B8851F] shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed">
            <ShoppingBag size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/tienda/${product.slug}`); }} className="w-9 h-9 bg-white/90 backdrop-blur-sm text-[#1A1A1A] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 delay-75 hover:bg-white shadow-md border border-[#E8E4DD]/50">
            <Eye size={14} />
          </button>
        </div>

        {/* Bottom fade for text readability on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F8F6F2]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="mt-3.5 space-y-1 px-0.5">
        <p className="text-[10px] text-[#C8972E]/70 uppercase tracking-[0.15em] font-medium">{categoryName}</p>
        <h3 className="text-[13px] font-semibold text-[#1A1A1A]/75 truncate group-hover:text-[#1A1A1A] transition-colors duration-300">{product.name}</h3>
        <div className="flex items-center gap-2 pt-0.5">
          {hasDiscount ? (
            <>
              <span className="text-[14px] font-bold text-[#C8972E]">{formatPrice(product.final_price)}</span>
              <span className="text-[11px] text-[#6B6560]/35 line-through">{formatPrice(product.price_ars)}</span>
            </>
          ) : (
            <span className="text-[14px] font-bold text-[#1A1A1A]">{formatPrice(product.final_price || product.price_ars)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
