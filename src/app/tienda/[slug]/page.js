'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, ChevronRight, Award, Truck, BadgeCheck, PackageCheck, ChevronRight as ChevronSep } from 'lucide-react';
import ConditionBadge from '@/components/ui/ConditionBadge';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { getProductBySlug, getPaymentConfig } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }) {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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
    getProductBySlug(slug)
      .then((data) => {
        if (data && !data.in_stock) {
          // Producto agotado - no permitir acceso
          setProduct(null);
        } else {
          setProduct(data);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setSuggestedIndex(0);
  }, [product?.id]);

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
        <p className="text-[#6B6560]/60 mb-4">Producto no encontrado o agotado</p>
        <Link href="/tienda" className="text-[12px] text-[#6B6560] hover:text-[#1A1A1A] underline">Volver a la tienda</Link>
      </div>
    );
  }

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);
  const hasDiscount = product.discount_percent > 0;
  const categorySlug = typeof product.category === 'object' ? product.category.slug : null;
  const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
  const conditionName = product.condition ? (typeof product.condition === 'object' ? product.condition.name : product.condition) : null;
  const certEntity = product.certification_entity ? (typeof product.certification_entity === 'object' ? product.certification_entity.abbreviation || product.certification_entity.name : product.certification_entity) : null;
  const maxQty = getProductMaxQuantity(product);
  const canAddToCart = maxQty > 0;
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

  const handleAddToCart = () => {
    const success = addToCart(product, quantity);
    if (success) openCart();
    else toast.error(canAddToCart ? 'Stock máximo alcanzado' : 'Sin stock');
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {/* Breadcrumb — visible + JSON-LD structured data for SEO */}
        {(() => {
          const crumbs = [
            { name: 'Inicio', href: '/' },
            { name: 'Tienda', href: '/tienda' },
          ];
          if (categoryName) {
            crumbs.push({ name: categoryName, href: `/tienda?category=${encodeURIComponent(categorySlug || categoryName)}` });
          }
          crumbs.push({ name: product.name });

          const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: crumbs.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c.name,
              ...(c.href ? { item: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}${c.href}` } : {}),
            })),
          };

          return (
            <>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
              <nav aria-label="Breadcrumb" className="mb-8">
                <ol className="flex items-center flex-wrap gap-1 text-[12px]">
                  {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                      <li key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronSep size={11} className="text-[#D4CFC6]" />}
                        {isLast ? (
                          <span className="text-[#3A3530] font-medium truncate max-w-[200px] sm:max-w-none">{crumb.name}</span>
                        ) : (
                          <Link
                            href={crumb.href}
                            className="text-[#6B6560]/60 hover:text-[#C8972E] transition-colors whitespace-nowrap"
                          >
                            {crumb.name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Image — with 3D tilt and contact shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative w-full max-w-[520px]">
              {/* Contenedor gris grande — sombra adentro, sin overflow hidden */}
              <div
                className="relative w-full rounded-xl flex items-end justify-center"
                style={{ aspectRatio: '1/1', paddingBottom: '48px' }}
              >
                {images[selectedImage] ? (
                  <>
                    {/* Imagen centrada con espacio */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '40px' }}>
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        fill
                        className="object-contain"
                        style={{ padding: '8% 10% 23%' }}
                        sizes="(max-width: 1024px) 100vw, 520px"
                        priority
                      />
                    </div>
                    {/* Sombra dorada dentro, en la parte baja */}
                    <div
                      className="relative pointer-events-none z-10"
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
            {(() => {
              const basePrice = parseFloat(product.final_price || product.price_ars || 0);
              const cashPrice = cashDiscount.enabled && cashDiscount.percent > 0
                ? basePrice * (1 - cashDiscount.percent / 100)
                : null;

              return (
                <>
                  <div className="flex items-baseline gap-3 mb-3">
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
                        {formatPrice(basePrice)}
                      </motion.span>
                    )}
                  </div>

                  {/* Descuento efectivo / transferencia / crypto */}
                  {cashPrice && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-green-200 bg-green-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-green-700 font-semibold tracking-wide uppercase mb-0.5">
                          Efectivo · Transferencia · Crypto
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-green-700">{formatPrice(cashPrice)}</span>
                          <span className="text-[12px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            -{cashDiscount.percent}% OFF
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              );
            })()}

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

            {/* Completa tu pedido — cross-sell carousel */}
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
