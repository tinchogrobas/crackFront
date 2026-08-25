'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, MessageCircle, PackageSearch } from 'lucide-react';

import OrderTimeline from '@/components/ebay/OrderTimeline';
import { getEbayOrder } from '@/lib/api';
import { formatUsd } from '@/lib/formatUsd';

const WHATSAPP_NUMBER = '541150588131';

const STATUS_STYLES = {
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
  in_argentina: 'bg-violet-50 text-violet-700 border-violet-200',
  delivered: 'bg-[#F5F1EA] text-[#6B6560] border-[#E8E4DD]',
};

/**
 * Mensaje de WhatsApp según el paso.
 * Es el mismo texto que llevan los botones de los emails, para que la
 * conversación arranque igual sin importar por dónde entró la persona.
 */
function whatsappMessage(order) {
  if (order.status === 'approved') {
    return `Hola CRACKTCG, me contacto por el pedido ${order.order_code} de eBay, que fue aprobado, para coordinar el pago.`;
  }
  if (order.status === 'in_argentina') {
    return `Hola CRACKTCG, me contacto por el pedido ${order.order_code} de eBay, que ya llegó a la tienda, para coordinar el retiro o el envío.`;
  }
  return `Hola CRACKTCG, me contacto por el pedido ${order.order_code} de eBay.`;
}

export default function SeguimientoClient({ codigo }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getEbayOrder(codigo)
      .then((data) => { if (!cancelled) setOrder(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [codigo]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin text-[#C8972E]" />
        <p className="text-sm text-[#6B6560]">Buscando tu pedido…</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="pt-28 pb-24 px-4">
        <div className="max-w-md mx-auto text-center bg-white border border-[#E8E4DD] rounded-2xl px-8 py-14">
          <PackageSearch size={36} className="mx-auto text-[#6B6560]/30" />
          <h1 className="text-xl font-black tracking-[-0.02em] text-[#1A1A1A] mt-5">
            No encontramos ese pedido
          </h1>
          <p className="text-sm text-[#6B6560] mt-2.5 leading-relaxed">
            Revisá que el código <strong className="text-[#1A1A1A]">{codigo}</strong> esté bien
            escrito. Lo tenés en el email de confirmación.
          </p>
          <Link
            href="/compra-ebay"
            className="inline-flex items-center gap-2 mt-6 text-xs tracking-[0.15em] font-medium border border-[#E8E4DD] px-6 py-3 hover:bg-[#F5F1EA] transition-all"
          >
            <ArrowLeft size={13} />
            VOLVER
          </Link>
        </div>
      </div>
    );
  }

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage(order))}`;
  const showWhatsapp = ['approved', 'in_argentina'].includes(order.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pt-24 pb-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/compra-ebay"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#6B6560] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          Volver a la calculadora
        </Link>

        {/* Cabecera */}
        <div className="bg-white border border-[#E8E4DD] rounded-2xl px-6 sm:px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#6B6560]">
                Pedido de importación
              </p>
              <h1 className="text-3xl font-black text-[#C8972E] tracking-[0.06em] mt-1 tabular-nums">
                {order.order_code}
              </h1>
              <p className="text-xs text-[#6B6560] mt-2">
                A nombre de {order.customer_name} · {order.delivery_type_label}
              </p>
            </div>

            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-bold ${
                STATUS_STYLES[order.status] || 'bg-[#F5F1EA] text-[#6B6560] border-[#E8E4DD]'
              }`}
            >
              {order.status_label}
            </span>
          </div>

          {order.has_price_changes && (
            <div className="flex gap-3 mt-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Alguna publicación cambió de precio en eBay entre tu cotización y la confirmación.
                Los valores de abajo son los definitivos.
              </p>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="bg-white border border-[#E8E4DD] rounded-2xl px-6 sm:px-8 py-7 mt-5">
          <h2 className="text-base font-bold text-[#1A1A1A] mb-6">
            Estado del pedido
          </h2>
          <OrderTimeline order={order} />

          {showWhatsapp && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 w-full h-12 rounded-xl bg-[#C8972E] text-white text-xs font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#B8851F] transition-colors"
            >
              <MessageCircle size={15} />
              {order.status === 'approved' ? 'Coordinar el pago' : 'Coordinar la entrega'}
            </a>
          )}
        </div>

        {/* Detalle */}
        <div className="bg-white border border-[#E8E4DD] rounded-2xl overflow-hidden mt-5">
          <h2 className="text-base font-bold text-[#1A1A1A] px-6 sm:px-8 py-5 border-b border-[#E8E4DD]">
            Publicaciones
          </h2>

          <ul className="divide-y divide-[#E8E4DD]">
            {order.items.map((item) => (
              <li key={item.id} className="px-6 sm:px-8 py-4 flex gap-4">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="w-14 h-14 shrink-0 rounded-lg object-cover border border-[#E8E4DD] bg-[#FAFAF7]"
                  />
                ) : (
                  <div className="w-14 h-14 shrink-0 rounded-lg border border-[#E8E4DD] bg-[#FAFAF7]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{item.title}</p>
                  <p className="text-[11px] text-[#6B6560] mt-1">x{item.quantity}</p>
                  {item.price_changed && item.original_price && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Precio actualizado: {formatUsd(item.original_price)} → {formatUsd(item.price)}
                    </p>
                  )}
                </div>

                <span className="text-sm font-bold text-[#1A1A1A] tabular-nums whitespace-nowrap">
                  {formatUsd(item.line_total)}
                </span>
              </li>
            ))}
          </ul>

          <div className="px-6 sm:px-8 py-5 bg-[#FAFAF7] border-t border-[#E8E4DD] space-y-2">
            {[
              ['Publicaciones', order.items_total],
              [`Comisión (${Number(order.commission_percent)}%)`, order.commission_total],
              [`Tax (${Number(order.tax_percent)}%)`, order.tax_total],
              ['Envío eBay', order.ebay_shipping_total],
              ['Envío a Argentina', order.arg_shipping_total],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[#6B6560]">{label}</span>
                <span className="text-xs font-medium text-[#1A1A1A] tabular-nums">
                  {formatUsd(value)}
                </span>
              </div>
            ))}
          </div>

          <div className="px-6 sm:px-8 py-5 bg-[#1A1A1A] flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/50">
              Total
            </span>
            <span className="text-2xl font-black text-white tabular-nums">
              {formatUsd(order.total)}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#6B6560] mt-5 text-center leading-relaxed">
          Los importes están en dólares estadounidenses. El envío dentro de Argentina
          no está incluido: lo coordinamos cuando el pedido llega a la tienda.
        </p>
      </div>
    </motion.div>
  );
}
