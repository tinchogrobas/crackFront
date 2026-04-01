'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Shield, Award } from 'lucide-react';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { getProductBySlug } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }) {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    getProductBySlug(slug)
      .then((data) => setProduct(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-28 pb-20 max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-[#E8E4DD]/60 animate-pulse" />
          <div className="space-y-4 pt-4">
            <div className="h-3 bg-[#E8E4DD]/60 rounded w-24 animate-pulse" />
            <div className="h-8 bg-[#E8E4DD]/60 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-[#E8E4DD]/60 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-28 pb-20 text-center min-h-screen flex flex-col items-center justify-center">
        <p className="text-[#6B6560]/60 mb-4">Producto no encontrado</p>
        <Link href="/tienda" className="text-[12px] text-[#6B6560] hover:text-[#1A1A1A] underline">Volver a la tienda</Link>
      </div>
    );
  }

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);
  const hasDiscount = product.discount_percent > 0;
  const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
  const conditionName = product.condition ? (typeof product.condition === 'object' ? product.condition.name : product.condition) : null;
  const certEntity = product.certification_entity ? (typeof product.certification_entity === 'object' ? product.certification_entity.abbreviation || product.certification_entity.name : product.certification_entity) : null;
  const maxQty = getProductMaxQuantity(product);
  const canAddToCart = maxQty > 0;

  const handleAddToCart = () => {
    const success = addToCart(product, quantity);
    if (success) openCart();
    else toast.error(canAddToCart ? 'Stock máximo alcanzado' : 'Sin stock');
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <Link href="/tienda" className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6560]/60 hover:text-[#1A1A1A] transition-colors mb-10 group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="relative aspect-[3/4] bg-white overflow-hidden border border-[#E8E4DD] shadow-sm">
              {images[selectedImage] ? (
                <Image src={images[selectedImage]} alt={product.name} fill className="object-contain p-10 sm:p-16" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={48} className="text-[#6B6560]/20" /></div>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-[#C8972E] text-white text-[11px] font-bold px-3 py-1.5">-{product.discount_percent}%</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-24 overflow-hidden border transition-colors ${selectedImage === i ? 'border-[#C8972E]' : 'border-[#E8E4DD] hover:border-[#D4CFC6]'}`}>
                    <div className="relative w-full h-full bg-white"><Image src={img} alt="" fill className="object-contain p-2" sizes="80px" /></div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex flex-col">
            <p className="text-[11px] tracking-[0.2em] text-[#6B6560]/60 uppercase mb-3">
              {product.tcg?.name} — {categoryName}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-5">{product.name}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {certEntity && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 font-medium">
                  <Award size={12} />{certEntity} {product.certification_grade?.grade ?? product.certification_grade}
                </span>
              )}
              {conditionName && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 font-medium">
                  <Shield size={12} />{conditionName}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-black text-[#1A1A1A]">{formatPrice(product.final_price)}</span>
                  <span className="text-lg text-[#6B6560]/40 line-through">{formatPrice(product.price_ars)}</span>
                  <span className="text-[12px] text-[#C8972E] font-bold">-{product.discount_percent}%</span>
                </>
              ) : (
                <span className="text-3xl font-black text-[#1A1A1A]">{formatPrice(product.final_price || product.price_ars)}</span>
              )}
            </div>

            <p className="text-[13px] mb-6">
              {product.in_stock !== false ? (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-green-600">En stock{product.stock_quantity ? ` · ${product.stock_quantity} disponibles` : ''}</span></span>
              ) : (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-600">Sin stock</span></span>
              )}
            </p>

            {product.description && (
              <div className="product__block product__block--accordion block-padding mb-8">
                <details className="accordion" open>
                  <summary className="accordion__title">
                    Descripción
                    <svg className="icon icon-plus" viewBox="0 0 24 24" fill="none">
                      <path d="M6 12h6m6 0h-6m0 0V6m0 6v6" stroke="#000" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <svg className="icon icon-minus" viewBox="0 0 24 24" fill="none">
                      <path d="M6 12h12" stroke="#000" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </summary>
                  <div className="accordion__body">
                    <div className="accordion__content" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </div>
                </details>
              </div>
            )}

            {canAddToCart && (
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {maxQty > 1 && (
                  <QuantitySelector quantity={quantity} onIncrease={() => setQuantity(Math.min(quantity + 1, maxQty))} onDecrease={() => setQuantity(Math.max(quantity - 1, 1))} max={maxQty} />
                )}
                <button onClick={handleAddToCart} className="flex-1 bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold py-4 px-8 hover:bg-[#B8851F] transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                  <ShoppingBag size={15} />
                  Agregar al carrito
                </button>
              </div>
            )}

            {/* Trust */}
            <div className="mt-auto pt-8 border-t border-[#E8E4DD] grid grid-cols-3 gap-4">
              {[
                { label: 'Envío seguro', sub: 'A todo el país' },
                { label: 'Originales', sub: '100% auténticas' },
                { label: 'Protección', sub: 'Embalaje premium' },
              ].map((b) => (
                <div key={b.label} className="text-center">
                  <p className="text-[11px] font-medium text-[#6B6560]">{b.label}</p>
                  <p className="text-[10px] text-[#6B6560]/50">{b.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
