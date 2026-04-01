'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { getProducts, getTcgs, getCategories, getConditions, getCertificationEntities } from '@/lib/api';

const sortOptions = [
  { value: '-created_at', label: 'Más nuevos' },
  { value: 'price_usd', label: 'Precio ↑' },
  { value: '-price_usd', label: 'Precio ↓' },
  { value: 'name', label: 'Nombre A-Z' },
];

export default function TiendaPage() {
  return (
    <Suspense fallback={
      <div className="pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="h-10 w-48 bg-[#E8E4DD]/60 animate-pulse mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <TiendaContent />
    </Suspense>
  );
}

function TiendaContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [selectedTcgs, setSelectedTcgs] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedCertEntities, setSelectedCertEntities] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [inStock, setInStock] = useState(true);

  const [tcgs, setTcgs] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [certEntities, setCertEntities] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    Promise.all([getTcgs(), getCategories(), getConditions(), getCertificationEntities()])
      .then(([t, c, co, ce]) => { setTcgs(t); setCategoriesList(c); setConditions(co); setCertEntities(ce); });
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategories([cat]);
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = { ordering };
    if (search) params.search = search;
    if (selectedTcgs.length) params.tcg = selectedTcgs.join(',');
    if (selectedCategories.length) params.category = selectedCategories.join(',');
    if (selectedConditions.length) params.condition = selectedConditions.join(',');
    if (selectedCertEntities.length) params.certification_entity = selectedCertEntities.join(',');
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (hasDiscount) params.has_discount = true;
    if (inStock) params.in_stock = true;
    const data = await getProducts(params);
    setProducts(data.results || []);
    setTotal(data.count || 0);
    setLoading(false);
  }, [search, ordering, selectedTcgs, selectedCategories, selectedConditions, selectedCertEntities, minPrice, maxPrice, hasDiscount, inStock]);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 250);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clearAll = () => { setSearch(''); setSelectedTcgs([]); setSelectedCategories([]); setSelectedConditions([]); setSelectedCertEntities([]); setMinPrice(''); setMaxPrice(''); setHasDiscount(false); setInStock(true); };
  const activeCount = selectedTcgs.length + selectedCategories.length + selectedConditions.length + selectedCertEntities.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (hasDiscount ? 1 : 0);

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

  const inputCls = "w-full bg-white border border-[#E8E4DD] px-3 py-2 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40";

  const filters = (
    <div className="space-y-1">
      <Section title="TCG">{tcgs.map((t) => <Check key={t.id} label={t.name} checked={selectedTcgs.includes(t.slug)} onChange={() => toggle(selectedTcgs, setSelectedTcgs, t.slug)} />)}</Section>
      <Section title="Categoría">{categoriesList.map((c) => <Check key={c.id} label={c.name} checked={selectedCategories.includes(c.slug)} onChange={() => toggle(selectedCategories, setSelectedCategories, c.slug)} />)}</Section>
      <Section title="Precio"><div className="flex gap-2"><input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={inputCls} /><input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={inputCls} /></div></Section>
      <Section title="Condición">{conditions.map((c) => <Check key={c.id} label={c.abbreviation} checked={selectedConditions.includes(c.abbreviation)} onChange={() => toggle(selectedConditions, setSelectedConditions, c.abbreviation)} />)}</Section>
      <Section title="Certificadora">{certEntities.map((e) => <Check key={e.id} label={e.abbreviation} checked={selectedCertEntities.includes(e.abbreviation)} onChange={() => toggle(selectedCertEntities, setSelectedCertEntities, e.abbreviation)} />)}</Section>
      <div className="space-y-3 pt-3 border-t border-[#E8E4DD]">
        <label className="flex items-center justify-between cursor-pointer pt-1">
          <span className="text-[13px] text-[#6B6560]">Con descuento</span>
          <button onClick={() => setHasDiscount(!hasDiscount)} className={`w-9 h-5 rounded-full transition-all relative ${hasDiscount ? 'bg-[#C8972E]' : 'bg-[#E8E4DD]'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${hasDiscount ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[13px] text-[#6B6560]">En stock</span>
          <button onClick={() => setInStock(!inStock)} className={`w-9 h-5 rounded-full transition-all relative ${inStock ? 'bg-[#C8972E]' : 'bg-[#E8E4DD]'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${inStock ? 'left-[18px]' : 'left-0.5'}`} />
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
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Catálogo</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A]">Crack Store<span className="text-[#C8972E]">.</span></h1>
          {total > 0 && <p className="text-[13px] text-[#6B6560]/70 mt-2">{total} productos</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6560]/40" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-[#E8E4DD] pl-10 pr-4 py-3 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40 transition-all" />
          </div>
          <div className="relative">
            <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className="appearance-none bg-white border border-[#E8E4DD] px-4 py-3 pr-10 text-[13px] text-[#6B6560] outline-none focus:border-[#C8972E]/40 cursor-pointer transition-all">
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
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
