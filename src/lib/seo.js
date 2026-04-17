/**
 * Single source of truth para datos SEO globales del sitio.
 * Todo lo estático (nombre, URL, datos de negocio, keywords base) vive acá.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://crack-front-rho.vercel.app';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000/api/v1';

export const SITE_NAME = 'CRACK® TCG';
export const BRAND_LEGAL = 'CRACK TCG';
export const DEFAULT_LOCALE = 'es_AR';
export const COUNTRY = 'AR';
export const CURRENCY = 'ARS';

export const CONTACT = {
  email: 'contacto@cracktcg.com',
  country: 'Argentina',
};

export const SOCIAL = {
  instagram: 'https://instagram.com/crack.tcg',
};

export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/og-default.jpg`;

export const GLOBAL_KEYWORDS = [
  'cartas Pokémon Argentina',
  'comprar cartas Pokémon',
  'Pokémon TCG Argentina',
  'singles Pokémon',
  'slabs PSA Argentina',
  'cartas selladas Pokémon',
  'mystery pack Pokémon',
  'tienda Pokémon TCG',
  'coleccionables TCG Argentina',
  'accesorios Pokémon',
];

/** Construye una URL absoluta a partir de un path relativo. */
export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Trunca texto a longitud máxima respetando palabras. */
export function truncate(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 40 ? lastSpace : slice.length)}…`;
}

/** Quita HTML para descripciones meta. */
export function stripHtml(input = '') {
  return String(input)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch tipado para endpoints públicos consumidos en server components / sitemap.
 * Permite configurar revalidación ISR o no-store.
 */
export async function serverFetch(path, { revalidateSeconds = 0, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const init = {
    signal: controller.signal,
    headers: { Accept: 'application/json' },
    ...(revalidateSeconds > 0
      ? { next: { revalidate: revalidateSeconds } }
      : { cache: 'no-store' }),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`SEO fetch ${path} → ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Normaliza productos con categoría como objeto o como string. */
export function resolveCategory(product) {
  if (!product?.category) return { name: null, slug: null };
  if (typeof product.category === 'string') return { name: product.category, slug: null };
  return { name: product.category.name || null, slug: product.category.slug || null };
}

// ─── Sitemap / XML helpers ───────────────────────────────────────────────────

/** Escapa los 5 caracteres reservados de XML para inyectar URLs o texto en el XML. */
export function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convierte Date o string ISO a formato W3C Datetime (YYYY-MM-DDTHH:mm:ss+00:00). */
export function toW3CDate(input) {
  if (!input) return new Date().toISOString();
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * Construye una entrada <url>...</url> del sitemap, con soporte de image:image.
 * `images` acepta strings (solo loc) u objetos `{ loc, title, caption }`.
 */
export function buildUrlEntry({ loc, lastmod, changefreq, priority, images = [] }) {
  const imageBlocks = images
    .map((img) => (typeof img === 'string' ? { loc: img } : img))
    .filter((img) => img && img.loc)
    .map((img) => {
      const inner = [`<image:loc>${xmlEscape(img.loc)}</image:loc>`];
      if (img.title) inner.push(`<image:title>${xmlEscape(img.title)}</image:title>`);
      if (img.caption) inner.push(`<image:caption>${xmlEscape(img.caption)}</image:caption>`);
      return `    <image:image>${inner.join('')}</image:image>`;
    });

  const parts = [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${toW3CDate(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority != null ? `    <priority>${Number(priority).toFixed(1)}</priority>` : null,
    ...imageBlocks,
    '  </url>',
  ].filter(Boolean);
  return parts.join('\n');
}

/** Construye una entrada <sitemap>...</sitemap> del sitemap index. */
export function buildSitemapEntry({ loc, lastmod }) {
  return [
    '  <sitemap>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${toW3CDate(lastmod)}</lastmod>` : null,
    '  </sitemap>',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Wrappea el contenido de <urlset>. Se pasa `withImages` para incluir el namespace image. */
export function wrapUrlset(entries, { withImages = false } = {}) {
  const imageNs = withImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/0.9"' : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNs}>
${entries.join('\n')}
</urlset>`;
}

/** Wrappea el contenido de <sitemapindex>. */
export function wrapSitemapIndex(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;
}

/** Headers estándar para responses XML de sitemap con ISR. */
export function xmlResponseHeaders({ maxAgeSeconds = 3600 } = {}) {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=86400`,
    'X-Robots-Tag': 'noindex',
  };
}

/** Filtro defensivo: valida que un slug solo contenga caracteres SEO-safe. */
export function isSafeSlug(slug) {
  return typeof slug === 'string' && /^[a-zA-Z0-9_\-./]+$/.test(slug);
}
