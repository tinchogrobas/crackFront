'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MapPin, Store, Truck, X } from 'lucide-react';
import { formatUsd } from '@/lib/formatUsd';

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const PICKUP_ADDRESS = 'Deheza 2921, PB, Saavedra, Buenos Aires';

const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Retiro en tienda', icon: Store, hint: PICKUP_ADDRESS },
  { value: 'home', label: 'Envío a domicilio', icon: Truck, hint: 'Coordinamos el costo al llegar' },
  { value: 'branch', label: 'Envío a sucursal', icon: MapPin, hint: 'Correo Argentino o Andreani' },
];

const EMPTY_FORM = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  delivery_type: 'pickup',
  shipping_address: '',
  shipping_city: '',
  shipping_province: '',
  shipping_zip: '',
  shipping_branch: '',
  customer_notes: '',
};

/**
 * Formulario de confirmación.
 *
 * Pide la dirección completa cuando el cliente elige envío, aunque el costo se
 * cierre después: así el owner ya tiene todo para cotizarlo al aprobar el pedido.
 */
export default function CheckoutModal({ open, onClose, total, itemCount, onSubmit, submitting, fieldErrors }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);

  // Cierra con Escape y bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, submitting]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const needsAddress = form.delivery_type === 'home';
  const needsProvince = form.delivery_type !== 'pickup';

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);

    if (!form.customer_name.trim() || !form.customer_email.trim()) return;
    if (needsAddress && (!form.shipping_address.trim() || !form.shipping_city.trim())) return;
    if (needsProvince && !form.shipping_province) return;

    onSubmit(form);
  }

  const invalid = (field, condition = true) => touched && condition && !form[field].trim();

  const inputClass = (bad) =>
    `w-full h-11 px-3.5 rounded-xl border bg-[#FAFAF7] text-sm text-[#1A1A1A] placeholder:text-[#6B6560]/45 focus:bg-white focus:ring-2 transition-all ${
      bad
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-[#E8E4DD] focus:border-[#C8972E] focus:ring-[#C8972E]/15'
    }`;

  const labelClass = 'block text-[10px] font-semibold tracking-[0.16em] text-[#6B6560] uppercase mb-1.5';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ebay-checkout-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 bg-white border-b border-[#E8E4DD]">
              <div>
                <h2 id="ebay-checkout-title" className="text-lg font-bold text-[#1A1A1A]">
                  Confirmar pedido
                </h2>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  {itemCount} publicación{itemCount === 1 ? '' : 'es'} · {formatUsd(total)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Cerrar"
                className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-[#6B6560] hover:bg-[#F5F1EA] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="ebay-name" className={labelClass}>Nombre y apellido *</label>
                  <input
                    id="ebay-name"
                    value={form.customer_name}
                    onChange={set('customer_name')}
                    className={inputClass(invalid('customer_name'))}
                    placeholder="Como figura en tu documento"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ebay-email" className={labelClass}>Email *</label>
                    <input
                      id="ebay-email"
                      type="email"
                      value={form.customer_email}
                      onChange={set('customer_email')}
                      className={inputClass(invalid('customer_email') || Boolean(fieldErrors?.customer_email))}
                      placeholder="tu@email.com"
                    />
                    {fieldErrors?.customer_email && (
                      <p className="mt-1 text-[11px] text-red-600">{fieldErrors.customer_email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="ebay-phone" className={labelClass}>Teléfono</label>
                    <input
                      id="ebay-phone"
                      value={form.customer_phone}
                      onChange={set('customer_phone')}
                      className={inputClass(false)}
                      placeholder="11 5058 8131"
                    />
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div>
                <p className={labelClass}>¿Cómo querés recibirlo?</p>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = form.delivery_type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, delivery_type: option.value }))}
                        aria-pressed={active}
                        className={`px-2.5 py-3 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-[#C8972E] bg-[#C8972E]/[0.07]'
                            : 'border-[#E8E4DD] bg-[#FAFAF7] hover:border-[#D4CFC6]'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={`mx-auto ${active ? 'text-[#C8972E]' : 'text-[#6B6560]'}`}
                        />
                        <span
                          className={`block text-[11px] font-semibold mt-1.5 leading-tight ${
                            active ? 'text-[#1A1A1A]' : 'text-[#6B6560]'
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-[#6B6560] leading-relaxed">
                  {DELIVERY_OPTIONS.find((o) => o.value === form.delivery_type)?.hint}
                  {form.delivery_type !== 'pickup' &&
                    ' · El costo del envío no está incluido en el total: lo coordinamos cuando el pedido llegue.'}
                </p>
              </div>

              <AnimatePresence initial={false}>
                {form.delivery_type !== 'pickup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1">
                      {needsAddress && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ebay-address" className={labelClass}>Dirección *</label>
                            <input
                              id="ebay-address"
                              value={form.shipping_address}
                              onChange={set('shipping_address')}
                              className={inputClass(invalid('shipping_address', needsAddress))}
                              placeholder="Calle, número y piso"
                            />
                          </div>
                          <div>
                            <label htmlFor="ebay-city" className={labelClass}>Ciudad *</label>
                            <input
                              id="ebay-city"
                              value={form.shipping_city}
                              onChange={set('shipping_city')}
                              className={inputClass(invalid('shipping_city', needsAddress))}
                              placeholder="Localidad"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="ebay-province" className={labelClass}>Provincia *</label>
                          <select
                            id="ebay-province"
                            value={form.shipping_province}
                            onChange={set('shipping_province')}
                            className={`${inputClass(touched && needsProvince && !form.shipping_province)} appearance-none`}
                          >
                            <option value="">Elegí una provincia</option>
                            {PROVINCES.map((province) => (
                              <option key={province} value={province}>{province}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="ebay-zip" className={labelClass}>Código postal</label>
                          <input
                            id="ebay-zip"
                            value={form.shipping_zip}
                            onChange={set('shipping_zip')}
                            className={inputClass(false)}
                            placeholder="1429"
                          />
                        </div>
                      </div>

                      {form.delivery_type === 'branch' && (
                        <div>
                          <label htmlFor="ebay-branch" className={labelClass}>Sucursal preferida</label>
                          <input
                            id="ebay-branch"
                            value={form.shipping_branch}
                            onChange={set('shipping_branch')}
                            className={inputClass(false)}
                            placeholder="Ej: Correo Argentino Saavedra"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="ebay-notes" className={labelClass}>Comentarios</label>
                <textarea
                  id="ebay-notes"
                  rows={3}
                  value={form.customer_notes}
                  onChange={set('customer_notes')}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E8E4DD] bg-[#FAFAF7] text-sm text-[#1A1A1A] placeholder:text-[#6B6560]/45 focus:bg-white focus:border-[#C8972E] focus:ring-2 focus:ring-[#C8972E]/15 transition-all resize-none"
                  placeholder="Algo que debamos tener en cuenta (opcional)"
                />
              </div>

              <div className="rounded-xl bg-[#FAFAF7] border border-[#E8E4DD] px-4 py-3">
                <p className="text-[11px] text-[#6B6560] leading-relaxed">
                  Al confirmar volvemos a consultar cada publicación en eBay para verificar
                  precio y disponibilidad. <strong className="text-[#1A1A1A]">No se cobra nada ahora:</strong>{' '}
                  dentro de las 24 horas te avisamos por email si el pedido queda aprobado.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold tracking-[0.14em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#C8972E] transition-colors disabled:opacity-50 disabled:hover:bg-[#1A1A1A]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Verificando en eBay
                  </>
                ) : (
                  'Confirmar pedido'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
