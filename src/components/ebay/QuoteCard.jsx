'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Info, Minus, Plus, Plus as PlusIcon, RotateCcw } from 'lucide-react';
import { formatUsd } from '@/lib/formatUsd';

/**
 * Resultado de la cotización.
 *
 * El desglose se muestra completo y sin colapsar: el valor de la sección es
 * justamente que el cliente vea de dónde sale cada dólar antes de comprometerse.
 * Las imágenes van con <img> y no con next/image porque vienen de i.ebayimg.com,
 * un origen externo que ya sirve la imagen en el tamaño correcto.
 */
export default function QuoteCard({ quote, onAdd, onReset, maxQuantity = 10 }) {
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  const { item, quote: breakdown } = quote;
  const unitTotal = Number(breakdown.unit_total);
  const lineTotal = unitTotal * quantity;

  const rows = [
    ['Precio publicación', breakdown.price],
    [`Comisión (${Number(breakdown.commission_percent)}%)`, breakdown.commission],
    [`Tax (${Number(breakdown.tax_percent)}%)`, breakdown.tax],
    ['Subtotal publicación', breakdown.item_with_fees, true],
    // eBay no siempre puede calcular el envío para el destino. Cuando no lo
    // informa, el número es una estimación nuestra y hay que decirlo: un 0 sin
    // aclarar se lee como "envío gratis" y después el reclamo es nuestro.
    ['Envío eBay', breakdown.ebay_shipping, false, !item.has_shipping_info],
    ['Envío a Argentina', breakdown.arg_shipping],
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Sin portapapeles disponible: el link igual está visible en "Ver en eBay". */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[#E8E4DD] rounded-2xl overflow-hidden"
    >
      {/* Cabecera del ítem */}
      <div className="p-5 sm:p-6 flex gap-4">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            width={88}
            height={88}
            loading="lazy"
            className="w-[88px] h-[88px] shrink-0 rounded-xl object-cover border border-[#E8E4DD] bg-[#FAFAF7]"
          />
        ) : (
          <div className="w-[88px] h-[88px] shrink-0 rounded-xl border border-[#E8E4DD] bg-[#FAFAF7]" />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] leading-snug line-clamp-2">
            {item.title}
          </h3>

          {item.condition && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F5F1EA] border border-[#E8E4DD] text-[11px] font-semibold text-[#1A1A1A]">
                {item.condition}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8972E] hover:underline"
            >
              Ver en eBay <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        </div>
      </div>

      {/* Desglose */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="rounded-xl border border-[#E8E4DD] divide-y divide-[#E8E4DD] overflow-hidden">
          {rows.map(([label, value, emphasis, toConfirm]) => (
            <div
              key={label}
              className={`flex items-center justify-between px-4 py-2.5 ${
                emphasis ? 'bg-[#FAFAF7]' : 'bg-white'
              }`}
            >
              <span
                className={`text-[13px] ${
                  emphasis ? 'font-semibold text-[#1A1A1A]' : 'text-[#6B6560]'
                }`}
              >
                {label}
              </span>
              <span
                className={`text-[13px] tabular-nums ${
                  emphasis ? 'font-bold text-[#1A1A1A]' : 'font-medium text-[#1A1A1A]'
                }`}
              >
                {toConfirm && (
                  <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-[#C8972E] tabular-nums-none">
                    a confirmar
                  </span>
                )}
                {formatUsd(value)}
              </span>
            </div>
          ))}
        </div>

        {!item.has_shipping_info && (
          <p className="flex items-start gap-2 mt-3 text-[11px] text-[#6B6560] leading-relaxed">
            <Info size={13} className="shrink-0 mt-0.5 text-[#C8972E]" />
            eBay no informó el costo de envío de esta publicación. El valor que ves es una
            estimación nuestra: lo confirmamos al aprobar el pedido, antes de que pagues.
          </p>
        )}

        {item.is_mock && (
          <p className="flex items-start gap-2 mt-3 text-[11px] text-[#6B6560] leading-relaxed">
            <Info size={13} className="shrink-0 mt-0.5 text-[#C8972E]" />
            Datos de demostración: la conexión con eBay todavía no está configurada.
          </p>
        )}

        {/* Total */}
        <div className="mt-4 rounded-xl bg-[#1A1A1A] px-5 py-4 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-white/50">
              Total a cobrar
            </span>
            {quantity > 1 && (
              <span className="block text-[11px] text-white/60 mt-0.5">
                {formatUsd(unitTotal)} × {quantity}
              </span>
            )}
          </div>
          <span className="text-2xl font-black text-white tabular-nums">
            {formatUsd(lineTotal)}
          </span>
        </div>

        {/* Acciones */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-[#E8E4DD] bg-white h-11">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Quitar una unidad"
              className="w-10 h-full grid place-items-center text-[#6B6560] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="w-9 text-center text-sm font-bold text-[#1A1A1A] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Agregar una unidad"
              className="w-10 h-full grid place-items-center text-[#6B6560] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAdd(quantity)}
            className="flex-1 min-w-[190px] h-11 px-6 rounded-xl bg-[#C8972E] text-white text-xs font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#B8851F] transition-colors"
          >
            <PlusIcon size={15} />
            Agregar al pedido
          </button>

          <button
            type="button"
            onClick={onReset}
            className="h-11 px-4 rounded-xl border border-[#E8E4DD] text-xs font-semibold text-[#6B6560] inline-flex items-center gap-2 hover:border-[#D4CFC6] hover:text-[#1A1A1A] transition-colors"
          >
            <RotateCcw size={14} />
            Nueva
          </button>
        </div>
      </div>
    </motion.div>
  );
}
