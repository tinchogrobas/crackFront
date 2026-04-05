'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { searchProducts, getFeaturedProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';

const POPULAR_LINKS = [
  { label: 'Singles', href: '/tienda?category=singles' },
  { label: 'Slabs', href: '/tienda?category=slabs' },
  { label: 'Sellados', href: '/tienda?category=sellados' },
  { label: 'Accesorios', href: '/tienda?category=accesorios' },
  { label: 'Mystery Packs', href: '/tienda?category=mystery-packs' },
  { label: 'Ver todo', href: '/tienda' },
];

export default function SearchOverlay({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const panelRef = useRef(null);

  // Load popular products on first open
  useEffect(() => {
    if (isOpen && popularProducts.length === 0 && !loadingPopular) {
      setLoadingPopular(true);
      getFeaturedProducts()
        .then((data) => setPopularProducts(data.slice(0, 4)))
        .catch(() => {})
        .finally(() => setLoadingPopular(false));
    }
  }, [isOpen, popularProducts.length, loadingPopular]);

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

  const categoryName = (product) =>
    typeof product.category === 'object' ? product.category.name : product.category;

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
        className={`fixed top-0 left-0 right-0 z-[6000] transition-all duration-500 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 visible'
            : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda"
      >
        <div className="bg-[#FAFAF7] border-b border-[#E8E4DD] shadow-xl">
          <div className="w-full max-w-[1200px] mx-auto px-5 sm:px-8 pt-6 pb-6">
            {/* Header: logo + close */}
            <div className="flex items-center justify-between mb-5">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="font-display text-lg font-bold tracking-[0.3em] text-[#1A1A1A] hover:text-[#C8972E] transition-colors"
              >
                CRACK
              </Link>
              <button
                onClick={handleClose}
                className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
                aria-label="Cerrar búsqueda"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search form */}
            <form
              onSubmit={goToSearch}
              className="flex items-center border-b-2 border-[#C8972E]/40 focus-within:border-[#C8972E] pb-2 gap-3 mb-5 transition-colors"
            >
              <Search size={20} className="text-[#C8972E] flex-shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={handleChange}
                placeholder="Buscar productos..."
                className="flex-1 bg-transparent outline-none text-[20px] sm:text-[28px] font-[family-name:var(--font-bebas)] font-extrabold text-[#1A1A1A] placeholder:text-[#6B6560]/30 tracking-wide"
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

            {/* Results area */}
            <div
              id="search-results"
              className="max-h-[60vh] overflow-y-auto hide-scrollbar"
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

              {/* Initial state - popular content */}
              {showInitial && (
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.5fr)_minmax(0,3.5fr)] gap-5 md:gap-8">
                  {/* Sidebar - popular links */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C8972E] mb-3">
                      Populares
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {POPULAR_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={handleLinkClick}
                            className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B6560] hover:text-[#1A1A1A] transition-colors no-underline block py-0.5"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Popular products */}
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C8972E] mb-3">
                      Productos populares
                    </h3>
                    {loadingPopular ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-[#C8972E]/30" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {popularProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => goToProduct(product.slug)}
                            className="text-left group/card"
                          >
                            <div className="aspect-square bg-[#F5F1EA] rounded-lg relative overflow-hidden border border-[#E8E4DD]/60">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  className="object-contain p-3 group-hover/card:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 640px) 50vw, 25vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Search size={20} className="text-[#6B6560]/15" />
                                </div>
                              )}
                            </div>
                            <div className="pt-2 px-0.5">
                              <p className="text-[12px] font-semibold text-[#1A1A1A] truncate group-hover/card:text-[#C8972E] transition-colors">
                                {product.name}
                              </p>
                              <p className="text-[10px] uppercase tracking-[0.1em] text-[#6B6560]/60 truncate">
                                {categoryName(product)}
                              </p>
                              <p className="text-[13px] font-bold text-[#C8972E] mt-0.5">
                                {formatPrice(product.final_price || product.price_ars)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search results */}
              {showResults && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#C8972E] mb-3">
                    Productos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {results.slice(0, 8).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => goToProduct(product.slug)}
                        className="text-left group/card"
                        role="option"
                      >
                        <div className="aspect-square bg-[#F5F1EA] rounded-lg relative overflow-hidden border border-[#E8E4DD]/60">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-contain p-3 group-hover/card:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Search size={20} className="text-[#6B6560]/15" />
                            </div>
                          )}
                        </div>
                        <div className="pt-2 px-0.5">
                          <p className="text-[12px] font-semibold text-[#1A1A1A] truncate group-hover/card:text-[#C8972E] transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-[#6B6560]/60 truncate">
                            {categoryName(product)}
                          </p>
                          <p className="text-[13px] font-bold text-[#C8972E] mt-0.5">
                            {formatPrice(product.final_price || product.price_ars)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Link to full results */}
                  <div className="mt-5 pt-4 border-t border-[#E8E4DD] text-center">
                    <button
                      onClick={goToSearch}
                      className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B6560] hover:text-[#C8972E] transition-colors"
                    >
                      Ver todos los resultados para &quot;{query}&quot; →
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {showEmpty && (
                <div className="text-center py-10">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#6B6560]/50">
                    No se encontraron resultados para &quot;{query}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
