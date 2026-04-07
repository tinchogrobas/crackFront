'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Award, Truck, BadgeCheck, PackageCheck } from 'lucide-react';
import ConditionBadge from '@/components/ui/ConditionBadge';
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
      <div className="pt-28 pb-20 max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-[#E8E4DD]/60 animate-pulse rounded-lg" />
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
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <Link href="/tienda" className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6560]/60 hover:text-[#1A1A1A] transition-colors mb-10 group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Image — with 3D tilt and contact shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center sticky top-28"
          >
            <div className="relative w-full max-w-[420px]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                {images[selectedImage] ? (
                  <Image src={images[selectedImage]} alt={product.name} fill className="object-cover rounded-lg" sizes="(max-width: 1024px) 100vw, 420px" priority />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={48} className="text-[#6B6560]/20" /></div>
                )}
                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-[#C8972E] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm shadow-md z-20">-{product.discount_percent}%</span>
                )}
              </div>

              {/* Contact shadow — golden ground shadow */}
              <div
                className="mx-auto pointer-events-none"
                style={{
                  marginTop: '14px',
                  width: '80%',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center, rgba(200,151,46,0.5) 0%, rgba(200,151,46,0.25) 35%, rgba(200,151,46,0.08) 65%, transparent 100%)',
                  filter: 'blur(2px)',
                }}
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-20 overflow-hidden rounded border-2 transition-all ${selectedImage === i ? 'border-[#C8972E] shadow-md' : 'border-[#E8E4DD] hover:border-[#D4CFC6]'}`}>
                    <div className="relative w-full h-full bg-white"><Image src={img} alt="" fill className="object-contain p-1.5" sizes="64px" /></div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col">
            <p className="text-[11px] tracking-[0.2em] text-[#6B6560]/60 uppercase mb-3">
              {product.tcg?.name} — {categoryName}
            </p>
            <div className="overflow-hidden mb-5">
              <motion.h1
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl sm:text-3xl font-black tracking-[-0.02em] text-[#3A3530]"
              >
                {product.name}
              </motion.h1>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {certEntity && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-sm font-medium">
                  <Award size={12} />{certEntity} {product.certification_grade?.grade ?? product.certification_grade}
                </span>
              )}
              {conditionName && (
                <ConditionBadge conditionName={conditionName} />
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              {hasDiscount ? (
                <>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-3xl font-black gradient-text-shimmer"
                  >
                    {formatPrice(product.final_price)}
                  </motion.span>
                  <span className="text-lg text-[#6B6560]/40 line-through">{formatPrice(product.price_ars)}</span>
                  <span className="text-[12px] text-[#C8972E] font-bold bg-[#C8972E]/10 px-2 py-0.5 rounded">-{product.discount_percent}%</span>
                </>
              ) : (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-3xl font-black gradient-text-shimmer"
                >
                  {formatPrice(product.final_price || product.price_ars)}
                </motion.span>
              )}
            </div>

            <p className="text-[13px] mb-6">
              {product.in_stock !== false ? (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-green-600">En stock{product.stock_quantity ? ` · ${product.stock_quantity} disponibles` : ''}</span></span>
              ) : (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-600">Sin stock</span></span>
              )}
            </p>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#E8E4DD] to-transparent mb-6" />

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
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold py-4 px-8 hover:bg-[#B8851F] transition-colors flex items-center justify-center gap-2 rounded-sm shadow-lg shadow-[#C8972E]/20"
                >
                  <ShoppingBag size={15} />
                  Agregar al carrito
                </motion.button>
              </div>
            )}

            {/* Trust badges — redesigned with icons */}
            <div className="mt-auto pt-8 border-t border-[#E8E4DD] grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: 'Envío seguro', sub: 'A todo el país' },
                { icon: BadgeCheck, label: 'Originales', sub: '100% auténticas' },
                { icon: PackageCheck, label: 'Protección', sub: 'Embalaje premium' },
              ].map((b) => (
                <div key={b.label} className="text-center flex flex-col items-center gap-1.5">
                  <b.icon size={18} className="text-[#C8972E]" />
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
