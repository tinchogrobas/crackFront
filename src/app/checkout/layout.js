import { SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Checkout seguro',
  description: 'Finalizá tu compra en CRACK TCG.',
  alternates: { canonical: `${SITE_URL}/checkout` },
  robots: { index: false, follow: false, nocache: true },
};

export default function CheckoutLayout({ children }) {
  return children;
}
