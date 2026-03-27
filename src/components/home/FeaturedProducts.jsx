'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { getFeaturedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

function FeaturedCard({ product, className, imgPadding = 'p-8', index = 0 }) {
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
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/tienda/${product.slug}`} className="group block">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          className={`relative ${className} bg-[#F8F6F2] rounded-xl overflow-hidden border border-[#E8E4DD]/80 group-hover:border-[#C8972E]/25 transition-all duration-500 card-glow group-hover:shadow-[0_12px_40px_rgba(200,151,46,0.1)]`}
        >
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8972E 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          {product.image_url && (
            <Image src={product.image_url} alt={product.name} fill className={`object-contain ${imgPadding} product-image-zoom relative z-0 drop-shadow-sm`} sizes="(max-width: 1024px) 100vw, 50vw" />
          )}

          {/* Discount badge */}
          {product.discount_percent > 0 && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="bg-[#C8972E] text-white text-[11px] font-bold px-3 py-1.5 rounded-md shadow-sm">
                -{product.discount_percent}%
              </span>
            </div>
          )}

          {/* Add to cart */}
          <button onClick={handleAddToCart} className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm text-[#C8972E] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#C8972E] hover:text-white shadow-md z-10 border border-[#E8E4DD]/50">
            <ShoppingBag size={16} />
          </button>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
            <p className="text-[10px] text-[#C8972E]/70 uppercase tracking-[0.15em] font-medium mb-1.5">
              {typeof product.category === 'object' ? product.category.name : product.category}
            </p>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#1A1A1A] mb-2.5 group-hover:text-[#C8972E] transition-colors duration-300">{product.name}</h3>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-[#C8972E]">{formatPrice(product.final_price)}</span>
              <span className="text-[#6B6560]/35 line-through text-sm">{formatPrice(product.price_ars)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => { getFeaturedProducts().then(setProducts); }, []);
  if (products.length === 0) return null;

  const main = products[0];
  const rest = products.slice(1, 4);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-[#C8972E]" />
              <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase font-medium">Ofertas</p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#1A1A1A]">En descuento</h2>
          </div>
          <Link href="/tienda" className="text-[12px] text-[#6B6560] hover:text-[#C8972E] transition-colors border-b border-[#E8E4DD] hover:border-[#C8972E]/40 pb-0.5 hidden sm:block">
            Ver todo →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[main, ...rest].map((product, i) => (
            <FeaturedCard key={product.id} product={product} className="aspect-[3/4]" index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
