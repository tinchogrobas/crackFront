import { SITE_URL, SITE_NAME } from '@/lib/seo';

const canonical = `${SITE_URL}/otros-productos`;
const title = 'Otros productos — próximamente';
const description =
  'Nuevas categorías llegan pronto a CRACK TCG: coleccionables, merchandising y más. Seguinos para enterarte primero.';

export const metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: canonical,
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
  },
  robots: { index: true, follow: true },
};

export default function OtrosProductosLayout({ children }) {
  return children;
}
