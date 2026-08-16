/**
 * Pipeline de imágenes remotas — Cloudinary + R2, sin optimizador de plataforma.
 *
 * Las imágenes de producto ya llegan optimizadas desde el origen, así que pasarlas
 * por `next/image` no agrega nada: sólo reescala algo que ya está en el ancho
 * correcto, y en Vercel cada variante (ancho × formato × calidad) se factura como
 * una transformación. Como hay una imagen por producto y el catálogo no tiene
 * techo, el gasto crece con el catálogo. Acá se arma el `srcset` a mano y el
 * navegador baja directo del CDN de origen.
 *
 * Hay dos orígenes y se comportan distinto:
 *
 *   Cloudinary — imágenes subidas desde el admin. Acepta cualquier ancho vía
 *     transformación en la URL. El backend ya inserta un bloque de entrega
 *     (p.ej. `c_limit,w_700,f_auto,q_auto`, ver products/services/cloudinary_service.py);
 *     acá ese bloque se REEMPLAZA, no se encadena, para pedir el ancho exacto de
 *     cada contexto sin generar transformaciones dobles.
 *
 *   R2 — catálogo TCG. NO acepta anchos arbitrarios: el backend pre-genera tres
 *     WebP fijos (ver catalog/services/images.py) y no hay nada que transformar.
 *     El srcset se arma con esas tres variantes y nada más.
 *
 * Cualquier otra URL se devuelve tal cual, sin srcset.
 */

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

// Prefijos de parámetros de transformación (c_, w_, f_, q_, ...) — espejo de
// _TRANSFORM_TOKEN en crackbackend/apps/products/services/cloudinary_service.py.
const TRANSFORM_TOKEN_RE =
  /^(c|w|h|f|q|g|e|a|r|o|b|l|t|x|y|z|dpr|fl|so|du|vc|ac|br|cs|bo|co|pg)_/;

/**
 * Formato de entrega — FIJO, a propósito, en vez de `f_auto`.
 *
 * Con `f_auto` la decisión la toma el header Accept del browser. En una cuenta con
 * JPEG XL habilitado, iOS Safari pide `image/jxl` y Cloudinary se lo entrega como
 * codestream crudo en lugar del contenedor que espera ImageIO: Safari lee las
 * dimensiones, reserva el espacio y pinta el rectángulo en blanco. Chrome nunca
 * pide jxl, cae en WebP, y por eso el bug sólo se ve en iPhone. `f_auto:image`
 * tampoco alcanza. Es el mismo motivo por el que Delta entrega WebP fijo.
 *
 * WebP es el denominador común real: iOS/Safari 14+, Chrome, Firefox y Edge.
 * El backend además ya guarda todo el catálogo de R2 en WebP, así que los dos
 * orígenes quedan entregando el mismo formato.
 */
const FORMATO_ENTREGA = 'webp';

// Rasterizar un SVG le saca nitidez y le suma peso; el GIF animado se deja intacto
// para no depender de cómo Cloudinary arme el WebP animado. Sin bloque `f_` se
// entrega el original.
const SIN_CONVERTIR_RE = /\.(svg|gif)(\?|$)/i;

const formatoDe = (url) => (SIN_CONVERTIR_RE.test(url) ? [] : [`f_${FORMATO_ENTREGA}`]);

/**
 * Separa una URL de Cloudinary en prefijo (hasta /upload/) y resto, descartando
 * el bloque de transformación de entrega que ya venga puesto.
 * Devuelve null si la URL no es de Cloudinary.
 */
function splitUpload(url) {
  const match = CLOUDINARY_RE.exec(url || '');
  if (!match) return null;

  let rest = match[2];
  const first = rest.split('/', 1)[0];
  if (first && first.split(',').some((part) => TRANSFORM_TOKEN_RE.test(part))) {
    rest = rest.slice(first.length + 1);
  }
  return { prefix: match[1], rest };
}

export const isCloudinary = (url) => CLOUDINARY_RE.test(url || '');

/** Inserta transformaciones después de /upload/ (reemplaza un bloque previo). */
export function cloudinaryUrl(url, { width, quality = 'auto' } = {}) {
  const parts = splitUpload(url);
  if (!parts) return url || '';

  const t = [...formatoDe(url), `q_${quality}`, 'c_limit'];
  if (width) t.push(`w_${width}`);
  return `${parts.prefix}${t.join(',')}/${parts.rest}`;
}

/**
 * Renditions de R2 — espejo de RENDITIONS en catalog/services/images.py.
 * La clave del objeto es el MD5 del original, así que las tres variantes de una
 * misma carta se derivan del nombre de archivo sin pegarle a la API.
 */
const R2_RENDITIONS = [
  ['_thumb', 200],
  ['_medium', 600],
  ['', 660],
];

const R2_ASSET_RE = /^(.*\/[0-9a-f]{32})(_thumb|_medium)?\.webp$/;

const isR2Card = (url) => R2_ASSET_RE.test(url || '');

/** Las tres variantes de una carta de R2, a partir de cualquiera de ellas. */
function r2Variants(url) {
  const match = R2_ASSET_RE.exec(url || '');
  if (!match) return null;

  const base = match[1];
  return R2_RENDITIONS.map(([suffix, width]) => [`${base}${suffix}.webp`, width]);
}

/**
 * Anchos por modo de visualización, en px de imagen entregada (ya contemplan
 * pantallas de alta densidad: el navegador elige según DPR × ancho CSS).
 * Sólo aplican a Cloudinary — R2 usa sus tres renditions fijas.
 */
const MODE_WIDTHS = {
  // Card en grilla de tienda: máx ~360px CSS en desktop, ~195px en mobile.
  card: [200, 400, 640],
  // Imagen principal del detalle. El backend no entrega más de 1200.
  detail: [480, 768, 1200],
  // Miniaturas de la galería del detalle (64px CSS).
  thumb: [96, 192],
  // Dropdown del buscador (40-48px CSS).
  search: [80, 160],
  // Renglones de carrito y checkout (48-80px CSS).
  line: [96, 192],
};

/** Atributo sizes por modo: qué ancho ocupa la imagen en el viewport. */
const MODE_SIZES = {
  card: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  detail: '(max-width: 1024px) 100vw, 700px',
  thumb: '64px',
  search: '48px',
  line: '80px',
};

/**
 * Props listas para un `<img>` responsive.
 *
 * @param {string} url     URL de origen (Cloudinary, R2 o cualquier otra).
 * @param {string} mode    Clave de MODE_WIDTHS / MODE_SIZES.
 * @param {object} opts    `eager: true` para la imagen que entra above the fold.
 * @returns {{src, srcSet?, sizes, loading, decoding, fetchPriority}|null}
 */
export function imgProps(url, mode = 'card', { eager = false, sizes } = {}) {
  if (!url) return null;

  const base = {
    src: url,
    sizes: sizes || MODE_SIZES[mode] || MODE_SIZES.card,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    fetchPriority: eager ? 'high' : 'auto',
  };

  if (isCloudinary(url)) {
    const widths = MODE_WIDTHS[mode] || MODE_WIDTHS.card;
    // src apunta al ancho intermedio: es el fallback para navegadores sin srcset.
    base.src = cloudinaryUrl(url, { width: widths[Math.max(0, widths.length - 2)] });
    base.srcSet = widths.map((w) => `${cloudinaryUrl(url, { width: w })} ${w}w`).join(', ');
    return base;
  }

  if (isR2Card(url)) {
    const variants = r2Variants(url);
    base.srcSet = variants.map(([href, w]) => `${href} ${w}w`).join(', ');
    // En modos chicos el fallback es la miniatura; en los grandes, la completa.
    const small = mode === 'thumb' || mode === 'search' || mode === 'line';
    base.src = small ? variants[0][0] : variants[variants.length - 1][0];
    return base;
  }

  return base;
}
