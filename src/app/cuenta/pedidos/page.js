'use client';
import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CreditCard, MapPin, Package, Truck } from 'lucide-react';
import AccountShell, { AccountLoading } from '@/components/account/AccountShell';
import { useSession } from '@/components/account/SessionProvider';
import { cardClass, primaryButton, sectionTitle } from '@/components/account/ui';
import { getOrders } from '@/lib/customerApi';
import { formatPrice } from '@/lib/formatPrice';
import { imgProps } from '@/lib/imageProps';

const TONES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-[#F5F1EA] text-[#6B6560] border-[#E8E4DD]',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

const formatDateTime = (iso) => {
  const date = new Date(iso);
  const day = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day}, ${time} hs`;
};

const itemCount = (order) => order.items.reduce((total, item) => total + item.quantity, 0);

function Thumb({ item, className = 'w-12 h-12' }) {
  const image = imgProps(item.image_url, 'line');
  return (
    <div className={`relative flex-shrink-0 bg-[#F5F1EA] border border-[#E8E4DD] rounded-lg overflow-hidden ${className}`}>
      {image ? (
        <img {...image} alt={item.product_name} className="absolute inset-0 w-full h-full object-contain p-1" />
      ) : (
        <Package size={16} className="absolute inset-0 m-auto text-[#6B6560]/40" />
      )}
    </div>
  );
}

function DetailBlock({ icon: Icon, title, children }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[#1A1A1A] mb-2.5">
        <Icon size={14} className="text-[#C8972E]" />
        {title}
      </p>
      <div className="text-[13px] text-[#6B6560] leading-relaxed">{children}</div>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <ol className="relative">
      {events.map((event, i) => {
        const last = i === events.length - 1;
        return (
          <li key={`${event.title}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-[#E8E4DD]" aria-hidden="true" />}
            <span
              className={`relative mt-1.5 w-[11px] h-[11px] rounded-full flex-shrink-0 border-2 ${
                last ? 'bg-[#C8972E] border-[#C8972E]' : 'bg-white border-[#C8972E]'
              }`}
              aria-hidden="true"
            />
            <div>
              <p className={`text-[13px] ${last ? 'font-semibold text-[#1A1A1A]' : 'text-[#1A1A1A]'}`}>{event.title}</p>
              {event.at && <p className="text-[12px] text-[#6B6560] tabular-nums">{formatDateTime(event.at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetail({ order }) {
  const isPickup = order.shipping_type === 'pickup';
  const isBranch = order.shipping_method === 'branch_normal' || order.shipping_method === 'branch_express';
  const place = [order.shipping_city, order.shipping_province].filter(Boolean).join(', ');
  const summary = [
    ['Subtotal', formatPrice(order.subtotal)],
    Number(order.shipping_cost) > 0 && ['Envío', formatPrice(order.shipping_cost)],
    Number(order.discount_amount) > 0 && ['Descuento', `−${formatPrice(order.discount_amount)}`],
    Number(order.card_surcharge_amount) > 0 && ['Recargo Mercado Pago', formatPrice(order.card_surcharge_amount)],
  ].filter(Boolean);

  return (
    <div className="border-t border-[#E8E4DD]">
      <div className="grid gap-8 md:grid-cols-[1fr_260px] px-5 sm:px-6 py-6">
        {/* Productos + resumen */}
        <div className="min-w-0">
          <ul className="divide-y divide-[#E8E4DD]/70">
            {order.items.map((item, i) => (
              <li key={`${item.product_name}-${i}`} className="flex items-center gap-4 py-3 first:pt-0">
                <Thumb item={item} className="w-14 h-14" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">
                    {item.slug ? (
                      <Link href={`/tienda/${item.slug}`} className="hover:text-[#C8972E] transition-colors">{item.product_name}</Link>
                    ) : (
                      item.product_name
                    )}
                  </p>
                  <p className="text-[12px] text-[#6B6560] mt-0.5 tabular-nums">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-[#1A1A1A] tabular-nums">{formatPrice(item.subtotal)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 pt-4 border-t border-[#E8E4DD] space-y-1.5 text-[13px]">
            {summary.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-[#6B6560]">
                <dt>{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-1.5 text-[15px] font-bold text-[#1A1A1A]">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Seguimiento, entrega y pago */}
        <div className="space-y-6 md:border-l md:border-[#E8E4DD] md:pl-8">
          <DetailBlock icon={Package} title="Seguimiento">
            <Timeline events={order.timeline} />
          </DetailBlock>

          <DetailBlock icon={isPickup ? MapPin : Truck} title="Entrega">
            {isPickup ? (
              <p>Retiro en el local</p>
            ) : (
              <>
                <p className="text-[#1A1A1A]">{order.shipping_method_label}</p>
                {order.shipping_address && <p>{isBranch ? `Sucursal: ${order.shipping_address}` : order.shipping_address}</p>}
                {(place || order.shipping_zip) && <p>{[place, order.shipping_zip && `CP ${order.shipping_zip}`].filter(Boolean).join(' · ')}</p>}
              </>
            )}
            {order.tracking && (
              <p className="mt-2">
                {order.tracking.carrier}:{' '}
                {order.tracking.url ? (
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] font-medium underline underline-offset-2">
                    {order.tracking.code}
                  </a>
                ) : (
                  <span className="text-[#1A1A1A] font-medium">{order.tracking.code}</span>
                )}
              </p>
            )}
          </DetailBlock>

          <DetailBlock icon={CreditCard} title="Pago">
            <p className="text-[#1A1A1A]">{order.payment_method_label}</p>
            {order.payment?.operation_id && <p>N° de operación: <span className="tabular-nums">{order.payment.operation_id}</span></p>}
            {order.payment?.approved_at && <p>Acreditado el {formatDateTime(order.payment.approved_at)}</p>}
          </DetailBlock>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, open, onToggle }) {
  const panelId = useId();
  const count = itemCount(order);
  const preview = order.items.slice(0, 3);
  const extra = order.items.length - preview.length;

  return (
    <article className={`${cardClass} overflow-hidden transition-shadow ${open ? 'shadow-[0_4px_16px_rgba(0,0,0,0.05)]' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-[#FAFAF7] transition-colors"
      >
        <div className="hidden sm:flex -space-x-3">
          {preview.map((item, i) => (
            <Thumb key={`${item.product_name}-${i}`} item={item} className="w-12 h-12 ring-2 ring-white" />
          ))}
          {extra > 0 && (
            <span className="w-12 h-12 rounded-lg bg-[#F5F1EA] border border-[#E8E4DD] ring-2 ring-white flex items-center justify-center text-[12px] font-semibold text-[#6B6560]">
              +{extra}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[#1A1A1A]">Pedido #{order.order_code}</p>
          <p className="text-[12px] text-[#6B6560] mt-0.5">
            {formatDate(order.created_at)} · {count} {count === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-5">
          <span className={`text-[11px] font-semibold tracking-[0.03em] px-2.5 py-1 rounded-full border whitespace-nowrap ${TONES[order.status_tone] || TONES.neutral}`}>
            {order.status_label}
          </span>
          <span className="text-[15px] font-bold text-[#1A1A1A] tabular-nums">{formatPrice(order.total)}</span>
        </div>

        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-[#6B6560] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <OrderDetail order={order} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function Orders() {
  const { profile, profileError } = useSession();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [openCode, setOpenCode] = useState(null);

  // Se espera a que termine la sincronización de la sesión: es la que trae
  // las compras de invitado, y sin eso la primera visita las mostraría vacías.
  const ready = Boolean(profile || profileError);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    getOrders()
      .then((data) => !cancelled && setOrders(data))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [ready]);

  if (error) {
    return <p className="text-[13px] text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">{error}</p>;
  }
  if (!orders) return <AccountLoading />;

  return (
    <div>
      <h1 className={`${sectionTitle} mb-6`}>Pedidos</h1>
      {orders.length === 0 ? (
        <div className={`${cardClass} px-6 py-12 text-center`}>
          <Package size={28} className="mx-auto text-[#C8972E]" />
          <p className="text-[15px] font-semibold text-[#1A1A1A] mt-4">Todavía no tenés pedidos</p>
          <p className="text-[13px] text-[#6B6560] mt-1 max-w-sm mx-auto">
            Si compraste sin cuenta con este mismo email, tus pedidos aparecen acá solos.
          </p>
          <Link href="/tienda" className={`${primaryButton} mt-6`}>IR A LA TIENDA</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow
              key={order.order_code}
              order={order}
              open={openCode === order.order_code}
              onToggle={() => setOpenCode((code) => (code === order.order_code ? null : order.order_code))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PedidosPage() {
  return (
    <AccountShell>
      <Orders />
    </AccountShell>
  );
}
