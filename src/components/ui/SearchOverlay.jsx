'use client';
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { imgProps } from '@/lib/imageProps';
import Link from 'next/link';
import { searchProducts, getFeaturedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';
import { trackSearch } from '@/lib/analytics';

// Atajos de la columna izquierda. A propósito NO repiten TCG ni categorías
// (eso ya está en el megamenú de Tienda): son filtros que el menú no tiene.
const EXPLORE_LINKS = [
  { name: 'Ofertas', href: '/tienda?has_discount=true' },
  { name: 'Últimos ingresos', href: '/tienda' },
];

// Si el layout no pudo traer las certificadoras, salen las principales.
const FALLBACK_CERTIFICATIONS = ['BGS', 'CGC', 'PSA'].map((abbr) => ({
  name: abbr,
  href: `/tienda?category=slabs&certification_entity=${abbr}`,
}));

// Mismo tamaño que los bloques del megamenú: columna de 220px + grilla de 3.
const CARD_SIZES = '(max-width: 768px) 50vw, 26vw';

const categoryName = (product) =>
  typeof product.category === 'object' ? product.category?.name : product.category;

/**
 * Card de producto con el mismo lenguaje que los bloques del megamenú de
 * Tienda (.mm-image): fondo crema, borde fino, foto contenida y zoom lento.
 */
function SearchCard({ product, delay, sizes, onSelect, cardRef, className = '', role }) {
  return (
    <button
      ref={cardRef}
      onClick={() => onSelect(product.slug)}
      className={`lupita-item search-card text-left ${className}`}
      style={{ transitionDelay: delay }}
      role={role}
    >
      <div className="lupita-image search-card__media" style={{ transitionDelay: delay }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(product.image_url, 'card', { sizes })} alt={product.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Search size={20} className="text-[#6B6560]/15" />
          </div>
        )}
      </div>
      <div className="search-card__body">
        <p className="search-card__category">{categoryName(product)}</p>
        <p className="search-card__name">{product.name}</p>
        <p className="search-card__price">{formatPrice(product.final_price || product.price_ars)}</p>
      </div>
    </button>
  );
}

export default function SearchOverlay({ isOpen, onClose, menu = null }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const panelRef = useRef(null);
  const [firstCardEl, setFirstCardEl] = useState(null);
  const [rowHeight, setRowHeight] = useState(0);

  // Measure one card's height so the results container shows exactly one row,
  // letting scroll-snap step row-by-row.
  useLayoutEffect(() => {
    if (!firstCardEl) {
      setRowHeight(0);
      return;
    }
    const measure = () => setRowHeight(firstCardEl.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(firstCardEl);
    return () => ro.disconnect();
  }, [firstCardEl]);

  // Prefetch popular products on mount so the first open is warm
  // (data + DOM + image decode already done behind the hidden panel)
  useEffect(() => {
    setLoadingPopular(true);
    getFeaturedProducts()
      .then((data) => setPopularProducts(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingPopular(false));
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  // Debounced search
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(val);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  const goToProduct = (slug) => {
    handleClose();
    router.push(`/tienda/${slug}`);
  };

  const goToSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Solo la busqueda confirmada, no cada tecla del autocomplete.
    trackSearch(query.trim(), results.length);
    handleClose();
    router.push(`/tienda?search=${encodeURIComponent(query.trim())}`);
  };

  const handleLinkClick = () => {
    handleClose();
  };

  const hasQuery = query.trim().length >= 2;
  const showResults = hasQuery && !loading && results.length > 0;
  const showEmpty = hasQuery && !loading && results.length === 0;
  const showInitial = !hasQuery;

  const linkGroups = [
    { title: 'Explorar', links: EXPLORE_LINKS },
    {
      title: 'Slabs por certificadora',
      links: menu?.certifications?.length ? menu.certifications : FALLBACK_CERTIFICATIONS,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[5999] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Panel dropdown */}
      <div
        ref={panelRef}
        className={`lupita-panel fixed top-0 left-0 right-0 z-[6000] ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda"
      >
        <div className="bg-white border-b border-[#E8E4DD] shadow-xl relative">
          <button
            onClick={handleClose}
            className="lupita-item absolute top-4 right-5 sm:right-8 text-[#6B6560] hover:text-[#1A1A1A] transition-colors z-10"
            style={{ transitionDelay: '0ms' }}
            aria-label="Cerrar búsqueda"
          >
            <X size={20} />
          </button>
          <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 pt-5 pb-8">
            {/* Search form */}
            <form
              onSubmit={goToSearch}
              className="lupita-item flex items-center border-b border-[#E8E4DD] focus-within:border-[#C8972E] pb-3 gap-3 mb-7 pr-10 transition-colors"
              style={{ transitionDelay: '50ms' }}
            >
              <Search size={20} className="text-[#C8972E] flex-shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={handleChange}
                placeholder="Buscar productos..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[24px] sm:text-[34px] leading-none font-[family-name:var(--font-bebas)] font-extrabold uppercase text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 tracking-[0.02em] [&::-webkit-search-cancel-button]:appearance-none"
                aria-label="Buscar productos"
                aria-autocomplete="list"
                aria-controls="search-results"
                autoComplete="off"
              />
              <div className="flex items-center gap-3 flex-shrink-0">
                {loading && (
                  <Loader2 size={18} className="animate-spin text-[#C8972E]" />
                )}
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-[#6B6560] hover:text-[#C8972E] transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </form>

            {/* Misma grilla que el megamenú de Tienda: atajos a la izquierda
                y tres bloques del mismo tamaño a la derecha. */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
              <nav
                aria-label="Atajos de la tienda"
                className={`md:flex-[0_0_220px] gap-x-6 ${hasQuery ? 'hidden md:block' : 'grid grid-cols-2 md:block'}`}
              >
                {linkGroups.map((group, groupIndex) => (
                  <div
                    key={group.title}
                    className={`lupita-item ${groupIndex > 0 ? 'md:mt-[22px]' : ''}`}
                    style={{ transitionDelay: `${100 + groupIndex * 50}ms` }}
                  >
                    <h3 className="mm-eyebrow">{group.title}</h3>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} onClick={handleLinkClick} className="search-link">
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div
                id="search-results"
                className="flex-1 min-w-0 max-h-[calc(100dvh-150px)] overflow-y-auto hide-scrollbar"
                role="region"
                aria-live="polite"
                aria-label="Resultados de búsqueda"
              >
                {/* Loading state */}
                {loading && hasQuery && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-[#C8972E]/50" />
                  </div>
                )}

                {/* Productos populares */}
                {showInitial && (
                  <>
                    <h3 className="lupita-item mm-eyebrow" style={{ transitionDelay: '150ms' }}>
                      Productos populares
                    </h3>
                    {loadingPopular ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-[#C8972E]/30" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {popularProducts.map((product, idx) => (
                          <SearchCard
                            key={product.id}
                            product={product}
                            delay={`${200 + idx * 100}ms`}
                            sizes={CARD_SIZES}
                            onSelect={goToProduct}
                            className={idx >= 2 ? 'hidden md:block' : ''}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Search results: una fila de 3 a la vista, el resto con scroll por fila */}
                {showResults && (
                  <>
                    <h3 className="lupita-item mm-eyebrow" style={{ transitionDelay: '100ms' }}>
                      Productos
                    </h3>
                    <div
                      className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 snap-y snap-mandatory overflow-y-auto hide-scrollbar overscroll-contain"
                      style={rowHeight ? { maxHeight: `${rowHeight}px` } : undefined}
                    >
                      {results.slice(0, 9).map((product, idx) => (
                        <SearchCard
                          key={product.id}
                          product={product}
                          delay={`${150 + idx * 50}ms`}
                          sizes={CARD_SIZES}
                          onSelect={goToProduct}
                          cardRef={idx === 0 ? setFirstCardEl : undefined}
                          className="snap-start"
                          role="option"
                        />
                      ))}
                    </div>

                    {/* Link to full results */}
                    <div
                      className="lupita-item mt-5 pt-4 border-t border-[#E8E4DD] text-center"
                      style={{ transitionDelay: `${150 + Math.min(results.length, 9) * 50}ms` }}
                    >
                      <button
                        onClick={goToSearch}
                        className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8a847e] hover:text-[#1A1A1A] transition-colors"
                      >
                        Ver todos los resultados para &quot;{query}&quot; →
                      </button>
                    </div>
                  </>
                )}

                {/* Empty state */}
                {showEmpty && (
                  <div className="lupita-item text-center py-10" style={{ transitionDelay: '100ms' }}>
                    <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8a847e]">
                      No se encontraron resultados para &quot;{query}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
