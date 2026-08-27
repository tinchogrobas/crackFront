'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, X } from 'lucide-react';
import QuantityStepper from '@/components/ebay/QuantityStepper';
import { formatUsd } from '@/lib/formatUsd';

/**
 * Panel del pedido acumulado.
 *
 * En escritorio queda sticky a la derecha; en mobile el contenedor padre lo
 * ubica debajo de la cotización, porque una barra flotante taparía el desglose,
 * que es lo que la persona está leyendo.
 */
export default function OrderPanel({
  items,
  totals,
  onRemove,
  onQuantityChange,
  onCheckout,
  maxQuantity = 10,
  submitting,
}) {
  const isEmpty = items.length === 0;

  return (
    <div className="bg-white border border-[#E8E4DD] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E8E4DD]">
        <ClipboardList size={16} className="text-[#C8972E]" />
        <h2 className="font-display text-[13px] font-bold tracking-[0.15em] text-[#1A1A1A]">TU PEDIDO</h2>
        {!isEmpty && (
          <span className="ml-auto text-[11px] font-bold text-white bg-[#1A1A1A] rounded-full px-2.5 py-1 tabular-nums">
            {items.reduce((total, item) => total + item.quantity, 0)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="px-6 py-14 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#F5F1EA] grid place-items-center">
            <ClipboardList size={20} className="text-[#6B6560]/40" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">Sin cartas todavía</p>
          <p className="mt-1.5 text-xs text-[#6B6560] leading-relaxed max-w-[220px] mx-auto">
            Cotizá una publicación y agregala para armar el pedido.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[#E8E4DD] max-h-[380px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="px-4 py-3.5"
                >
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        loading="lazy"
                        className="w-12 h-12 shrink-0 rounded-lg object-cover border border-[#E8E4DD] bg-[#FAFAF7]"
                      />
                    ) : (
                      <div className="w-12 h-12 shrink-0 rounded-lg border border-[#E8E4DD] bg-[#FAFAF7]" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6B6560] mt-0.5">
                        {formatUsd(item.unitTotal)} c/u
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(item.key)}
                      aria-label={`Quitar ${item.title} del pedido`}
                      className="shrink-0 w-7 h-7 grid place-items-center rounded-lg text-[#6B6560]/60 hover:text-[#1A1A1A] hover:bg-[#F5F1EA] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pl-[60px]">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onChange={(quantity) => onQuantityChange(item.key, quantity)}
                      max={Math.min(maxQuantity, item.maxQuantity ?? maxQuantity)}
                      itemLabel={item.title}
                      maxReasonText={
                        (item.maxQuantity ?? maxQuantity) < maxQuantity
                          ? 'No quedan más unidades de esta publicación en eBay.'
                          : `El máximo por publicación es ${maxQuantity}.`
                      }
                    />

                    <span className="text-[13px] font-bold text-[#1A1A1A] tabular-nums">
                      {formatUsd(item.unitTotal * item.quantity)}
                    </span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Desglose acumulado */}
          <div className="px-5 py-4 border-t border-[#E8E4DD] bg-[#FAFAF7] space-y-2">
            {[
              ['Publicaciones', totals.itemsTotal],
              ['Comisión', totals.commissionTotal],
              ['Tax', totals.taxTotal],
              // Si alguna publicación no informó envío, el acumulado está
              // incompleto: mostrar un número redondo sería mentir.
              ['Envío eBay', totals.ebayShippingTotal, totals.shippingToConfirm],
              ['Envío a Argentina', totals.argShippingTotal],
            ].map(([label, value, partial]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[#6B6560]">{label}</span>
                <span className="text-xs font-medium text-[#1A1A1A] tabular-nums">
                  {formatUsd(value)}
                  {partial && (
                    <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#C8972E]">
                      + a confirmar
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-[#1A1A1A] flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/50">
              Total
            </span>
            <span className="text-2xl font-black text-white tabular-nums">
              {formatUsd(totals.total)}
            </span>
          </div>

          <div className="p-4">
            <button
              type="button"
              onClick={onCheckout}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-[#C8972E] text-white text-xs font-bold tracking-[0.14em] uppercase hover:bg-[#B8851F] transition-colors disabled:opacity-50"
            >
              Finalizar pedido
            </button>
            <p className="mt-3 text-[11px] text-[#6B6560] leading-relaxed text-center">
              Los valores están en dólares. El envío dentro de Argentina se coordina
              aparte cuando el pedido llega a la tienda.
              {totals.shippingToConfirm
                ? ' El envío de eBay de una de las publicaciones te lo confirmamos al aprobar el pedido.'
                : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
