'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { searchProducts } from '@/lib/api';
import { formatPrice } from '@/lib/formatPrice';

export default function SearchBar({ scrolled, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounce search
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(val);
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); onClose?.(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const goToProduct = (slug) => {
    setOpen(false);
    setQuery('');
    onClose?.();
    router.push(`/tienda/${slug}`);
  };

  const goToSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    onClose?.();
    router.push(`/tienda?search=${encodeURIComponent(query.trim())}`);
  };

  const textColor = scrolled ? 'text-[#1A1A1A]' : 'text-white';
  const borderColor = scrolled ? 'border-[#E8E4DD] focus-within:border-[#C8972E]/50' : 'border-white/20 focus-within:border-[#C8972E]/60';
  const bgColor = scrolled ? 'bg-white' : 'bg-white/10 backdrop-blur-sm';
  const placeholderColor = scrolled ? 'placeholder:text-[#6B6560]/40' : 'placeholder:text-white/40';
  const iconColor = scrolled ? 'text-[#6B6560]/40' : 'text-white/40';

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <form onSubmit={goToSearch} className={`flex items-center gap-2 border rounded-lg px-3 py-2 transition-all duration-300 ${bgColor} ${borderColor}`}>
        {loading
          ? <Loader2 size={14} className={`${iconColor} animate-spin flex-shrink-0`} />
          : <Search size={14} className={`${iconColor} flex-shrink-0`} />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar..."
          className={`bg-transparent outline-none text-[13px] w-full ${textColor} ${placeholderColor}`}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}>
            <X size={13} className={iconColor} />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E4DD] rounded-xl shadow-xl z-[200] overflow-hidden">
          <ul>
            {results.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => goToProduct(product.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8F6F2] transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[#F5F1EA] rounded-lg overflow-hidden flex-shrink-0 relative border border-[#E8E4DD]">
                    {product.image_url
                      ? <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" sizes="40px" />
                      : <div className="w-full h-full" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{product.name}</p>
                    <p className="text-[10px] text-[#6B6560]/60 uppercase tracking-wider">{product.tcg} · {product.category}</p>
                  </div>
                  <span className="text-[12px] font-bold text-[#C8972E] flex-shrink-0">
                    {formatPrice(product.final_price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={goToSearch}
            className="w-full px-3 py-2.5 text-[11px] text-[#6B6560] hover:text-[#C8972E] border-t border-[#E8E4DD] text-center transition-colors tracking-wider"
          >
            Ver todos los resultados para &quot;{query}&quot; →
          </button>
        </div>
      )}
    </div>
  );
}
