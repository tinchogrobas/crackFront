import { serverFetch } from '@/lib/seo';
import { toFeedProduct, csvCell, feedResponseHeaders } from '@/lib/feeds';

/**
 * Catálogo de productos para Meta (Commerce Manager → Catálogo → Fuente de
 * datos programada), en el CSV que espera la plataforma.
 *
 * Habilita los anuncios dinámicos / Advantage+ catalog: Meta arma el creativo
 * solo con la foto y el precio de cada carta, y hace retargeting de quien vio
 * un producto sin comprarlo. Los `id` de acá son los mismos `content_ids` que
 * manda el Pixel en ViewContent/AddToCart (ver `lib/analytics.js`); si no
 * coincidieran, el retargeting no matchea nada.
 */

export const revalidate = 3600;

const MAX_ITEMS = 45000;

/** El orden de las columnas es libre, pero el encabezado tiene que ser exacto. */
const COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'google_product_category',
  'product_type',
  'item_group_id',
  'quantity_to_sell_on_facebook',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
];

function buildRow(p) {
  return [
    p.id,
    p.title,
    p.description,
    p.availability,
    p.condition,
    p.price,
    p.salePrice || '',
    p.link,
    p.imageLink,
    // Meta separa las imágenes extra por coma dentro de una sola celda.
    p.additionalImages.join(','),
    p.brand,
    p.googleProductCategory,
    p.productType,
    p.itemGroupId || p.id,
    p.quantity ?? '',
    p.custom_label_0,
    p.custom_label_1,
    p.custom_label_2,
    p.custom_label_3,
    p.custom_label_4,
  ]
    .map(csvCell)
    .join(',');
}

async function fetchFeed() {
  try {
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

  const rows = raw.map(toFeedProduct).filter(Boolean).slice(0, MAX_ITEMS).map(buildRow);

  // BOM al principio: sin él Excel y el importador de Meta rompen los acentos
  // y los nombres japoneses de los sets.
  const csv = `﻿${COLUMNS.join(',')}\n${rows.join('\n')}\n`;

  return new Response(csv, {
    headers: feedResponseHeaders({
      maxAgeSeconds: 3600,
      contentType: 'text/csv; charset=utf-8',
    }),
  });
}
