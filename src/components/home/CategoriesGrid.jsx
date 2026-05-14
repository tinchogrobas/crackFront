'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/api';

const HOME_CATEGORY_ORDER = ['singles', 'slabs', 'sellados', 'accesorios', 'mystery-packs'];
const HOME_CATEGORY_ORDER_INDEX = HOME_CATEGORY_ORDER.reduce((acc, slug, index) => {
  acc[slug] = index;
  return acc;
}, {});

// Imagen por slug  agregá las tuyas acá
const CATEGORY_IMAGES = {
  singles: '/categories/singles.png',
  slabs: '/categories/slabs.png',
  sellados: '/categories/productos-sellados.png',
  accesorios: '/categories/accesorios.png',
  'mystery-packs': '/categories/mystery-pack.png',
};

let categoriesCache = null;
let categoriesRequestPromise = null;

function resolveHomeCategorySlug(category) {
  const slug = String(category?.slug || '').toLowerCase().trim();
  const name = String(category?.name || '').toLowerCase().trim();

  if (slug === 'single' || slug === 'singles' || name === 'single' || name === 'singles') return 'singles';
  if (slug === 'slab' || slug === 'slabs' || name === 'slab' || name === 'slabs') return 'slabs';
  if (slug === 'sellado' || slug === 'sellados' || name === 'sellado' || name === 'sellados') return 'sellados';
  if (slug === 'accesorio' || slug === 'accesorios' || name === 'accesorio' || name === 'accesorios') return 'accesorios';
  if (
    slug === 'mystery-pack'
    || slug === 'mystery-packs'
    || name === 'mystery pack'
    || name === 'mystery packs'
  ) return 'mystery-packs';

  return slug;
}

const CategoryCard = memo(function CategoryCard({ cat, size }) {
  const normalizedSlug = resolveHomeCategorySlug(cat);
  const img = CATEGORY_IMAGES[normalizedSlug] || CATEGORY_IMAGES[cat.slug];
  if (!img) return null;

  return (
    <Link href={`/tienda?category=${cat.slug}`} className={`group flex-shrink-0 ${size}`}>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-[#E8E4DD]/80 bg-[#F8F6F2] group-hover:border-[#C8972E]/40 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(200,151,46,0.1)]">
        <Image
          src={img}
          alt={cat.name}
          fill
          sizes="(max-width: 640px) 140px, (max-width: 1024px) 33vw, 285px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </Link>
  );
});

function CategoryCardSkeleton({ size }) {
  return (
    <div className={`flex-shrink-0 ${size} animate-pulse`}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F0EDE6]" />
    </div>
  );
}

const SKELETON_COUNT = Object.keys(CATEGORY_IMAGES).length;

export default function CategoriesGrid() {
  const [categories, setCategories] = useState(categoriesCache);

  useEffect(() => {
    if (categoriesCache) {
      setCategories(categoriesCache);
      return;
    }

    if (!categoriesRequestPromise) {
      categoriesRequestPromise = getCategories()
        .then((data) => {
          categoriesCache = Array.isArray(data) ? data : [];
          return categoriesCache;
        })
        .catch(() => {
          categoriesCache = [];
          return categoriesCache;
        })
        .finally(() => {
          categoriesRequestPromise = null;
        });
    }

    categoriesRequestPromise.then(setCategories);
  }, []);

  const orderedCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories
      .filter((cat) => {
        const normalizedSlug = resolveHomeCategorySlug(cat);
        return Boolean(CATEGORY_IMAGES[normalizedSlug] || CATEGORY_IMAGES[cat.slug]);
      })
      .sort((a, b) => {
        const leftSlug = resolveHomeCategorySlug(a);
        const rightSlug = resolveHomeCategorySlug(b);
        const leftOrder = HOME_CATEGORY_ORDER_INDEX[leftSlug] ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = HOME_CATEGORY_ORDER_INDEX[rightSlug] ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return String(a?.name || '').localeCompare(String(b?.name || ''));
      });
  }, [categories]);

  const isLoading = categories === null;
  const items = isLoading ? Array.from({ length: SKELETON_COUNT }) : orderedCategories;

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 border-t border-[#E8E4DD]">
      {/* Mobile: scroll horizontal */}
      <div className="sm:hidden flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-1">
        {items.map((cat, i) => (isLoading
          ? <CategoryCardSkeleton key={i} size="w-[140px]" />
          : <CategoryCard key={cat.slug} cat={cat} size="w-[140px]" />
        ))}
      </div>
      {/* Desktop: grid */}
      <div className="hidden sm:grid max-w-[1400px] mx-auto px-8 grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((cat, i) => (isLoading
          ? <CategoryCardSkeleton key={i} size="w-full" />
          : <CategoryCard key={cat.slug} cat={cat} size="w-full" />
        ))}
      </div>
    </section>
  );
}