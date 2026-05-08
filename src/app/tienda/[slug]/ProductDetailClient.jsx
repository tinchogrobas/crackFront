'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, ChevronRight, Award, Truck, BadgeCheck, PackageCheck, ChevronRight as ChevronSep } from 'lucide-react';
import ConditionBadge from '@/components/ui/ConditionBadge';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { getPaymentConfig } from '@/lib/api';
import { initProductZoom } from '@/lib/productZoom';
import toast from 'react-hot-toast';

export default function ProductDetailClient({ product }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [descOpen, setDescOpen] = useState(false);
  const [suggestedIndex, setSuggestedIndex] = useState(0);
  const [cashDiscount, setCashDiscount] = useState({ enabled: false, percent: 0 });
  const addToCart = useCartStore((s) => s.addToCart);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    getPaymentConfig()
      .then((data) => {
        if (data?.cash_discount_enabled) {
          setCashDiscount({ enabled: true, percent: Number(data.cash_discount_percent || 0) });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSuggestedIndex(0);
  }, [product?.id]);

  useEffect(() => {
    const cleanup = initProductZoom();
    return cleanup;
  }, [product?.id, selectedImage]);

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);
  const hasDiscount = product.discount_percent > 0;
  const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
  const conditionName = product.condition ? (typeof product.condition === 'object' ? product.condition.name : product.condition) : null;
  const certEntity = product.certification_entity ? (typeof product.certification_entity === 'object' ? product.certification_entity.abbreviation || product.certification_entity.name : product.certification_entity) : null;
  const hasBadges = Boolean(certEntity || conditionName);
  const maxQty = getProductMaxQuantity(product);
  const inStock = product.in_stock !== false && maxQty > 0;
  const suggestedProducts = Array.isArray(product.suggested_products) ? product.suggested_products.slice(0, 3) : [];
  const hasSuggested = suggestedProducts.length > 0;
  const activeSuggested = hasSuggested ? suggestedProducts[suggestedIndex] : null;

  const nextSuggested = () => {
    if (!hasSuggested) return;
    setSuggestedIndex((prev) => (prev + 1) % suggestedProducts.length);
  };

  const prevSuggested = () => {
    if (!hasSuggested) return;
    setSuggestedIndex((prev) => (prev - 1 + suggestedProducts.length) % suggestedProducts.length);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || images.length <= 1) return;

    const preloaders = images.slice(1).map((src) => {
      const image = new window.Image();
      image.src = src;
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.src = '';
      });
    };
  }, [product?.id]);

  const handleAddToCart = () => {
    const success = addToCart(product, quantity);
    if (success) openCart();
    else toast.error(inStock ? 'Stock máximo alcanzado' : 'Sin stock');
  };

  return (
    <div className="pt-10 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Image — with 3D tilt and contact shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative w-full max-w-[520px] lg:max-w-[700px]">
              <div
                className="relative w-full rounded-xl flex items-end justify-center"
                style={{ aspectRatio: '1/1', paddingBottom: '6%' }}
              >
                {images[selectedImage] ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pb-7 md:pb-10 lg:pb-5">
                      <div className="w-full h-full px-[6%] pt-[6%] pb-[18%] md:px-[10%] md:pt-[8%] md:pb-[23%] lg:px-[3%] lg:pt-[3%] lg:pb-[9%]">
                        <div className="relative w-full h-full">
                          <Image
                            src={images[selectedImage]}
                            alt={product.name}
                            fill
                            className="object-contain zoom-image"
                            data-zoom-src={images[selectedImage]}
                            sizes="(max-width: 1024px) 100vw, 700px"
                            priority
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="relative pointer-events-none z-10 translate-y-4 md:translate-y-0 lg:translate-y-14"
                      style={{
                        width: '50%',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'radial-gradient(ellipse at center, rgba(160,100,0,0.85) 0%, rgba(200,151,46,0.55) 35%, rgba(200,151,46,0.2) 65%, transparent 100%)',
                        filter: 'blur(6px)',
                      }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag size={48} className="text-[#6B6560]/20" />
                  </div>
                )}
                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-[#C8972E] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm shadow-md z-20">
                    -{product.discount_percent}%
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-4 lg:mt-20 justify-center">
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
            {hasBadges && (
              <div className="mb-4 flex flex-wrap gap-2">
                {certEntity && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-sm font-medium">
                    <Award size={12} />{certEntity} {product.certification_grade?.grade ?? product.certification_grade}
                  </span>
                )}
                {conditionName && (
                  <ConditionBadge conditionName={conditionName} />
                )}
              </div>
            )}

            {/* Price */}
            {(() => {
              const basePrice = parseFloat(product.final_price || product.price_ars || 0);
              const cashPrice = cashDiscount.enabled && cashDiscount.percent > 0
                ? basePrice * (1 - cashDiscount.percent / 100)
                : null;

              return (
                <div className="mb-5 flex flex-col gap-5">
                  <div className="flex flex-col items-start gap-2 text-left">
                    {hasDiscount ? (
                      <>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="text-3xl font-black leading-none gradient-text-shimmer"
                        >
                          {formatPrice(product.final_price)}
                        </motion.span>
                        <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-2">
                          <span className="text-lg font-medium text-[#6B6560]/45 line-through">{formatPrice(product.price_ars)}</span>
                          <span className="inline-flex items-center rounded-full bg-[#C8972E]/10 px-2.5 py-1 text-[12px] font-bold text-[#C8972E]">-{product.discount_percent}%</span>
                        </div>
                      </>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-3xl font-black leading-none gradient-text-shimmer"
                      >
                        {formatPrice(basePrice)}
                      </motion.span>
                    )}
                  </div>

                  {cashPrice && inStock && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="flex items-center justify-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-left"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-green-700">
                          Efectivo · Transferencia · Crypto
                        </p>
                        <div className="flex flex-wrap items-center justify-start gap-x-2 gap-y-1.5">
                          <span className="text-xl font-black leading-none text-green-700">{formatPrice(cashPrice)}</span>
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[12px] font-bold text-green-600">
                            -{cashDiscount.percent}% OFF
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            <p className="text-[13px] mb-6">
              {inStock ? (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-green-600">En stock{product.stock_quantity ? ` · ${product.stock_quantity} disponibles` : ''}</span></span>
              ) : (
                <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-600">Sin stock</span></span>
              )}
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-[#E8E4DD] to-transparent mb-6" />

            {product.description && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setDescOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-3 text-left"
                >
                  <span className="text-[13px] font-semibold tracking-[0.05em] uppercase text-[#3A3530]">Descripción</span>
                  <motion.svg
                    animate={{ rotate: descOpen ? 0 : -90 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {descOpen && (
                    <motion.div
                      key="desc"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-4 text-[13px] text-[#6B6560] leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {inStock ? (
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
            ) : (
              <div className="mb-8 p-4 bg-[#FAFAF7] border border-[#E8E4DD] rounded-sm">
                <p className="text-[12px] text-[#6B6560] mb-3">
                  Este producto está temporalmente agotado. Explorá productos similares en la tienda.
                </p>
                <Link
                  href="/tienda"
                  className="inline-flex items-center gap-2 text-[12px] font-bold text-[#C8972E] hover:text-[#B8851F] transition-colors"
                >
                  Ver tienda →
                </Link>
              </div>
            )}

            {hasSuggested && (
              <div className="mb-8">
                <div className="h-px bg-gradient-to-r from-transparent via-[#E8E4DD] to-transparent mb-6" />
                <h3 className="text-[13px] font-bold tracking-[0.08em] uppercase text-[#2F2A25] mb-4">
                  Completa tu pedido
                </h3>

                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSuggested.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="flex items-center gap-4 bg-white border border-[#E8E4DD] rounded-sm p-3"
                    >
                      <Link
                        href={`/tienda/${activeSuggested.slug}`}
                        className="relative w-20 h-24 flex-shrink-0 bg-[#FAFAF7] rounded-sm overflow-hidden border border-[#F0ECE5] hover:border-[#C8972E]/30 transition-colors"
                      >
                        {activeSuggested.image_url ? (
                          <Image
                            src={activeSuggested.image_url}
                            alt={activeSuggested.name}
                            fill
                            className="object-contain p-1.5"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={18} className="text-[#6B6560]/20" />
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#C8972E] font-semibold mb-0.5 truncate">
                          {activeSuggested.category}
                        </p>
                        <Link href={`/tienda/${activeSuggested.slug}`} className="no-underline">
                          <p className="text-[13px] font-bold text-[#2F2A25] leading-snug line-clamp-2 hover:text-[#C8972E] transition-colors">
                            {activeSuggested.name}
                          </p>
                        </Link>
                        <p className="text-[15px] font-black text-[#2F2A25] mt-1">
                          {formatPrice(activeSuggested.final_price || activeSuggested.price_ars)}
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const ok = addToCart(activeSuggested, 1);
                          if (ok) {
                            toast.success('Agregado al carrito');
                          } else {
                            toast.error('Stock máximo alcanzado');
                          }
                        }}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm border border-[#E8E4DD] bg-[#FAFAF7] text-[#2F2A25] hover:border-[#C8972E] hover:text-[#C8972E] transition-colors"
                        aria-label="Agregar al carrito"
                      >
                        <ShoppingBag size={16} />
                      </motion.button>
                    </motion.div>
                  </AnimatePresence>

                  {suggestedProducts.length > 1 && (
                    <div className="flex items-center justify-between mt-3">
                      <button
                        type="button"
                        onClick={prevSuggested}
                        className="w-7 h-7 flex items-center justify-center text-[#6B6560]/50 hover:text-[#C8972E] transition-colors"
                        aria-label="Anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {suggestedProducts.map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSuggestedIndex(index)}
                            className={`rounded-full transition-all duration-300 ${index === suggestedIndex ? 'w-6 h-[3px] bg-[#C8972E]' : 'w-4 h-[3px] bg-[#D4CFC6] hover:bg-[#B8B3AB]'}`}
                            aria-label={`Ver sugerido ${index + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={nextSuggested}
                        className="w-7 h-7 flex items-center justify-center text-[#6B6560]/50 hover:text-[#C8972E] transition-colors"
                        aria-label="Siguiente"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
