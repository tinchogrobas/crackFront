import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

const canonical = `${SITE_URL}/contacto`;
const title = 'Contacto';
const description =
  'Escribinos por dudas sobre productos, envíos a todo el país, autenticidad de cartas o pedidos al por mayor. Te respondemos en menos de 24hs.';

export const metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: ['contacto CRACK TCG', 'atención al cliente Pokémon Argentina', 'soporte TCG'],
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: canonical,
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactoLayout({ children }) {
  return children;
}
