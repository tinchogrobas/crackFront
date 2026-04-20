import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

const canonical = `${SITE_URL}/privacidad`;
const title = 'Política de Privacidad';
const description =
  'Cómo CRACK® TCG trata tus datos personales: información recolectada, finalidad, cookies, destinatarios, conservación y derechos ARCO conforme a la Ley 25.326.';

export const metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: ['política de privacidad CRACK TCG', 'protección datos Argentina', 'Ley 25.326 ecommerce'],
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

export default function PrivacidadLayout({ children }) {
  return children;
}
