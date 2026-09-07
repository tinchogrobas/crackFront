import { SITE_URL, SITE_NAME, COUNTRY, SHIPPING_ARS, CURRENCY, serverFetch } from '@/lib/seo';
import { toFeedProduct, xmlEscapeFeed, feedResponseHeaders } from '@/lib/feeds';

/**
 * Feed de productos para Google Merchant Center (RSS 2.0 + namespace `g:`).
 *
 * Es la pieza que faltaba para aparecer arriba en Google: los sitemaps meten
 * las páginas en el índice orgánico, pero las fichas de producto con foto y
 * precio —las de la pestaña Shopping y el carrusel del buscador, gratis— salen
 * de acá. Es también el catálogo que consumen las campañas Performance Max.
 *
 * Se da de alta en Merchant Center → Productos → Feeds → Feed programado,
 * apuntando a https://cracktcg.com/feeds/google-merchant.xml
 */

// Una vez por hora alcanza: Google no lo relee más seguido y el catálogo no
// cambia de precio minuto a minuto.
export const revalidate = 3600;

const MAX_ITEMS = 45000;

function tag(name, value) {
  if (value === null || value === undefined || value === '') return null;
  return `    <${name}>${xmlEscapeFeed(value)}</${name}>`;
}

/**
 * Bloque de envío. Solo se emite si hay una tarifa configurada por env; si no,
 * mandan las reglas de envío de la cuenta de Merchant Center, que es donde
 * conviene tenerlas porque varían por zona y método.
 */
function shippingBlock() {
  if (!(SHIPPING_ARS > 0)) return [];
  return [
    '    <g:shipping>',
    `      <g:country>${COUNTRY}</g:country>`,
    `      <g:price>${SHIPPING_ARS.toFixed(2)} ${CURRENCY}</g:price>`,
    '    </g:shipping>',
  ];
}

function buildItem(p) {
  const lines = [
    '  <item>',
    tag('g:id', p.id),
    tag('g:title', p.title),
    tag('g:description', p.description),
    tag('g:link', p.link),
    tag('g:image_link', p.imageLink),
    ...p.additionalImages.map((url) => tag('g:additional_image_link', url)),
    tag('g:availability', p.availability),
    tag('g:price', p.price),
    tag('g:sale_price', p.salePrice),
    tag('g:condition', p.condition),
    tag('g:brand', p.brand),
    // Las cartas sueltas no tienen GTIN ni MPN. Sin este flag Google rechaza
    // cada fila por "identificador único faltante".
    tag('g:identifier_exists', 'no'),
    tag('g:google_product_category', p.googleProductCategory),
    tag('g:product_type', p.productType),
    tag('g:item_group_id', p.itemGroupId),
    tag('g:quantity', p.quantity),
    tag('g:custom_label_0', p.custom_label_0),
    tag('g:custom_label_1', p.custom_label_1),
    tag('g:custom_label_2', p.custom_label_2),
    tag('g:custom_label_3', p.custom_label_3),
    tag('g:custom_label_4', p.custom_label_4),
    ...shippingBlock(),
    '  </item>',
  ];
  return lines.filter(Boolean).join('\n');
}

async function fetchFeed() {
  try {
    // Timeout largo a propósito: es el catálogo completo, no una página.
    const data = await serverFetch('/products/feed/', {
      revalidateSeconds: 3600,
      timeoutMs: 30000,
    });
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const raw = await fetchFeed();

  const items = raw
    .map(toFeedProduct)
    .filter(Boolean)
    .slice(0, MAX_ITEMS)
    .map(buildItem);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${xmlEscapeFeed(SITE_NAME)}</title>
  <link>${xmlEscapeFeed(SITE_URL)}</link>
  <description>${xmlEscapeFeed(
    `Catálogo de cartas Pokémon TCG, slabs certificados, sellados y accesorios de ${SITE_NAME} en Argentina.`,
  )}</description>
${items.join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: feedResponseHeaders({
      maxAgeSeconds: 3600,
      contentType: 'application/xml; charset=utf-8',
    }),
  });
}
