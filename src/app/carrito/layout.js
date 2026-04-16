import { SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Tu carrito',
  description: 'Revisá los productos de tu carrito antes de finalizar la compra.',
  alternates: { canonical: `${SITE_URL}/carrito` },
  robots: { index: false, follow: false, nocache: true },
};

export default function CarritoLayout({ children }) {
  return children;
}
