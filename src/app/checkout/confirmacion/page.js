'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { verifyMercadoPagoPayment } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import CheckoutStatusView from '@/components/checkout/CheckoutStatusView';
import { invalidateNewArrivalsCache } from '@/components/home/NewProducts';
import { invalidateFeaturedProductsCache } from '@/components/home/FeaturedProducts';
import { hasTrackedPurchase, trackPurchase } from '@/lib/analytics';

function invalidateHomeProductCaches() {
  invalidateNewArrivalsCache();
  invalidateFeaturedProductsCache();
}

function ConfirmacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('code') || searchParams.get('external_reference');
  const email = searchParams.get('email');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const mpStatus = (searchParams.get('status') || '').toLowerCase();
  const transferOrder = searchParams.get('transfer') === '1';
  const clearCart = useCartStore((s) => s.clearCart);

  /**
   * Foto del carrito al entrar, antes de que `clearCart()` lo vacie.
   *
   * Es el unico lugar donde todavia estan los items comprados: el backend no
   * devuelve el detalle de la orden en la verificacion, y sin items la
   * conversion llegaria sin productos ni valor. Se toma en el primer render
   * porque con Mercado Pago el cliente vuelve de un dominio externo y lo unico
   * que sobrevive es el carrito persistido en localStorage.
   */
  const purchaseSnapshotRef = useRef(null);
  if (purchaseSnapshotRef.current === null) {
    const state = useCartStore.getState();
    purchaseSnapshotRef.current = { items: state.items, value: state.getTotal() };
  }

  /**
   * Dispara la conversion una sola vez por orden. `hasTrackedPurchase` la marca
   * en sessionStorage: sin eso, un F5 en esta pantalla suma otra compra a Google
   * Ads y a Meta, y el ROAS reportado deja de tener relacion con la realidad.
   */
  const firePurchase = (code) => {
    const snapshot = purchaseSnapshotRef.current;
    if (!code || !snapshot?.items?.length) return;
    if (hasTrackedPurchase(code)) return;
    trackPurchase({
      transactionId: code,
      items: snapshot.items,
      value: snapshot.value,
      coupon: useCartStore.getState().discountCode || undefined,
      user: email ? { email } : undefined,
    });
  };
  const [verifying, setVerifying] = useState(!transferOrder);
  const [paymentVerified, setPaymentVerified] = useState(transferOrder);
  const [isPending, setIsPending] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    if (!transferOrder && (mpStatus === 'rejected' || mpStatus === 'cancelled')) {
      const params = new URLSearchParams();
      if (orderCode) params.set('code', orderCode);
      if (externalReference) params.set('external_reference', externalReference);
      router.replace(`/checkout/error?${params.toString()}`);
      return;
    }

    if (transferOrder) {
      setVerifying(false);
      firePurchase(orderCode);
      clearCart();
      invalidateHomeProductCaches();
      setIsPending(false);
      return;
    }

    if (!paymentId && !(externalReference || orderCode)) {
      setVerifying(false);
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
      setPaymentMessage('Estamos validando el estado final de tu pago con Mercado Pago.');
      try {
        const data = await verifyMercadoPagoPayment({
          payment_id: paymentId || '',
          external_reference: externalReference || orderCode || '',
        });
        if (cancelled) return;

        if (data.paid) {
          setPaymentVerified(true);
          setIsPending(false);
          firePurchase(data.order_code || orderCode);
          clearCart();
          invalidateHomeProductCaches();
        } else {
          if (data.payment_status === 'rejected' || data.payment_status === 'cancelled') {
            const params = new URLSearchParams();
            if (orderCode) params.set('code', orderCode);
            if (externalReference) params.set('external_reference', externalReference);
            router.replace(`/checkout/error?${params.toString()}`);
            return;
          }

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
  }, [paymentId, externalReference, orderCode, transferOrder, clearCart, mpStatus, router]);

  const variant = verifying ? 'pending' : (paymentVerified ? 'success' : (isPending ? 'pending' : 'error'));

  // La transferencia tiene su propio texto: la orden existe y el comprobante
  // esta cargado, pero el pago todavia no esta verificado. Decir "Aprobado"
  // aca seria mentirle al comprador sobre algo que nadie miro todavia.
  const title = transferOrder
    ? 'ORDEN GENERADA'
    : verifying
    ? 'VALIDANDO PAGO'
    : paymentVerified
    ? 'PEDIDO CONFIRMADO'
    : (isPending ? 'PAGO PENDIENTE' : 'PEDIDO RECIBIDO');
  const statusLabel = transferOrder
    ? 'Estado: Verificando transferencia'
    : verifying
    ? 'Estado: Verificando'
    : paymentVerified
    ? 'Estado: Aprobado'
    : (isPending ? 'Estado: En revision' : 'Estado: Validacion requerida');
  const defaultMessage = transferOrder
    ? 'Tu orden se generó exitosamente. Te notificaremos apenas verifiquemos la transferencia.'
    : 'Estamos revisando tu pedido y te contactaremos a la brevedad para coordinar el envio.';

  return (
    <CheckoutStatusView
      variant={variant}
      title={title}
      statusLabel={statusLabel}
      message={paymentMessage || defaultMessage}
      email={verifying ? '' : email}
      orderCode={verifying ? '' : orderCode}
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
