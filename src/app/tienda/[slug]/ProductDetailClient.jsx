'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronLeft, ChevronRight, Award, Truck, BadgeCheck, PackageCheck, ChevronRight as ChevronSep } from 'lucide-react';
import ConditionBadge from '@/components/ui/ConditionBadge';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { getPaymentConfig } from '@/lib/api';
import { initProductZoom } from '@/lib/productZoom';
import { imgProps } from '@/lib/imageProps';
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
  const categorySlug = typeof product.category === 'object' ? (product.category?.slug || '') : '';
  const isSingles = `${categorySlug} ${categoryName || ''}`.toLowerCase().includes('single');
  const conditionName = product.condition ? (typeof product.condition === 'object' ? product.condition.name : product.condition) : null;
  const certEntity = product.certification_entity ? (typeof product.certification_entity === 'object' ? product.certification_entity.abbreviation || product.certification_entity.name : product.certification_entity) : null;
  const rawGrade = product.certification_grade?.grade ?? product.certification_grade;
  const formattedGrade = rawGrade != null && rawGrade !== ''
    ? (Number.isFinite(Number(rawGrade)) ? (Number(rawGrade) % 1 === 0 ? String(parseInt(rawGrade, 10)) : String(Number(rawGrade))) : rawGrade)
    : null;
  const hasBadges = Boolean(certEntity || conditionName);
  // Datos de la carta del catálogo (TCGplayer): expansión, número, rareza e
  // idioma. Llegan anidados en el producto, no hay que pedirlos aparte.
  const catalog = product.catalog;
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
    <div className="pt-5 md:pt-8 pb-20">
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
                    <div className="absolute inset-0 flex items-center justify-center md:pb-10 lg:pb-5">
                      <div className="w-full h-full px-[6%] pt-[6%] pb-[18%] md:px-[10%] md:pt-[8%] md:pb-[23%] lg:px-[3%] lg:pt-[3%] lg:pb-[9%]">
                        <div className="relative w-full h-full">
                          {/* data-zoom-src apunta a la resolución máxima a propósito:
                              el zoom no usa la variante del srcset. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            {...imgProps(images[selectedImage], 'detail', { eager: true })}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-contain zoom-image"
                            data-zoom-src={images[selectedImage]}
                            data-is-singles={isSingles ? 'true' : undefined}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="relative w-full h-full bg-white"><img {...imgProps(img, 'thumb')} alt="" className="absolute inset-0 w-full h-full object-contain p-1.5" /></div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info — sin animación de entrada a propósito. Con SSR el HTML llega
              con el contenido visible y el browser lo pinta; si acá se declara
              un `initial: opacity 0`, al hidratar framer-motion lo apaga y lo
              vuelve a encender, y el botón de compra parpadea. */}
          <div className="flex flex-col">
            <p className="text-[11px] tracking-[0.16em] text-[#5F5A54] uppercase mb-2.5">
              {product.tcg?.name} — {categoryName}
            </p>
            <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-black leading-[1.08] sm:leading-[1.05] tracking-[-0.03em] text-[#2F2A25]">
              {product.name}
            </h1>

            {/* Badges */}
            {hasBadges && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {certEntity && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] bg-[#2F2A25] text-white px-3 py-1.5 rounded-full font-bold tracking-wide">
                    <Award size={12} />{certEntity} {formattedGrade}
                  </span>
                )}
                {conditionName && (
                  <ConditionBadge conditionName={conditionName} />
                )}
              </div>
            )}

            {/* Ficha de la carta — sale del catálogo, no se carga a mano.
                Sellados y accesorios no tienen catalog, así que no se muestra.
                Las tres columnas se ajustan a su contenido y el sobrante queda al
                final de la fila, así los datos leen como un grupo en vez de
                repartirse en tercios con IDIOMA varado contra el borde derecho.
                El minmax(0,...) es lo que deja funcionar el truncate del valor. */}
            {catalog && (
              <dl className="mt-6 border-t border-[#E8E4DD] pt-6 grid grid-cols-2 sm:grid-cols-[max-content_minmax(0,max-content)_1fr] gap-x-10 gap-y-4">
                {[
                  ['Número', catalog.number],
                  ['Rareza', catalog.rarity && catalog.rarity !== 'None' ? catalog.rarity : null],
                  ['Idioma', catalog.language ? (catalog.language === 'ja' ? 'Japonés' : 'Inglés') : null],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] tracking-[0.16em] text-[#5F5A54] uppercase mb-1.5">{label}</dt>
                    {label === 'Idioma' ? (
                      <dd className="flex items-center gap-2 text-[14px] font-semibold text-[#2F2A25]">
                        <img
                          src={catalog.language === 'ja' ? '/flags/flag-jp.svg' : '/flags/flag-en.svg'}
                          alt={value}
                          width={20}
                          height={15}
                          className="w-5 h-[15px] rounded-[3px] object-cover shadow-sm ring-1 ring-black/5"
                        />
                        {value}
                      </dd>
                    ) : (
                      <dd className="text-[14px] font-semibold text-[#2F2A25] truncate" title={value}>{value}</dd>
                    )}
                  </div>
                ))}
              </dl>
            )}

            {/* Price */}
            {(() => {
              const basePrice = parseFloat(product.final_price || product.price_ars || 0);
              const cashPrice = cashDiscount.enabled && cashDiscount.percent > 0
                ? basePrice * (1 - cashDiscount.percent / 100)
                : null;

              return (
                <div className="mt-6 border-t border-[#E8E4DD] pt-6">
                  {/* El precio va en sólido: es el dato más importante de la
                      página y el shimmer lo dejaba ilegible al pasar por el
                      punto claro del gradiente. */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <span className="text-[34px] sm:text-[38px] font-black leading-none tracking-[-0.03em] text-[#2F2A25]">
                      {formatPrice(hasDiscount ? product.final_price : basePrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-[16px] font-medium text-[#6B6560]/45 line-through">{formatPrice(product.price_ars)}</span>
                        <span className="inline-flex items-center rounded-full bg-[#C8972E]/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#B8851F]">-{product.discount_percent}%</span>
                      </>
                    )}
                  </div>

                  {cashPrice && inStock && (
                    <p className="mt-3 text-[13px] leading-relaxed text-[#6B6560]">
                      <span className="font-black text-[#2F2A25]">{formatPrice(cashPrice)}</span>
                      {' '}con efectivo, transferencia o crypto
                      <span className="ml-1.5 font-bold text-green-600">-{cashDiscount.percent}%</span>
                    </p>
                  )}

                  <p className="mt-3 text-[12px]">
                    {inStock ? (
                      <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[#6B6560]">En stock{product.stock_quantity ? ` · ${product.stock_quantity} disponibles` : ''}</span></span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-600">Sin stock</span></span>
                    )}
                  </p>
                </div>
              );
            })()}

            {inStock ? (
              <div className="flex items-stretch gap-3 mt-6">
                {maxQty > 1 && (
                  <QuantitySelector quantity={quantity} onIncrease={() => setQuantity(Math.min(quantity + 1, maxQty))} onDecrease={() => setQuantity(Math.max(quantity - 1, 1))} max={maxQty} />
                )}
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 min-w-0 bg-[#C8972E] text-white text-[12px] sm:text-[13px] tracking-[0.06em] sm:tracking-[0.12em] uppercase font-bold py-[18px] px-4 sm:px-8 hover:bg-[#B8851F] transition-colors flex items-center justify-center gap-2 sm:gap-2.5 rounded-md shadow-lg shadow-[#C8972E]/20"
                >
                  <ShoppingBag size={16} />
                  Agregar al carrito
                </motion.button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-[#FAFAF7] border border-[#E8E4DD] rounded-lg">
                <p className="text-[13px] text-[#6B6560] mb-3">
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

            {/* La descripción va debajo del CTA a propósito: arriba empujaba el
                botón de compra abajo del fold. */}
            {product.description && (
              <div className="mt-6 border-t border-[#E8E4DD]">
                <button
                  type="button"
                  onClick={() => setDescOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#2F2A25]">Descripción</span>
                  <motion.svg
                    animate={{ rotate: descOpen ? 0 : -90 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F2A25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
                      <div className="pb-5 text-[14px] text-[#6B6560] leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {hasSuggested && (
              <div className="mt-6 border-t border-[#E8E4DD] pt-6">
                <h3 className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#2F2A25] mb-4">
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
                      className="flex items-center gap-4 bg-white border border-[#E8E4DD] rounded-lg p-3"
                    >
                      <Link
                        href={`/tienda/${activeSuggested.slug}`}
                        className="relative w-20 h-24 flex-shrink-0 bg-[#FAFAF7] rounded-md overflow-hidden border border-[#F0ECE5] hover:border-[#C8972E]/30 transition-colors"
                      >
                        {activeSuggested.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            {...imgProps(activeSuggested.image_url, 'line')}
                            alt={activeSuggested.name}
                            className="absolute inset-0 w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={18} className="text-[#6B6560]/20" />
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#5F5A54] font-semibold mb-1 truncate">
                          {activeSuggested.category}
                        </p>
                        <Link href={`/tienda/${activeSuggested.slug}`} className="no-underline">
                          <p className="text-[14px] font-bold text-[#2F2A25] leading-snug line-clamp-2 hover:text-[#C8972E] transition-colors">
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
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md border border-[#E8E4DD] bg-[#FAFAF7] text-[#2F2A25] hover:border-[#C8972E] hover:text-[#C8972E] transition-colors"
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

            <div className="mt-6 pt-6 border-t border-[#E8E4DD] grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: 'Envío a todo el país' },
                { icon: BadgeCheck, label: '100% originales' },
                { icon: PackageCheck, label: 'Embalaje premium' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2 text-center">
                  <b.icon size={17} className="text-[#5F5A54]" />
                  <p className="text-[11px] leading-snug text-[#6B6560]">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
