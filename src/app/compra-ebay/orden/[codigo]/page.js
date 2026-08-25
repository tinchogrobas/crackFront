import SeguimientoClient from './SeguimientoClient';

export const metadata = {
  title: 'Seguimiento de tu pedido',
  description: 'Seguí el estado de tu pedido de importación desde eBay.',
  // El pedido es información privada del cliente: no debe entrar en buscadores.
  robots: { index: false, follow: false, nocache: true },
};

export default async function SeguimientoPage({ params }) {
  const { codigo } = await params;
  return <SeguimientoClient codigo={codigo} />;
}
