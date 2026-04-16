import HeroSection from '@/components/home/HeroSection';
import Marquee from '@/components/home/Marquee';
import NewProducts from '@/components/home/NewProducts';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategoriesGrid from '@/components/home/CategoriesGrid';
import VideoBanner from '@/components/home/VideoBanner';
import Newsletter from '@/components/home/Newsletter';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, GLOBAL_KEYWORDS } from '@/lib/seo';

const title = `${SITE_NAME} — Cartas Pokémon TCG en Argentina`;
const description =
  'Comprá cartas Pokémon TCG en Argentina: singles, slabs PSA/BGS/CGC, sobres sellados, Mystery Packs y accesorios. Envíos a todo el país, pago seguro con Mercado Pago, transferencia o crypto.';

export const metadata = {
  title: { absolute: title },
  description,
  keywords: GLOBAL_KEYWORDS,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title,
    description,
    locale: 'es_AR',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <CategoriesGrid />  
      <NewProducts />
      <FeaturedProducts />
      <VideoBanner />
      <Newsletter />
    </>
  );
}
