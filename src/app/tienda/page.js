import TiendaClient from './TiendaClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000/api/v1';
const PAGE_SIZE = 12;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const FILTERS_REVALIDATE_SECONDS = 60 * 30;

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
  const condition = toSingleValue(resolvedParams?.condition);
  const certEntity = toSingleValue(resolvedParams?.certification_entity);
  const hasDiscountParam = ['1', 'true', 'yes'].includes(
    toSingleValue(resolvedParams?.has_discount).toLowerCase(),
  );
  const page = Number.parseInt(toSingleValue(resolvedParams?.page) || '1', 10);
  const isPaginated = Number.isInteger(page) && page > 1;

  // Filtros CSV (múltiples valores) NO son canónicos → apuntan a /tienda base
  const isCsv = (v) => typeof v === 'string' && v.includes(',');
  // Idioma, acabado y particularidades tampoco: son combinaciones del usuario,
  // no páginas para indexar.
  const hasTraitFilter = Boolean(
    toSingleValue(resolvedParams?.language) || toSingleValue(resolvedParams?.finish) || toSingleValue(resolvedParams?.attribute),
  );
  const hasCsvFilter = isCsv(category) || isCsv(tcg) || isCsv(condition) || isCsv(certEntity) || hasTraitFilter;

  // Canonical: solo filtros "evergreen" de valor único + paginación reciben su propia canonical.
  // Orden canónico fijo: category → tcg → condition → certification_entity → has_discount → page
  // Ese orden matchea el sitemap y evita duplicados por reordenamiento de params.
  const canonicalQs = new URLSearchParams();
  if (!hasCsvFilter && !search) {
    if (category) canonicalQs.set('category', category);
    if (tcg) canonicalQs.set('tcg', tcg);
    if (condition) canonicalQs.set('condition', condition);
    if (certEntity) canonicalQs.set('certification_entity', certEntity);
    if (hasDiscountParam) canonicalQs.set('has_discount', 'true');
    if (isPaginated) canonicalQs.set('page', String(page));
  }
  const canonical = `${SITE_URL}/tienda${canonicalQs.toString() ? `?${canonicalQs.toString()}` : ''}`;
  const pageSuffix = isPaginated ? ` · Página ${page}` : '';

  const descriptors = [category, tcg, condition, certEntity].filter(Boolean);
  const subject = descriptors.length ? descriptors.join(' ') : 'Pokémon TCG';
  const offersPrefix = hasDiscountParam ? 'Ofertas: ' : '';
  const title = search
    ? `Resultados: "${search}" en CRACK TCG`
    : `${offersPrefix}${subject[0].toUpperCase()}${subject.slice(1)}${pageSuffix} — Comprar en Argentina | CRACK TCG`;
  const description = search
    ? `Resultados de búsqueda para "${search}" en CRACK TCG. Cartas Pokémon, singles, slabs y sellados con envío a todo el país.`
    : hasDiscountParam
    ? `Ofertas y descuentos en ${subject} — Argentina. Singles, Slabs PSA/BGS/CGC, sobres sellados y Mystery Packs con rebajas. Envíos a todo el país. Precios en ARS.`
    : `Catálogo de ${subject} en Argentina. Singles, Slabs PSA/BGS/CGC, sobres sellados, accesorios y Mystery Packs. Envíos a todo el país. Precios en ARS.`;

  // Noindex para: búsquedas, filtros con CSV (combinaciones arbitrarias del usuario)
  const noindex = Boolean(search) || hasCsvFilter;

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
  const selectedLanguages = parseCsv(toSingleValue(searchParams?.language)).map((value) => value.toLowerCase());
  const selectedFinishes = parseCsv(toSingleValue(searchParams?.finish));
  const selectedAttributes = parseCsv(toSingleValue(searchParams?.attribute));
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
  if (selectedLanguages.length) productQs.set('language', selectedLanguages.join(','));
  if (selectedFinishes.length) productQs.set('finish', selectedFinishes.join(','));
  if (selectedAttributes.length) productQs.set('attribute', selectedAttributes.join(','));

  // Stock must be fresh after checkout returns; avoid stale cached product lists.
  const productsData = await serverApiFetch(`/products/?${productQs.toString()}`, {
    revalidateSeconds: 0,
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
        selectedLanguages,
        selectedFinishes,
        selectedAttributes,
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
