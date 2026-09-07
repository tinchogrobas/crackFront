/**
 * Normalización de productos para los feeds de shopping.
 *
 * Google Merchant Center y el catálogo de Meta piden los mismos datos con
 * nombres distintos, así que el mapeo de negocio (condición, taxonomía,
 * etiquetas de campaña) vive acá una sola vez y cada route handler se limita a
 * serializar.
 *
 * El feed es lo que habilita las fichas gratuitas de Google Shopping y las
 * campañas Performance Max / Advantage+ catalog. Sin feed no hay anuncios de
 * producto: solo texto.
 */

import { SITE_URL, SITE_NAME, CURRENCY, stripHtml, truncate } from './seo';

/**
 * Taxonomía de Google. Son rutas de la taxonomía oficial en inglés; Google
 * acepta tanto el ID numérico como la ruta completa, pero la ruta tiene que
 * coincidir exacta. Si se agrega una categoría nueva, validar contra
 * https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 */
const GPC_TRADING_CARDS =
  'Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards';
const GPC_CARD_GAMES = 'Toys & Games > Games > Card Games';

/** Se matchea por substring del slug: los nombres de categoría cambian, los slugs no tanto. */
const GPC_BY_CATEGORY = [
  [/accesorio|sleeve|binder|toploader|protector/i, GPC_CARD_GAMES],
  [/sellado|sobre|booster|box|bundle|mystery/i, GPC_CARD_GAMES],
];

function googleProductCategory(categorySlug, categoryName) {
  const haystack = `${categorySlug || ''} ${categoryName || ''}`;
  for (const [pattern, gpc] of GPC_BY_CATEGORY) {
    if (pattern.test(haystack)) return gpc;
  }
  return GPC_TRADING_CARDS;
}

/**
 * `condition` de Google solo admite new / refurbished / used.
 *
 * Una carta suelta salida del sobre y sin jugar se declara `new`; una jugada es
 * `used`. Declarar todo `new` es causa de suspensión de la cuenta de Merchant
 * Center, así que el default de una condición desconocida es `used`.
 */
function feedCondition({ condition, category }) {
  const cat = `${category || ''}`.toLowerCase();
  // Sellados y accesorios nunca pasaron por manos de un jugador.
  if (/sellad|sobre|booster|box|bundle|mystery|accesorio/.test(cat)) return 'new';
  if (!condition) return 'new';
  const c = String(condition).toLowerCase();
  if (/mint|nm|near mint|sealed|nuevo/.test(c) && !/played|jugad/.test(c)) return 'new';
  return 'used';
}

/**
 * Etiquetas con las que después se segmentan pujas en Google Ads y Meta.
 * Cambiarlas rompe las campañas que ya filtran por ellas: agregar, no renombrar.
 */
function customLabels(item) {
  const price = Number(item.final_price) || 0;
  const bucket =
    price >= 500000 ? 'premium'
    : price >= 150000 ? 'alto'
    : price >= 50000 ? 'medio'
    : 'entrada';

  return {
    custom_label_0: item.category || 'sin-categoria',
    custom_label_1: item.tcg || 'sin-tcg',
    custom_label_2: bucket,
    custom_label_3: item.discount_percent > 0 ? 'oferta' : 'precio-lista',
    custom_label_4: item.certification_entity
      ? `slab-${item.certification_entity.toLowerCase()}`
      : (item.condition_abbr || item.condition || 'sin-condicion'),
  };
}

/**
 * Título del anuncio. Google corta a 150 caracteres y prioriza las primeras
 * palabras, así que el orden es el que usa la gente para buscar:
 * carta → set → condición/nota → idioma.
 */
function feedTitle(item) {
  const parts = [item.name];
  if (item.certification_entity && item.certification_grade) {
    const grade = String(item.certification_grade).replace(/\.0$/, '');
    parts.push(`${item.certification_entity} ${grade}`);
  } else if (item.condition_abbr || item.condition) {
    parts.push(item.condition_abbr || item.condition);
  }
  if (item.catalog_language === 'ja') parts.push('Japonés');
  return truncate(parts.filter(Boolean).join(' — '), 150);
}

/** Google rechaza filas sin descripción; si el admin la dejó vacía se arma una. */
function feedDescription(item) {
  const clean = stripHtml(item.description || '');
  if (clean.length >= 40) return truncate(clean, 4900);

  const bits = [
    item.name,
    item.catalog_set ? `del set ${item.catalog_set}` : null,
    item.catalog_rarity ? `(${item.catalog_rarity})` : null,
    item.certification_entity && item.certification_grade
      ? `certificada ${item.certification_entity} ${String(item.certification_grade).replace(/\.0$/, '')}`
      : item.condition ? `en estado ${item.condition}` : null,
  ].filter(Boolean);

  return truncate(
    `${bits.join(' ')}. Disponible en ${SITE_NAME}, tienda de ${item.tcg || 'TCG'} en Argentina. ` +
      'Envíos a todo el país, pago seguro y embalaje protegido. Precio en pesos argentinos.',
    4900,
  );
}

/**
 * Aplana un item del endpoint `/products/feed/` a los campos que comparten
 * Google y Meta. Devuelve `null` si le falta algo obligatorio: una fila
 * incompleta no se manda, se descarta.
 */
export function toFeedProduct(item) {
  if (!item?.id || !item?.slug || !item?.name) return null;
  const image = item.images?.[0];
  const price = Number(item.price_ars);
  if (!image || !Number.isFinite(price) || price <= 0) return null;

  const finalPrice = Number(item.final_price);
  const hasDiscount = Number.isFinite(finalPrice) && finalPrice > 0 && finalPrice < price;

  return {
    id: String(item.id),
    title: feedTitle(item),
    description: feedDescription(item),
    link: `${SITE_URL}/tienda/${item.slug}`,
    imageLink: image,
    additionalImages: (item.images || []).slice(1, 11),
    // Google exige el precio de lista en `price` y el rebajado en `sale_price`;
    // mandar el rebajado en `price` hace que no se muestre el tachado.
    price: `${price.toFixed(2)} ${CURRENCY}`,
    salePrice: hasDiscount ? `${finalPrice.toFixed(2)} ${CURRENCY}` : null,
    availability: 'in_stock',
    condition: feedCondition(item),
    brand: item.tcg || SITE_NAME,
    googleProductCategory: googleProductCategory(item.category_slug, item.category),
    productType: [item.tcg, item.category, item.catalog_set].filter(Boolean).join(' > '),
    // Agrupa las variantes de una misma carta (distinta condición o nota) para
    // que no compitan entre sí en la misma subasta.
    itemGroupId: item.catalog_external_id ? String(item.catalog_external_id) : null,
    quantity: Number.isInteger(item.available_quantity) ? item.available_quantity : null,
    ...customLabels(item),
  };
}

export function xmlEscapeFeed(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Los caracteres de control rompen el parser XML de Google sin dar un
    // error util: solo dice 'feed invalido'. Se filtran todos menos tab/LF/CR.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** Comillado CSV RFC 4180 — el catálogo de Meta se traga cualquier cosa sin él. */
export function csvCell(value) {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

export function feedResponseHeaders({ maxAgeSeconds = 3600, contentType }) {
  return {
    'Content-Type': contentType,
    'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=86400`,
    // El feed no es una página: no tiene que entrar al índice de búsqueda.
    'X-Robots-Tag': 'noindex',
  };
}
