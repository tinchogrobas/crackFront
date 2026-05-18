import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight as ChevronSep } from 'lucide-react';
import ProductDetailClient from './ProductDetailClient';
import {
  SITE_URL,
  SITE_NAME,
  CURRENCY,
  DEFAULT_OG_IMAGE,
  serverFetch,
  stripHtml,
  truncate,
  resolveCategory,
  absoluteUrl,
} from '@/lib/seo';

export const revalidate = 60;

async function fetchProduct(slug) {
  return serverFetch(`/products/${encodeURIComponent(slug)}/`, {
    revalidateSeconds: 60,
  });
}

function buildTitle(product) {
  const { name: categoryName } = resolveCategory(product);
  const tcgName = product?.tcg?.name;
  const categoryFragment = categoryName ? ` ${categoryName}` : '';
  const tcgFragment = tcgName ? ` ${tcgName}` : '';
  return `Comprar ${product.name}${categoryFragment}${tcgFragment} al mejor precio en Argentina`;
}

function buildDescription(product) {
  const clean = stripHtml(product.description || '');
  if (clean) return truncate(clean, 158);
  const { name: categoryName } = resolveCategory(product);
  const cat = categoryName || 'producto TCG';
  return truncate(
    `Comprá ${product.name} (${cat}) en ${SITE_NAME}. Envíos a todo Argentina, pago seguro y embalaje premium. Precios en pesos argentinos.`,
    158,
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado',
      description: 'El producto que buscás ya no está disponible en CRACK TCG.',
      robots: { index: false, follow: false },
      alternates: { canonical: `${SITE_URL}/tienda` },
    };
  }

  const canonical = `${SITE_URL}/tienda/${product.slug}`;
  const title = buildTitle(product);
  const description = buildDescription(product);
  const outOfStock = product.in_stock === false || product.stock_quantity === 0;

  const images = [product.image_url, product.image_url_2, product.image_url_3]
    .filter(Boolean)
    .map((url) => absoluteUrl(url));
  const ogImages = images.length ? images : [DEFAULT_OG_IMAGE];

  const { name: categoryName } = resolveCategory(product);
  const tcgName = product?.tcg?.name;
  const keywords = [
    product.name,
    `${product.name} Argentina`,
    `comprar ${product.name}`,
    categoryName,
    tcgName,
    tcgName ? `${tcgName} Argentina` : null,
    'cartas Pokémon',
    'TCG Argentina',
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: outOfStock
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: SITE_NAME,
      locale: 'es_AR',
      images: ogImages.map((url) => ({ url, width: 1200, height: 1200, alt: product.name })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages,
    },
    other: {
      'product:price:amount': String(product.final_price ?? product.price_ars ?? ''),
      'product:price:currency': CURRENCY,
      'product:availability': outOfStock ? 'out of stock' : 'in stock',
    },
  };
}

function buildBreadcrumbs(product) {
  const { name: categoryName, slug: categorySlug } = resolveCategory(product);
  const crumbs = [
    { name: 'Inicio', href: '/' },
    { name: 'Tienda', href: '/tienda' },
  ];
  if (categoryName) {
    crumbs.push({
      name: categoryName,
      href: `/tienda?category=${encodeURIComponent(categorySlug || categoryName)}`,
    });
  }
  crumbs.push({ name: product.name });
  return crumbs;
}

function BreadcrumbJsonLd({ crumbs }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function ProductJsonLd({ product }) {
  const canonical = `${SITE_URL}/tienda/${product.slug}`;
  const outOfStock = product.in_stock === false || product.stock_quantity === 0;
  const price = Number(product.final_price ?? product.price_ars ?? 0);
  const { name: categoryName } = resolveCategory(product);
  const images = [product.image_url, product.image_url_2, product.image_url_3]
    .filter(Boolean)
    .map((url) => absoluteUrl(url));

  const certGrade =
    typeof product.certification_grade === 'object'
      ? product.certification_grade?.grade
      : product.certification_grade;
  const certEntity =
    typeof product.certification_entity === 'object'
      ? product.certification_entity?.name || product.certification_entity?.abbreviation
      : product.certification_entity;
  const conditionName =
    typeof product.condition === 'object'
      ? product.condition?.name
      : product.condition;

  const additionalProperty = [
    certEntity ? { '@type': 'PropertyValue', name: 'Certification', value: `${certEntity} ${certGrade ?? ''}`.trim() } : null,
    conditionName ? { '@type': 'PropertyValue', name: 'Condition', value: conditionName } : null,
    product?.tcg?.name ? { '@type': 'PropertyValue', name: 'TCG', value: product.tcg.name } : null,
  ].filter(Boolean);

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': canonical,
    name: product.name,
    sku: String(product.id),
    description: stripHtml(product.description || '') || `${product.name} disponible en ${SITE_NAME}.`,
    image: images.length ? images : [DEFAULT_OG_IMAGE],
    category: categoryName || undefined,
    brand: { '@type': 'Brand', name: product?.tcg?.name || SITE_NAME },
    ...(additionalProperty.length ? { additionalProperty } : {}),
    ...(Number(product.rating_count) > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating) || 0,
            reviewCount: Number(product.rating_count) || 0,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: CURRENCY,
      price: price ? price.toFixed(2) : '0.00',
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}#organization` },
      areaServed: { '@type': 'Country', name: 'Argentina' },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) notFound();

  const crumbs = buildBreadcrumbs(product);

  return (
    <>
      <BreadcrumbJsonLd crumbs={crumbs} />
      <ProductJsonLd product={product} />

      <div className="pt-28 max-w-[1200px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[12px] overflow-hidden">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-1 ${isLast ? 'flex-1 min-w-0' : 'flex-shrink-0'}`}
                >
                  {i > 0 && <ChevronSep size={11} className="text-[#D4CFC6] flex-shrink-0" />}
                  {isLast ? (
                    <span className="text-[#3A3530] font-medium truncate min-w-0">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-[#6B6560]/60 hover:text-[#C8972E] transition-colors whitespace-nowrap"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <ProductDetailClient product={product} />
    </>
  );
}
