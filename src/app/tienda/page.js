import TiendaClient from './TiendaClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000/api/v1';
const PAGE_SIZE = 12;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const FILTERS_REVALIDATE_SECONDS = 60 * 30;
const PRODUCTS_REVALIDATE_SECONDS = 20;

function toSingleValue(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function parseCsv(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

async function serverApiFetch(path, { revalidateSeconds = 0 } = {}) {
  const fetchOptions = revalidateSeconds > 0
    ? { next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

function normalizeCategoryValues(rawValues, categories) {
  return rawValues
    .map((value) => {
      const normalized = value.toLowerCase();
      const match = categories.find(
        (category) =>
          (category?.slug || '').toLowerCase() === normalized ||
          (category?.name || '').toLowerCase() === normalized,
      );
      return match?.slug || normalized;
    })
    .filter(Boolean);
}

export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const search = toSingleValue(resolvedParams?.search);
  const category = toSingleValue(resolvedParams?.category);
  const tcg = toSingleValue(resolvedParams?.tcg);
  const page = Number.parseInt(toSingleValue(resolvedParams?.page) || '1', 10);
  const isPaginated = Number.isInteger(page) && page > 1;

  // Canonical: solo filtros "evergreen" (categoría / tcg) + paginación reciben su propia canonical.
  // Búsquedas / orden son no-canónicos → apuntan a /tienda para evitar duplicados.
  const canonicalQs = new URLSearchParams();
  if (category) canonicalQs.set('category', category);
  if (tcg) canonicalQs.set('tcg', tcg);
  if (isPaginated) canonicalQs.set('page', String(page));
  const canonical = `${SITE_URL}/tienda${canonicalQs.toString() ? `?${canonicalQs.toString()}` : ''}`;
  const pageSuffix = isPaginated ? ` · Página ${page}` : '';

  const subject = category ? category : tcg ? tcg : 'Pokémon TCG';
  const title = search
    ? `Resultados: "${search}" en CRACK TCG`
    : `Tienda ${subject}${pageSuffix} — Cartas, Slabs y Sellados en Argentina`;
  const description = search
    ? `Resultados de búsqueda para "${search}" en CRACK TCG. Cartas Pokémon, singles, slabs y sellados con envío a todo el país.`
    : `Catálogo completo de ${subject} en Argentina. Singles, Slabs PSA/BGS/CGC, sobres sellados, accesorios y Mystery Packs. Envíos a todo el país. Precios en ARS.`;

  // Noindex para resultados de búsqueda y filtros combinados con search — evitan thin/duplicate content.
  const noindex = Boolean(search);

  return {
    title,
    description,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'es_AR',
      siteName: 'CRACK® TCG',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TiendaPage({ searchParams }) {
  const tcgsPromise = serverApiFetch('/tcgs/', { revalidateSeconds: FILTERS_REVALIDATE_SECONDS });
  const categoriesPromise = serverApiFetch('/categories/', { revalidateSeconds: FILTERS_REVALIDATE_SECONDS });
  const conditionsPromise = serverApiFetch('/conditions/', { revalidateSeconds: FILTERS_REVALIDATE_SECONDS });
  const certEntitiesPromise = serverApiFetch('/certification-entities/', { revalidateSeconds: FILTERS_REVALIDATE_SECONDS });

  const [tcgsData, categoriesData, conditionsData, certEntitiesData] = await Promise.all([
    tcgsPromise,
    categoriesPromise,
    conditionsPromise,
    certEntitiesPromise,
  ]);

  const tcgs = unwrapList(tcgsData);
  const categoriesList = unwrapList(categoriesData);
  const conditions = unwrapList(conditionsData);
  const certEntities = unwrapList(certEntitiesData);

  const search = toSingleValue(searchParams?.search);
  const ordering = toSingleValue(searchParams?.ordering) || '-created_at';
  const selectedTcgs = parseCsv(toSingleValue(searchParams?.tcg));
  const selectedCategories = normalizeCategoryValues(parseCsv(toSingleValue(searchParams?.category)), categoriesList);
  const selectedConditions = parseCsv(toSingleValue(searchParams?.condition)).map((value) => value.toUpperCase());
  const selectedCertEntities = parseCsv(toSingleValue(searchParams?.certification_entity)).map((value) => value.toUpperCase());
  const minPrice = toSingleValue(searchParams?.min_price);
  const maxPrice = toSingleValue(searchParams?.max_price);
  const hasDiscount = ['1', 'true', 'yes'].includes(toSingleValue(searchParams?.has_discount).toLowerCase());
  const requestedPage = Number.parseInt(toSingleValue(searchParams?.page) || '1', 10);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const productQs = new URLSearchParams();
  productQs.set('in_stock', 'true');
  productQs.set('ordering', ordering);
  productQs.set('page', String(currentPage));
  if (search) productQs.set('search', search);
  if (selectedTcgs.length) productQs.set('tcg', selectedTcgs.join(','));
  if (selectedCategories.length) productQs.set('category', selectedCategories.join(','));
  if (selectedConditions.length) productQs.set('condition', selectedConditions.join(','));
  if (selectedCertEntities.length) productQs.set('certification_entity', selectedCertEntities.join(','));
  if (minPrice) productQs.set('min_price', minPrice);
  if (maxPrice) productQs.set('max_price', maxPrice);
  if (hasDiscount) productQs.set('has_discount', 'true');

  const productsData = await serverApiFetch(`/products/?${productQs.toString()}`, {
    revalidateSeconds: PRODUCTS_REVALIDATE_SECONDS,
  });
  const products = productsData?.results || [];
  const total = Number(productsData?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <TiendaClient
      pageSize={PAGE_SIZE}
      initialData={{
        products,
        total,
        totalPages,
        currentPage,
      }}
      initialFilters={{
        search,
        ordering,
        selectedTcgs,
        selectedCategories,
        selectedConditions,
        selectedCertEntities,
        minPrice,
        maxPrice,
        hasDiscount,
      }}
      options={{
        tcgs,
        categoriesList,
        conditions,
        certEntities,
      }}
    />
  );
}
