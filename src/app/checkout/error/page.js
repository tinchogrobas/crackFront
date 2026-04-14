'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyMercadoPagoPayment } from '@/lib/api';
import CheckoutStatusView from '@/components/checkout/CheckoutStatusView';

function ErrorContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const externalReference = searchParams.get('external_reference') || searchParams.get('code');
  const orderCode = searchParams.get('code') || searchParams.get('external_reference');
  const [verifying, setVerifying] = useState(!!paymentId);
  const [orderStatus, setOrderStatus] = useState('rejected');
  let messages = [];
  try {
    const raw = searchParams.get('msgs');
    if (raw) messages = JSON.parse(decodeURIComponent(raw));
  } catch {}

  useEffect(() => {
    if (!paymentId) {
      setVerifying(false);
      return;
    }

    let cancelled = false;

    async function verifyPayment() {
      setVerifying(true);
      try {
        const data = await verifyMercadoPagoPayment({
          payment_id: paymentId,
          external_reference: externalReference || orderCode || '',
        });
        if (!cancelled) {
          // Actualizar estado según la respuesta del backend
          setOrderStatus(data.order_status || 'rejected');
        }
      } catch {
        if (!cancelled) {
          setOrderStatus('rejected');
        }
      } finally {
        if (!cancelled) {
          setVerifying(false);
        }
      }
    }

    verifyPayment();
    return () => { cancelled = true; };
  }, [paymentId, externalReference, orderCode]);

  return (
    <CheckoutStatusView
      variant="error"
      title={verifying ? 'VERIFICANDO TU PAGO...' : 'NO PUDIMOS PROCESAR TU PEDIDO'}
      statusLabel={`Estado: ${orderStatus === 'cancelled' ? 'Cancelado' : 'Rechazado'}`}
      message={verifying ? 'Estamos validando con Mercado Pago...' : messages.length > 0 ? messages.join(' ') : 'Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.'}
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
