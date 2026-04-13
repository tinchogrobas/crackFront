'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckoutStatusView from '@/components/checkout/CheckoutStatusView';

function ErrorContent() {
  const searchParams = useSearchParams();
  let messages = [];
  try {
    const raw = searchParams.get('msgs');
    if (raw) messages = JSON.parse(decodeURIComponent(raw));
  } catch {}

  return (
    <CheckoutStatusView
      variant="error"
      title="NO PUDIMOS PROCESAR TU PEDIDO"
      statusLabel="Estado: Rechazado"
      message={messages.length > 0 ? messages.join(' ') : 'Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.'}
      actions={[
        { href: '/checkout', label: 'VOLVER AL CHECKOUT', primary: true },
        { href: '/tienda', label: 'IR A LA TIENDA', primary: false },
      ]}
    />
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
