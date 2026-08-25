'use client';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertTriangle, Globe, Loader2, PackageSearch, Search } from 'lucide-react';

import QuoteForm from '@/components/ebay/QuoteForm';
import QuoteCard from '@/components/ebay/QuoteCard';
import OrderPanel from '@/components/ebay/OrderPanel';
import CheckoutModal from '@/components/ebay/CheckoutModal';
import OrderSuccess from '@/components/ebay/OrderSuccess';
import { createEbayOrder, getEbayConfig, quoteEbayItem } from '@/lib/api';
import { useEbayCartStore } from '@/store/ebayCartStore';

export default function CompraEbayClient() {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [url, setUrl] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const items = useEbayCartStore((state) => state.items);
  const addItem = useEbayCartStore((state) => state.addItem);
  const removeItem = useEbayCartStore((state) => state.removeItem);
  const updateQuantity = useEbayCartStore((state) => state.updateQuantity);
  const clear = useEbayCartStore((state) => state.clear);
  const getTotals = useEbayCartStore((state) => state.getTotals);
  const toOrderItems = useEbayCartStore((state) => state.toOrderItems);

  // El store está persistido, así que en el primer render del servidor no hay
  // items y en el cliente sí. Esperar al montaje evita el warning de hidratación.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    getEbayConfig()
      .then((data) => { if (!cancelled) setConfig(data); })
      .catch(() => { if (!cancelled) setConfig(null); })
      .finally(() => { if (!cancelled) setConfigLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const maxQuantity = config?.max_quantity_per_item ?? 10;
  const maxItems = config?.max_items_per_order ?? 20;
  const sectionActive = configLoading || config?.is_active !== false;

  const totals = mounted ? getTotals() : {
    itemsTotal: 0, commissionTotal: 0, taxTotal: 0,
    ebayShippingTotal: 0, argShippingTotal: 0, total: 0,
  };
  const visibleItems = mounted ? items : [];

  const handleQuote = useCallback(async () => {
    if (!url.trim()) return;

    setQuoting(true);
    setQuoteError(null);
    try {
      const result = await quoteEbayItem(url.trim());
      setQuote(result);
    } catch (error) {
      setQuote(null);
      setQuoteError(error?.data?.detail || error.message || 'No pudimos cotizar esa publicación.');
    } finally {
      setQuoting(false);
    }
  }, [url]);

  function handleAdd(quantity) {
    if (visibleItems.length >= maxItems) {
      toast.error(`El pedido no puede tener más de ${maxItems} publicaciones.`);
      return;
    }

    const added = addItem({ ...quote, quote: { ...quote.quote, quantity } }, maxQuantity);
    if (!added) {
      toast.error(`Ya llegaste al máximo de ${maxQuantity} unidades de esa publicación.`);
      return;
    }

    toast.success('Agregado al pedido');
    setQuote(null);
    setUrl('');
  }

  async function handleSubmitOrder(form) {
    setSubmitting(true);
    setFieldErrors(null);
    try {
      const order = await createEbayOrder({ ...form, items: toOrderItems() });
      clear();
      setCheckoutOpen(false);
      setConfirmedOrder(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const data = error?.data || {};

      if (error.status === 409) {
        // Una publicación se cayó entre la cotización y la confirmación.
        const failed = visibleItems[data.item_index];
        toast.error(
          failed
            ? `"${failed.title.slice(0, 40)}…": ${data.detail}`
            : data.detail || 'Una de las publicaciones ya no está disponible.',
          { duration: 7000 }
        );
        if (failed) removeItem(failed.key);
        setCheckoutOpen(false);
      } else if (error.status === 400 && typeof data === 'object' && !data.detail) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
          )
        );
        toast.error('Revisá los datos del formulario.');
      } else {
        toast.error(data.detail || error.message || 'No pudimos confirmar el pedido.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
        <OrderSuccess order={confirmedOrder} onNewOrder={() => setConfirmedOrder(null)} />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 sm:mb-10"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#C8972E]">
            <Globe size={13} />
            Compra tus cartas desde el exterior
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A] mt-3">
            Nosotros las traemos<span className="text-[#C8972E]">.</span>
          </h1>
          <p className="text-sm text-[#6B6560] mt-3 max-w-2xl leading-relaxed">
            {config?.intro_text ||
              'Ingresá el enlace de eBay y conocé el costo final de importación, con todos los gastos incluidos.'}
          </p>
        </motion.header>

        {!sectionActive ? (
          <div className="max-w-lg mx-auto text-center bg-white border border-[#E8E4DD] rounded-2xl px-8 py-14">
            <PackageSearch size={36} className="mx-auto text-[#6B6560]/30" />
            <h2 className="text-xl font-black tracking-[-0.02em] text-[#1A1A1A] mt-5">
              Importaciones pausadas
            </h2>
            <p className="text-sm text-[#6B6560] mt-2.5 leading-relaxed">
              Por el momento no estamos tomando pedidos de importación. Escribinos y te
              avisamos cuando volvamos a abrirlos.
            </p>
            <Link
              href="/contacto"
              className="inline-block mt-6 text-xs tracking-[0.15em] font-medium border border-[#E8E4DD] px-6 py-3 hover:bg-[#F5F1EA] transition-all"
            >
              CONTACTANOS
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            {/* Columna izquierda: cotizador */}
            <div className="space-y-5 min-w-0">
              <QuoteForm
                url={url}
                onUrlChange={setUrl}
                onSubmit={handleQuote}
                loading={quoting}
                disabled={configLoading}
              />

              <AnimatePresence mode="wait">
                {quoting && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-[#E8E4DD] rounded-2xl p-6"
                  >
                    <div className="flex gap-4">
                      <div className="w-[88px] h-[88px] rounded-xl bg-[#F5F1EA] animate-pulse" />
                      <div className="flex-1 space-y-2.5 pt-1">
                        <div className="h-4 w-3/4 rounded bg-[#F5F1EA] animate-pulse" />
                        <div className="h-3 w-1/3 rounded bg-[#F5F1EA] animate-pulse" />
                        <div className="h-3 w-1/2 rounded bg-[#F5F1EA] animate-pulse" />
                      </div>
                    </div>
                    <p className="flex items-center gap-2 mt-6 text-xs text-[#6B6560]">
                      <Loader2 size={13} className="animate-spin text-[#C8972E]" />
                      Consultando la publicación en eBay…
                    </p>
                  </motion.div>
                )}

                {!quoting && quoteError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
                  >
                    <AlertTriangle size={17} className="shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">No pudimos cotizarla</p>
                      <p className="text-xs text-red-600 mt-1 leading-relaxed">{quoteError}</p>
                    </div>
                  </motion.div>
                )}

                {!quoting && quote && (
                  <QuoteCard
                    key={quote.item.item_id}
                    quote={quote}
                    onAdd={handleAdd}
                    onReset={() => { setQuote(null); setUrl(''); }}
                    maxQuantity={maxQuantity}
                  />
                )}

                {!quoting && !quote && !quoteError && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-dashed border-[#E8E4DD] rounded-2xl px-6 py-12 text-center"
                  >
                    <Search size={30} className="mx-auto text-[#6B6560]/25" />
                    <p className="text-sm font-semibold text-[#1A1A1A] mt-4">
                      Empezá pegando un link
                    </p>
                    <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed max-w-sm mx-auto">
                      Aceptamos links de publicaciones de compra directa en dólares.
                      También funciona con el número de publicación.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Columna derecha: el pedido */}
            <div className="lg:sticky lg:top-24">
              <OrderPanel
                items={visibleItems}
                totals={totals}
                onRemove={removeItem}
                onQuantityChange={(key, quantity) => updateQuantity(key, quantity, maxQuantity)}
                onCheckout={() => setCheckoutOpen(true)}
                maxQuantity={maxQuantity}
                submitting={submitting}
              />
            </div>
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={totals.total}
        itemCount={visibleItems.length}
        onSubmit={handleSubmitOrder}
        submitting={submitting}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
