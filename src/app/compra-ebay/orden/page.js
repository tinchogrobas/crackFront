import { SITE_URL } from '@/lib/seo';

import BuscarOrdenClient from './BuscarOrdenClient';

export const metadata = {
  title: 'Seguí tu pedido de eBay',
  description:
    'Ingresá el código de tu pedido de importación y mirá en qué estado está: aprobación, pago, llegada a la tienda y entrega.',
  alternates: { canonical: `${SITE_URL}/compra-ebay/orden` },
};

export default function BuscarOrdenPage() {
  return <BuscarOrdenClient />;
}
