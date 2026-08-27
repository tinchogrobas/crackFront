'use client';
import { Check, Clock, X } from 'lucide-react';

/**
 * Línea de tiempo del pedido.
 *
 * Los pasos se derivan de los timestamps, no del estado: así el cliente ve todo
 * el recorrido y no solo dónde está parado. El rechazo corta el recorrido, por
 * eso reemplaza la lista en vez de sumarse al final.
 */

const STEPS = [
  { key: 'created_at', label: 'Pedido recibido', hint: 'Estamos revisando las publicaciones.' },
  { key: 'approved_at', label: 'Pedido aprobado', hint: 'Coordinamos el pago por WhatsApp.' },
  { key: 'payment_received_at', label: 'Pago recibido', hint: 'Compramos las publicaciones en eBay.' },
  { key: 'arrived_at', label: 'En Argentina', hint: 'Tu pedido está en la tienda.' },
  { key: 'delivered_at', label: 'Entregado', hint: 'Pedido cerrado. ¡Gracias!' },
];

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderTimeline({ order }) {
  const rejected = Boolean(order.rejected_at);

  const steps = rejected
    ? [
        { key: 'created_at', label: 'Pedido recibido', hint: '' },
        { key: 'rejected_at', label: 'Pedido no aprobado', hint: order.rejection_message || '', failed: true },
      ]
    : STEPS;

  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const done = Boolean(order[step.key]);
        const isLast = index === steps.length - 1;
        // El primero sin completar es el que está "en curso" ahora mismo.
        const current = !done && steps.slice(0, index).every((previous) => order[previous.key]);
        const failed = step.failed && done;

        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 bottom-0 w-px ${
                  done ? 'bg-[#C8972E]' : 'bg-[#E8E4DD]'
                }`}
              />
            )}

            <span
              className={`relative z-10 shrink-0 w-8 h-8 rounded-full grid place-items-center border-2 ${
                failed
                  ? 'bg-red-500 border-red-500 text-white'
                  : done
                  ? 'bg-[#C8972E] border-[#C8972E] text-white'
                  : current
                  ? 'bg-white border-[#C8972E] text-[#C8972E]'
                  : 'bg-white border-[#E8E4DD] text-[#6B6560]/40'
              }`}
            >
              {failed ? <X size={14} strokeWidth={3} />
                : done ? <Check size={14} strokeWidth={3} />
                : <Clock size={13} />}
            </span>

            <div className="min-w-0 pt-1">
              <p
                className={`text-sm font-bold ${
                  failed ? 'text-red-600' : done || current ? 'text-[#1A1A1A]' : 'text-[#6B6560]/60'
                }`}
              >
                {step.label}
              </p>
              {done && (
                <p className="text-[11px] text-[#6B6560] mt-0.5 tabular-nums">
                  {formatDate(order[step.key])}
                </p>
              )}
              {step.hint && (done || current) && (
                <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed max-w-md whitespace-pre-line">
                  {step.hint}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
