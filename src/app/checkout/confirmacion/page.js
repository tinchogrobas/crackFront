'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyMercadoPagoPayment } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import CheckoutStatusView from '@/components/checkout/CheckoutStatusView';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('code') || searchParams.get('external_reference');
  const orderId = searchParams.get('order');
  const email = searchParams.get('email');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const mpStatus = searchParams.get('status');
  const cashOrder = searchParams.get('cash') === '1';
  const clearCart = useCartStore((s) => s.clearCart);
  const [verifying, setVerifying] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(cashOrder);
  const [isPending, setIsPending] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    if (cashOrder) {
      clearCart();
      setIsPending(false);
      return;
    }

    if (!paymentId) {
      setPaymentVerified(false);
      if (mpStatus === 'pending' || mpStatus === 'in_process') {
        setIsPending(true);
        setPaymentMessage('Tu pago está pendiente. Te avisaremos cuando se acredite.');
      } else {
        setIsPending(false);
        setPaymentMessage('Recibimos tu pedido. Falta confirmar el pago para finalizar la compra.');
      }
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
        if (cancelled) return;

        if (data.paid) {
          setPaymentVerified(true);
          setIsPending(false);
          clearCart();
        } else {
          setPaymentVerified(false);
          if (data.payment_status === 'pending' || data.payment_status === 'in_process') {
            setIsPending(true);
            setPaymentMessage('Tu pago está pendiente. Te avisaremos cuando se acredite.');
          } else {
            setIsPending(false);
            setPaymentMessage('No pudimos validar el pago todavía. Si ya pagaste, no te preocupes: lo confirmamos por webhook.');
          }
        }
      } catch {
        if (!cancelled) {
          setPaymentVerified(false);
          setIsPending(false);
          setPaymentMessage('No pudimos verificar el pago en este momento. Si ya pagaste, se confirmará automáticamente en unos minutos.');
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    verifyPayment();
    return () => { cancelled = true; };
  }, [paymentId, externalReference, orderCode, cashOrder, clearCart, mpStatus]);

  const variant = paymentVerified ? 'success' : (isPending ? 'pending' : 'error');
  const title = paymentVerified
    ? 'PEDIDO CONFIRMADO'
    : (isPending ? 'PAGO PENDIENTE' : 'PEDIDO RECIBIDO');
  const statusLabel = paymentVerified
    ? 'Estado: Aprobado'
    : (isPending ? 'Estado: En revision' : 'Estado: Validacion requerida');

  return (
    <CheckoutStatusView
      variant={variant}
      title={title}
      statusLabel={statusLabel}
      message={paymentMessage || 'Estamos revisando tu pedido y te contactaremos a la brevedad para coordinar el envio.'}
      email={email}
      orderCode={orderCode}
      loadingText={verifying ? 'Verificando tu pago...' : ''}
      actions={[
        { href: '/tienda', label: 'VOLVER A LA TIENDA', primary: false },
      ]}
    />
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-20 min-h-screen flex items-center justify-center text-[#6B6560] text-sm">Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
