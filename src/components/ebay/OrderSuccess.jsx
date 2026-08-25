'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Copy, Mail } from 'lucide-react';
import { formatUsd } from '@/lib/formatUsd';

/**
 * Pantalla posterior a la confirmación.
 *
 * Lo único que la persona necesita retener es el código, así que ocupa el
 * centro y se puede copiar de un click.
 */
export default function OrderSuccess({ order, onNewOrder }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Sin portapapeles: el código está a la vista igual. */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto"
    >
      <div className="bg-white border border-[#E8E4DD] rounded-2xl overflow-hidden">
        <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto rounded-full bg-[#C8972E] grid place-items-center"
          >
            <Check size={28} className="text-white" strokeWidth={3} />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.02em] text-[#1A1A1A] mt-6">
            ¡Gracias por realizar la orden!
          </h1>

          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#6B6560] mt-7">
            Tu código de pedido
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="group mt-2 inline-flex items-center gap-3 text-4xl sm:text-5xl font-black text-[#C8972E] tracking-[0.08em] tabular-nums"
          >
            {order.order_code}
            <span className="text-[#6B6560]/40 group-hover:text-[#C8972E] transition-colors">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </span>
          </button>
          <p className="text-[11px] text-[#6B6560] mt-2">
            {copied ? '¡Copiado!' : 'Tocá el código para copiarlo'}
          </p>
        </div>

        <div className="px-6 sm:px-10 py-6 bg-[#FAFAF7] border-y border-[#E8E4DD]">
          <div className="flex gap-3.5">
            <Mail size={18} className="shrink-0 mt-0.5 text-[#C8972E]" />
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              <strong>Dentro de las 24 horas</strong> vas a recibir una notificación de
              aprobación de la orden por correo. Ahí te contamos cómo seguir con el pago.
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-5 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6B6560]">
            Total del pedido
          </span>
          <span className="text-xl font-black text-[#1A1A1A] tabular-nums">
            {formatUsd(order.total)}
          </span>
        </div>

        <div className="px-6 sm:px-10 pb-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/compra-ebay/orden/${order.order_code}`}
            className="flex-1 h-12 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center hover:bg-[#C8972E] transition-colors"
          >
            Seguir mi pedido
          </Link>
          <button
            type="button"
            onClick={onNewOrder}
            className="flex-1 h-12 rounded-xl border border-[#E8E4DD] text-xs font-bold tracking-[0.12em] uppercase text-[#6B6560] hover:border-[#D4CFC6] hover:text-[#1A1A1A] transition-colors"
          >
            Hacer otro pedido
          </button>
        </div>
      </div>
    </motion.div>
  );
}
