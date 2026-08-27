import { SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Importá tu carta desde eBay',
  description:
    'Ingresá el enlace de eBay y conocé el costo final de importación, con todos los gastos incluidos: precio, comisión, tax y envíos.',
  alternates: { canonical: `${SITE_URL}/compra-ebay` },
  openGraph: {
    title: 'Importá tu carta desde eBay — CRACK TCG',
    description:
      'Cotizá en segundos cuánto sale traer una carta de eBay a Argentina. Armá tu pedido y nosotros nos encargamos del resto.',
    url: `${SITE_URL}/compra-ebay`,
    type: 'website',
  },
};

export default function CompraEbayLayout({ children }) {
  return children;
}
