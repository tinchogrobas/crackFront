'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckoutStatusView from '@/components/checkout/CheckoutStatusView';

function PendingContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('code') || searchParams.get('external_reference') || '';
  const email = searchParams.get('email') || '';

  return (
    <CheckoutStatusView
      variant="pending"
      title="PAGO PENDIENTE"
      statusLabel="Estado: En revision"
      message="Recibimos tu pedido y el pago quedo en revision. Te avisaremos apenas se acredite."
      email={email}
      orderCode={orderCode}
      actions={[
        { href: '/checkout/confirmacion', label: 'REVISAR ESTADO', primary: true },
        { href: '/tienda', label: 'VOLVER A LA TIENDA', primary: false },
      ]}
    />
  );
}

export default function PendientePage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-20 min-h-screen flex items-center justify-center text-[#6B6560] text-sm">Cargando...</div>}>
      <PendingContent />
    </Suspense>
  );
}
