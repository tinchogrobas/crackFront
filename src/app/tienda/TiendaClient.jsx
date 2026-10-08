'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import { trackViewItemList } from '@/lib/analytics';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { ATTRIBUTES, FINISH_FILTERS, LANGUAGES } from '@/lib/productTraits';

const sortOptions = [
  { value: '-created_at', label: 'Mas nuevos' },
  { value: 'price_usd', label: 'Precio ↑' },
  { value: '-price_usd', label: 'Precio ↓' },
  { value: 'name', label: 'Nombre A-Z' },
];

const CONDITION_ORDER = ['MT', 'NM', 'MP', 'LP', 'HP', 'DM'];

const Check = ({ label, checked, onChange }) => (
  <button onClick={onChange} className="flex items-center gap-2.5 group w-full text-left">
    <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-all ${checked ? 'bg-[#C8972E] border-[#C8972E]' : 'border-[#D4CFC6] group-hover:border-[#6B6560]'}`}>
      {checked && <span className="text-white text-[8px] font-bold">✓</span>}
    </div>
    <span className={`text-[13px] transition-colors ${checked ? 'text-[#1A1A1A]' : 'text-[#6B6560] group-hover:text-[#1A1A1A]/70'}`}>{label}</span>
  </button>
);

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-[10px] tracking-[0.2em] text-[#6B6560]/50 uppercase mb-3 font-medium">{title}</h3>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const inputCls = 'w-full bg-white border border-[#E8E4DD] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40';

export default function TiendaClient({ pageSize, initialData, initialFilters, options }) {
  const router = useRouter();
  const pathname = usePathname();
  const skipNextSearchNavRef = useRef(false);
  const lastPriceNavRef = useRef({ min: initialFilters.minPrice || '', max: initialFilters.maxPrice || '' });

  const [products, setProducts] = useState(initialData.products || []);
  const [total, setTotal] = useState(initialData.total || 0);
  const [totalPages, setTotalPages] = useState(initialData.totalPages || 1);
  const [currentPage, setCurrentPage] = useState(initialData.currentPage || 1);
  const [loading, setLoading] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(initialFilters.search || '');
  const [ordering, setOrdering] = useState(initialFilters.ordering || '-created_at');
  const [selectedTcgs, setSelectedTcgs] = useState(initialFilters.selectedTcgs || []);
  const [selectedCategories, setSelectedCategories] = useState(initialFilters.selectedCategories || []);
  const [selectedConditions, setSelectedConditions] = useState(initialFilters.selectedConditions || []);
  const [selectedCertEntities, setSelectedCertEntities] = useState(initialFilters.selectedCertEntities || []);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
  const [hasDiscount, setHasDiscount] = useState(Boolean(initialFilters.hasDiscount));
  const [selectedLanguages, setSelectedLanguages] = useState(initialFilters.selectedLanguages || []);
  const [selectedFinishes, setSelectedFinishes] = useState(initialFilters.selectedFinishes || []);
  const [selectedAttributes, setSelectedAttributes] = useState(initialFilters.selectedAttributes || []);

  const tcgs = options?.tcgs || [];
  const categoriesList = options?.categoriesList || [];
  const conditions = options?.conditions || [];
  const certEntities = options?.certEntities || [];

  /**
   * Nombre de la lista para GA4. Con los filtros adentro, el reporte de
   * rendimiento por lista muestra qué combinación convierte —"Slabs Pokémon"
   * contra "Singles NM"— y no un único cajón "Tienda" que no dice nada.
   */
  const listName = useMemo(() => {
    if (search) return `Búsqueda: ${search}`;
    const parts = [...selectedCategories, ...selectedTcgs, ...selectedConditions, ...selectedCertEntities,
      ...selectedLanguages, ...selectedFinishes, ...selectedAttributes];
    if (hasDiscount) parts.push('ofertas');
    return parts.length ? `Tienda · ${parts.join(' · ')}` : 'Tienda';
  }, [search, selectedCategories, selectedTcgs, selectedConditions, selectedCertEntities, selectedLanguages, selectedFinishes, selectedAttributes, hasDiscount]);

  // Un solo view_item_list por combinación lista+página. Sin la firma, cada
  // re-render por un filtro de UI volvería a impactar el mismo listado.
  const lastListSignatureRef = useRef('');
  useEffect(() => {
    if (loading || !products.length) return;
    const signature = `${listName}|${currentPage}|${products[0]?.id}`;
    if (lastListSignatureRef.current === signature) return;
    lastListSignatureRef.current = signature;
    trackViewItemList(products, listName);
  }, [products, listName, currentPage, loading]);

  useEffect(() => {
    skipNextSearchNavRef.current = true;
    setProducts(initialData.products || []);
    setTotal(initialData.total || 0);
    setTotalPages(initialData.totalPages || 1);
    setCurrentPage(initialData.currentPage || 1);

    setSearch(initialFilters.search || '');
    setOrdering(initialFilters.ordering || '-created_at');
    setSelectedTcgs(initialFilters.selectedTcgs || []);
    setSelectedCategories(initialFilters.selectedCategories || []);
    setSelectedConditions(initialFilters.selectedConditions || []);
    setSelectedCertEntities(initialFilters.selectedCertEntities || []);
    setSelectedLanguages(initialFilters.selectedLanguages || []);
    setSelectedFinishes(initialFilters.selectedFinishes || []);
    setSelectedAttributes(initialFilters.selectedAttributes || []);

    const incomingMin = initialFilters.minPrice || '';
    const incomingMax = initialFilters.maxPrice || '';
    // Solo pisamos los inputs de precio si la URL cambio por afuera (back/forward, limpiar filtros).
    // Si es el resultado de nuestra propia navegacion, dejamos lo que el usuario siga escribiendo.
    if (incomingMin !== lastPriceNavRef.current.min || incomingMax !== lastPriceNavRef.current.max) {
      setMinPrice(incomingMin);
      setMaxPrice(incomingMax);
    }
    lastPriceNavRef.current = { min: incomingMin, max: incomingMax };

    setHasDiscount(Boolean(initialFilters.hasDiscount));
    setLoading(false);
  }, [initialData, initialFilters]);

  const singlesCategorySlugs = useMemo(
    () => categoriesList
      .filter((category) => {
        const slug = (category?.slug || '').toLowerCase().trim();
        const name = (category?.name || '').toLowerCase().trim();
        return slug.includes('single') || name.includes('single');
      })
      .map((category) => category.slug),
    [categoriesList],
  );

  const isSinglesSelected = selectedCategories.some((slug) => singlesCategorySlugs.includes(slug));

  const sortedConditions = useMemo(() => [...conditions].sort((a, b) => {
    const left = (a?.abbreviation || '').toUpperCase().trim();
    const right = (b?.abbreviation || '').toUpperCase().trim();
    const leftIndex = CONDITION_ORDER.indexOf(left);
    const rightIndex = CONDITION_ORDER.indexOf(right);

    if (leftIndex !== -1 || rightIndex !== -1) {
      const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
      if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
    }

    return left.localeCompare(right);
  }), [conditions]);

  const activeCount = selectedTcgs.length + selectedCategories.length + selectedConditions.length + selectedCertEntities.length
    + selectedLanguages.length + selectedFinishes.length + selectedAttributes.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (hasDiscount ? 1 : 0);
  const visibleStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = total === 0 ? 0 : visibleStart + products.length - 1;

  const buildQuery = (nextState) => {
    const params = new URLSearchParams();

    if (nextState.search) params.set('search', nextState.search);
    if (nextState.ordering && nextState.ordering !== '-created_at') params.set('ordering', nextState.ordering);
    if (nextState.selectedTcgs.length) params.set('tcg', nextState.selectedTcgs.join(','));
    if (nextState.selectedCategories.length) params.set('category', nextState.selectedCategories.join(','));
    if (nextState.selectedConditions.length) params.set('condition', nextState.selectedConditions.join(','));
    if (nextState.selectedCertEntities.length) params.set('certification_entity', nextState.selectedCertEntities.join(','));
    if (nextState.minPrice) params.set('min_price', nextState.minPrice);
    if (nextState.maxPrice) params.set('max_price', nextState.maxPrice);
    if (nextState.hasDiscount) params.set('has_discount', 'true');
    if (nextState.selectedLanguages.length) params.set('language', nextState.selectedLanguages.join(','));
    if (nextState.selectedFinishes.length) params.set('finish', nextState.selectedFinishes.join(','));
    if (nextState.selectedAttributes.length) params.set('attribute', nextState.selectedAttributes.join(','));
    if (nextState.currentPage > 1) params.set('page', String(nextState.currentPage));

    return params.toString();
  };

  const buildUrl = (nextState) => {
    const query = buildQuery(nextState);
    return query ? `${pathname}?${query}` : pathname;
  };

  const prefetchPage = (pageNumber) => {
    const bounded = Math.max(1, Math.min(totalPages, pageNumber));
    const nextUrl = buildUrl({
      search,
      ordering,
      selectedTcgs,
      selectedCategories,
      selectedConditions,
      selectedCertEntities,
      minPrice,
      maxPrice,
      hasDiscount,
      selectedLanguages,
      selectedFinishes,
      selectedAttributes,
      currentPage: bounded,
    });
    router.prefetch(nextUrl);
  };

  const navigateWithState = (override, scrollToTop = false) => {
    const nextState = {
      search,
      ordering,
      selectedTcgs,
      selectedCategories,
      selectedConditions,
      selectedCertEntities,
      minPrice,
      maxPrice,
      hasDiscount,
      selectedLanguages,
      selectedFinishes,
      selectedAttributes,
      currentPage,
      ...override,
    };

    setLoading(true);
    const nextUrl = buildUrl(nextState);
    router.replace(nextUrl, { scroll: false });

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (skipNextSearchNavRef.current) {
      skipNextSearchNavRef.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      navigateWithState({ search, currentPage: 1 });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (minPrice === lastPriceNavRef.current.min && maxPrice === lastPriceNavRef.current.max) return;

    const timeoutId = setTimeout(() => {
      lastPriceNavRef.current = { min: minPrice, max: maxPrice };
      setCurrentPage(1);
      navigateWithState({ minPrice, maxPrice, currentPage: 1 });
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const navEntries = typeof window !== 'undefined' && typeof window.performance?.getEntriesByType === 'function'
      ? window.performance.getEntriesByType('navigation')
      : [];
    const navType = navEntries[0]?.type;

    if (navType === 'back_forward') {
      router.refresh();
    }

    const handlePageShow = (event) => {
      if (event.persisted) {
        router.refresh();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  useEffect(() => {
    if (totalPages <= 1) return;
    if (currentPage < totalPages) prefetchPage(currentPage + 1);
    if (currentPage > 1) prefetchPage(currentPage - 1);
  }, [currentPage, totalPages, search, ordering, selectedTcgs, selectedCategories, selectedConditions, selectedCertEntities, selectedLanguages, selectedFinishes, selectedAttributes, minPrice, maxPrice, hasDiscount]);

  const toggleValue = (arr, setArr, value, key) => {
    const next = arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
    setArr(next);
    setCurrentPage(1);
    navigateWithState({ [key]: next, currentPage: 1 });
    return next;
  };

  const toggleCategory = (slug) => {
    const nextCategories = selectedCategories.includes(slug)
      ? selectedCategories.filter((item) => item !== slug)
      : [...selectedCategories, slug];
    setSelectedCategories(nextCategories);
    setCurrentPage(1);

    const stillHasSingles = nextCategories.some((itemSlug) => singlesCategorySlugs.includes(itemSlug));
    if (!stillHasSingles) {
      setSelectedConditions([]);
      navigateWithState({ selectedCategories: nextCategories, selectedConditions: [], currentPage: 1 });
      return;
    }

    navigateWithState({ selectedCategories: nextCategories, currentPage: 1 });
  };

  const toggleCondition = (abbreviation) => {
    if (!isSinglesSelected) return;
    toggleValue(selectedConditions, setSelectedConditions, abbreviation, 'selectedConditions');
  };

  const clearAll = () => {
    skipNextSearchNavRef.current = true;
    setSearch('');
    setSelectedTcgs([]);
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedCertEntities([]);
    setSelectedLanguages([]);
    setSelectedFinishes([]);
    setSelectedAttributes([]);
    setMinPrice('');
    setMaxPrice('');
    lastPriceNavRef.current = { min: '', max: '' };
    setHasDiscount(false);
    setCurrentPage(1);
    navigateWithState({
      search: '',
      selectedTcgs: [],
      selectedCategories: [],
      selectedConditions: [],
      selectedCertEntities: [],
      selectedLanguages: [],
      selectedFinishes: [],
      selectedAttributes: [],
      minPrice: '',
      maxPrice: '',
      hasDiscount: false,
      currentPage: 1,
    });
  };

  const goToPage = (nextPage) => {
    const bounded = Math.max(1, Math.min(totalPages, nextPage));
    if (bounded === currentPage) return;
    setCurrentPage(bounded);
    navigateWithState({ currentPage: bounded }, true);
  };

  const getPageWindow = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  };

  const filters = (
    <div className="space-y-1">
      <Section title="TCG">
        {tcgs.map((t) => (
          <Check key={t.id} label={t.name} checked={selectedTcgs.includes(t.slug)} onChange={() => toggleValue(selectedTcgs, setSelectedTcgs, t.slug, 'selectedTcgs')} />
        ))}
      </Section>

      <Section title="Categoria">
        {categoriesList.map((c) => (
          <div key={c.id}>
            <Check label={c.name} checked={selectedCategories.includes(c.slug)} onChange={() => toggleCategory(c.slug)} />
            {singlesCategorySlugs.includes(c.slug) && isSinglesSelected && sortedConditions.length > 0 && (
              <div className="ml-6 mt-2 mb-1 pl-3 border-l border-[#E8E4DD] space-y-2">
                <span className="text-[10px] tracking-[0.15em] text-[#6B6560]/40 uppercase font-medium">Condicion</span>
                {sortedConditions.map((co) => (
                  <Check
                    key={co.id}
                    label={co.abbreviation}
                    checked={selectedConditions.includes(co.abbreviation)}
                    onChange={() => toggleCondition(co.abbreviation)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Idioma de la carta impresa (no el del set: hay cartas en español de sets en inglés). */}
      <Section title="Idioma">
        {Object.entries(LANGUAGES).map(([code, { label, flag }]) => (
          <div key={code} className="flex items-center gap-2">
            <Check label={label} checked={selectedLanguages.includes(code)} onChange={() => toggleValue(selectedLanguages, setSelectedLanguages, code, 'selectedLanguages')} />
            <img src={flag} alt="" width={16} height={12} className="w-4 h-3 rounded-[2px] object-cover ring-1 ring-black/5 shrink-0" />
          </div>
        ))}
      </Section>

      <Section title="Detalle">
        {FINISH_FILTERS.map(({ value, label }) => (
          <Check key={value} label={label} checked={selectedFinishes.includes(value)} onChange={() => toggleValue(selectedFinishes, setSelectedFinishes, value, 'selectedFinishes')} />
        ))}
      </Section>

      <Section title="Particularidades">
        {ATTRIBUTES.map(([field, label]) => (
          <Check key={field} label={label} checked={selectedAttributes.includes(field)} onChange={() => toggleValue(selectedAttributes, setSelectedAttributes, field, 'selectedAttributes')} />
        ))}
      </Section>

      <Section title="Precio">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={inputCls}
          />
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={inputCls}
          />
        </div>
      </Section>

      <Section title="Certificadora">
        {certEntities.map((e) => (
          <Check key={e.id} label={e.abbreviation} checked={selectedCertEntities.includes(e.abbreviation)} onChange={() => toggleValue(selectedCertEntities, setSelectedCertEntities, e.abbreviation, 'selectedCertEntities')} />
        ))}
      </Section>

      <div className="space-y-3 pt-3 border-t border-[#E8E4DD]">
        <label className="flex items-center justify-between cursor-pointer pt-1">
          <span className="text-[13px] text-[#6B6560]">Con descuento</span>
          <button
            onClick={() => {
              const nextValue = !hasDiscount;
              setHasDiscount(nextValue);
              setCurrentPage(1);
              navigateWithState({ hasDiscount: nextValue, currentPage: 1 });
            }}
            className={`w-9 h-5 rounded-full transition-all relative ${hasDiscount ? 'bg-[#C8972E]' : 'bg-[#E8E4DD]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${hasDiscount ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </label>
      </div>

      {activeCount > 0 && (
        <button onClick={clearAll} className="w-full mt-4 text-[11px] text-[#6B6560]/50 hover:text-[#1A1A1A] transition-colors py-2 border border-[#E8E4DD] hover:border-[#D4CFC6]">
          Limpiar filtros ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Catalogo</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A]">Crack Store<span className="text-[#C8972E]">.</span></h1>
          {total > 0 && <p className="text-[13px] text-[#6B6560]/70 mt-2">{total} productos</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6560]/40" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-[#E8E4DD] pl-10 pr-4 py-3 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40 transition-all" />
          </div>

          <div className="relative">
            <select
              value={ordering}
              onChange={(e) => {
                const nextOrdering = e.target.value;
                setOrdering(nextOrdering);
                setCurrentPage(1);
                navigateWithState({ ordering: nextOrdering, currentPage: 1 });
              }}
              className="appearance-none bg-white border border-[#E8E4DD] px-4 py-3 pr-10 text-[13px] text-[#6B6560] outline-none focus:border-[#C8972E]/40 cursor-pointer transition-all"
            >
              {sortOptions.map((o) => <option key={o.value} value={o.value} className="bg-white">{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560]/40 pointer-events-none" />
          </div>

          <button onClick={() => setFiltersOpen(!filtersOpen)} className="lg:hidden flex items-center justify-center gap-2 bg-white border border-[#E8E4DD] px-4 py-3 text-[13px] text-[#6B6560] hover:border-[#D4CFC6] transition-all">
            <SlidersHorizontal size={15} />
            Filtros
            {activeCount > 0 && <span className="bg-[#C8972E] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>}
          </button>
        </div>

        <div className="flex gap-10">
          <aside className="hidden lg:block w-52 flex-shrink-0">{filters}</aside>

          <AnimatePresence>
            {filtersOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed left-0 top-0 h-full w-full max-w-xs bg-white z-50 overflow-y-auto p-6 lg:hidden border-r border-[#E8E4DD] shadow-lg">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[13px] font-bold tracking-[0.15em] text-[#1A1A1A]">FILTROS</h2>
                    <button onClick={() => setFiltersOpen(false)} className="text-[#6B6560]/50 hover:text-[#1A1A1A]"><X size={18} /></button>
                  </div>
                  {filters}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <ProductCard product={p} listName={listName} listIndex={(currentPage - 1) * pageSize + i} />
                    </motion.div>
                  ))}
                </motion.div>

                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-10 border-t border-[#E8E4DD] pt-5 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[12px] text-[#6B6560]/70">
                        Mostrando {visibleStart}-{visibleEnd} de {total}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          onMouseEnter={() => prefetchPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-[12px] border border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6] hover:text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Anterior
                        </button>

                        <div className="hidden sm:flex items-center gap-1.5">
                          {getPageWindow().map((page) => (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              onMouseEnter={() => prefetchPage(page)}
                              className={`w-8 h-8 text-[12px] border transition-all ${
                                page === currentPage
                                  ? 'bg-[#C8972E] border-[#C8972E] text-white'
                                  : 'border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6] hover:text-[#1A1A1A]'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <span className="sm:hidden text-[12px] text-[#6B6560] min-w-[72px] text-center">
                          {currentPage} / {totalPages}
                        </span>

                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          onMouseEnter={() => prefetchPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-[12px] border border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6] hover:text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                <p className="text-[#6B6560]/50 text-[13px] mb-4">No se encontraron productos</p>
                <button onClick={clearAll} className="text-[12px] text-[#C8972E] hover:underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
