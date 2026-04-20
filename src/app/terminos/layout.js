import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

const canonical = `${SITE_URL}/terminos`;
const title = 'Términos y Condiciones';
const description =
  'Condiciones generales de uso y compra en CRACK® TCG: envíos a todo el país, pagos, cambios, autenticidad de cartas Pokémon y jurisdicción aplicable.';

export const metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: ['términos y condiciones CRACK TCG', 'política de compra Pokémon Argentina', 'condiciones TCG'],
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

export default function TerminosLayout({ children }) {
  return children;
}
