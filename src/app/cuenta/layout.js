import { SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Mi cuenta',
  description: 'Ingresá a tu cuenta de CRACK TCG para ver tus pedidos y tus datos.',
  alternates: { canonical: `${SITE_URL}/cuenta` },
  robots: { index: false, follow: false, nocache: true },
};

export default function CuentaLayout({ children }) {
  return children;
}
