/**
 * Datos del megamenú de "Tienda" (desktop).
 *
 * Se resuelven en el servidor desde el layout: la lista de categorías y, para
 * Slabs / Sellados / Singles, el producto en stock más caro de cada una. La
 * imagen del bloque es la de ese producto (sólo de presentación: el bloque lleva
 * a la tienda filtrada por la categoría), así que se va renovando sola a medida
 * que se vende o entra stock (ver REVALIDATE_*).
 *
 * Nunca rompe el layout: si el backend no contesta, el menú sale con las
 * categorías que haya y los bloques sin imagen.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Las categorías casi no cambian; el ranking de precios sí, con cada venta.
const REVALIDATE_CATEGORIES = 60 * 30;
const REVALIDATE_FEATURED = 60 * 5;
const TIMEOUT_MS = 3000;

// Orden de los bloques en el menú. `match` se prueba contra slug y nombre de la
// categoría, así no depende de que el slug sea "slab" o "slabs".
const FEATURED_BLOCKS = [
  { key: 'slabs', label: 'Slabs', match: /slab/ },
  { key: 'sellados', label: 'Sellados', match: /sellad|sealed/ },
  { key: 'singles', label: 'Singles', match: /single/ },
];

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

async function fetchJson(path, revalidate) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

const matches = (category, re) =>
  re.test((category?.slug || '').toLowerCase()) || re.test((category?.name || '').toLowerCase());

const productImage = (product) =>
  product?.image_url || product?.images?.find((img) => img?.image_url)?.image_url || null;

/** El más caro en stock que además tenga foto: un bloque sin imagen no vende. */
async function getTopProduct(categorySlug) {
  const qs = new URLSearchParams({ category: categorySlug, ordering: '-price_usd', in_stock: 'true' });
  const products = unwrapList(await fetchJson(`/products/?${qs}`, REVALIDATE_FEATURED));
  const top = products.find((p) => productImage(p) && (p.available_quantity ?? p.stock_quantity ?? 1) > 0);
  if (!top) return null;

  return { name: top.name, image: productImage(top) };
}

const byName = (list) =>
  unwrapList(list)
    .filter((item) => item?.slug && item?.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

export async function getMegaMenuData() {
  const [tcgsData, categoriesData, certificationsData] = await Promise.all([
    fetchJson('/tcgs/', REVALIDATE_CATEGORIES),
    fetchJson('/categories/', REVALIDATE_CATEGORIES),
    fetchJson('/certification-entities/', REVALIDATE_CATEGORIES),
  ]);
  const tcgs = byName(tcgsData);
  const categories = byName(categoriesData);
  // Las usa la lupa: el filtro del backend va por abreviatura (PSA, BGS...).
  const certifications = unwrapList(certificationsData)
    .map((c) => c?.abbreviation)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const slabsSlug = categories.find((c) => matches(c, /slab/))?.slug;

  const blocks = await Promise.all(
    FEATURED_BLOCKS.map(async ({ key, label, match }) => {
      const category = categories.find((c) => matches(c, match));
      const href = category
        ? `/tienda?category=${encodeURIComponent(category.slug)}`
        : '/tienda';
      return {
        key,
        label: category?.name || label,
        href,
        product: category ? await getTopProduct(category.slug) : null,
      };
    }),
  );

  return {
    tcgs: tcgs.map((t) => ({
      name: t.name,
      href: `/tienda?tcg=${encodeURIComponent(t.slug)}`,
    })),
    certifications: certifications.map((abbr) => ({
      name: abbr,
      href: `/tienda?${new URLSearchParams({
        ...(slabsSlug ? { category: slabsSlug } : {}),
        certification_entity: abbr,
      })}`,
    })),
    categories: categories.map((c) => ({
      name: c.name,
      href: `/tienda?category=${encodeURIComponent(c.slug)}`,
    })),
    blocks,
  };
}
