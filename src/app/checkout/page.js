'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { syncCartWithBackend } from '@/lib/cartSync';
import { formatPrice } from '@/lib/formatPrice';
import { createOrder, validateDiscount } from '@/lib/api';
import toast from 'react-hot-toast';
import { Tag, AlertTriangle, Loader2, X, ShoppingBag } from 'lucide-react';

const provinces = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const discountCode = useCartStore((s) => s.discountCode);
  const discountPercent = useCartStore((s) => s.discountPercent);
  const discountFixed = useCartStore((s) => s.discountFixed);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const syncCartProducts = useCartStore((s) => s.syncCartProducts);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_type: 'delivery',
    shipping_address: '',
    shipping_city: '',
    shipping_province: '',
    shipping_zip: '',
    shipping_branch: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [orderErrors, setOrderErrors] = useState([]); // mensajes de error del backend
  const [fieldErrors, setFieldErrors] = useState({}); // errores de validación por campo

  // Validación de stock al cargar
  const [stockChecking, setStockChecking] = useState(true);
  const [stockIssues, setStockIssues] = useState([]); // [{ id, name, issue}]
  const cartSignature = items.map((item) => `${item.id}:${item.quantity}`).join('|');
  const cartItemsSnapshot = useMemo(
    () => items.map((item) => ({ ...item })),
    [cartSignature]
  );

  useEffect(() => {
    if (cartItemsSnapshot.length === 0) {
      setStockIssues([]);
      setStockChecking(false);
      return;
    }

    let cancelled = false;

    async function checkStock() {
      setStockChecking(true);
      try {
        const issues = await syncCartWithBackend(cartItemsSnapshot, syncCartProducts);
        if (!cancelled) {
          setStockIssues(issues);
          if (issues.length > 0) {
            toast.error('Algunos productos ya no están disponibles', { duration: 4000 });
          }
        }
      } catch {
        if (!cancelled) {
          setStockIssues([]);
        }
      } finally {
        if (!cancelled) {
          setStockChecking(false);
        }
      }
    }

    checkStock();
    return () => { cancelled = true; };
  }, [cartItemsSnapshot, syncCartProducts]);

  const updateForm = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Limpiar error del campo al editar
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleValidateDiscount = async () => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const data = await validateDiscount(code.trim());
      if (!data.valid) {
        const msg = data.reason === 'expired'
          ? 'El código expiró'
          : data.reason === 'used'
          ? 'El código ya fue utilizado'
          : 'Código inválido';
        toast.error(msg);
        return;
      }
      if (data.type === 'percent') {
        setDiscount(data.code, data.amount, 0);
        toast.success(`Código aplicado: ${data.amount}% de descuento`);
      } else {
        setDiscount(data.code, 0, data.amount);
        toast.success(`Código aplicado: -${formatPrice(data.amount)}`);
      }
      setCode('');
    } catch {
      toast.error('Error al validar el código');
    } finally {
      setValidating(false);
    }
  };

  // Validación frontend completa
  const validateForm = () => {
    const errors = {};

    // Nombre
    const name = form.customer_name.trim();
    if (!name) {
      errors.customer_name = 'El nombre es obligatorio';
    } else if (name.length < 3) {
      errors.customer_name = 'El nombre debe tener al menos 3 caracteres';
    }

    // Email
    const email = form.customer_email.trim();
    if (!email) {
      errors.customer_email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.customer_email = 'Ingresá un email válido';
    }

    // Teléfono
    const phone = form.customer_phone.trim();
    if (!phone) {
      errors.customer_phone = 'El teléfono es obligatorio';
    } else if (!/^[\d\s\-+().]{7,20}$/.test(phone)) {
      errors.customer_phone = 'Ingresá un teléfono válido';
    }

    // Campos de envío
    if (form.shipping_type === 'delivery') {
      if (!form.shipping_address.trim()) {
        errors.shipping_address = 'La dirección es obligatoria';
      }
      if (!form.shipping_city.trim()) {
        errors.shipping_city = 'La ciudad es obligatoria';
      }
      if (!form.shipping_province) {
        errors.shipping_province = 'Seleccioná una provincia';
      }
      const zip = form.shipping_zip.trim();
      if (!zip) {
        errors.shipping_zip = 'El código postal es obligatorio';
      } else if (!/^\d{4}$/.test(zip)) {
        errors.shipping_zip = 'El código postal debe tener 4 dígitos';
      }
    } else {
      if (!form.shipping_branch.trim()) {
        errors.shipping_branch = 'La sucursal es obligatoria';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Limpiar errores previos
    setOrderErrors([]);

    // Validación frontend
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Revisá los campos marcados en rojo');
      return;
    }

    // Bloquear si hay problemas de stock conocidos
    if (stockIssues.length > 0) {
      toast.error('Resolvé los problemas de stock antes de continuar');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        shipping_type: form.shipping_type === 'delivery' ? 'home' : 'pickup',
        shipping_address: form.shipping_address.trim(),
        shipping_city: form.shipping_city.trim(),
        shipping_province: form.shipping_province,
        shipping_zip: form.shipping_zip.trim(),
        shipping_branch: form.shipping_branch.trim(),
        discount_code: discountCode || '',
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      });
      clearCart();
      router.push(`/checkout/confirmacion?order=${order.id}`);
    } catch (err) {
      const data = err?.data;
      const errorMessages = [];

      if (data) {
        const itemErrors = data.items || data.non_field_errors;
        if (Array.isArray(itemErrors) && itemErrors.length > 0) {
          const toRemove = [];
          itemErrors.forEach((msg) => {
            const removedItem = items.find((item) =>
              msg.includes(`ID ${item.id}`) ||
              msg.includes(`Producto ${item.id}`) ||
              msg.includes(`'${item.name}'`)
            );
            if (removedItem) toRemove.push(removedItem.id);
            errorMessages.push(msg);
          });
          toRemove.forEach((id) => removeFromCart(id));
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
            errorMessages.push(String(msg));
          }
        }
      } else {
        errorMessages.push(err?.message || 'Error al crear el pedido. Intentá de nuevo.');
      }

      setOrderErrors(errorMessages);
      toast.error('No pudimos procesar tu pedido');
      // Scroll al banner de error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full bg-white border rounded-lg px-4 py-3 text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6560]/40 transition-all";
  const inputClass = (field) => `${inputBase} ${fieldErrors[field] ? 'border-red-400 focus:border-red-400' : 'border-[#E8E4DD] focus:border-[#C8972E]/40'}`;
  const labelClass = "block text-[11px] tracking-[0.1em] text-[#6B6560] uppercase mb-1.5 font-medium";
  const FieldError = ({ field }) => fieldErrors[field] ? <p className="text-[11px] text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-20 text-center min-h-screen flex flex-col items-center justify-center">
        <p className="text-[#6B6560] text-sm mb-4">No hay productos en el carrito</p>
        <a href="/tienda" className="text-xs text-[#6B6560]/70 hover:text-[#1A1A1A] underline">Ir a la tienda</a>
      </div>
    );
  }

  const hasBlockingIssues = stockIssues.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-black tracking-tight text-[#1A1A1A] mb-10">CHECKOUT</motion.h1>

        {/* Banner de problemas de stock */}
        {!stockChecking && hasBlockingIssues && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-red-200 bg-red-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-2">Algunos productos ya no están disponibles</p>
                <ul className="space-y-1">
                  {stockIssues.map((issue) => (
                    <li key={issue.id} className="flex items-center justify-between text-xs text-red-600">
                      <span>{issue.name} — {issue.issue}</span>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(issue.id);
                          setStockIssues((prev) => prev.filter((i) => i.id !== issue.id));
                        }}
                        className="ml-4 underline hover:no-underline"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Banner de errores del servidor */}
        {orderErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border border-red-200 bg-red-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-2">No pudimos procesar tu pedido</p>
                <ul className="space-y-1">
                  {orderErrors.map((msg, i) => (
                    <li key={i} className="text-xs text-red-600">{msg}</li>
                  ))}
                </ul>
              </div>
              <button type="button" onClick={() => setOrderErrors([])} className="text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ── Datos del comprador ── */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] mb-6">DATOS DE CONTACTO</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nombre completo *</label>
                  <input type="text" value={form.customer_name} onChange={(e) => updateForm('customer_name', e.target.value)} className={inputClass('customer_name')} placeholder="Tu nombre completo" />
                  <FieldError field="customer_name" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" value={form.customer_email} onChange={(e) => updateForm('customer_email', e.target.value)} className={inputClass('customer_email')} placeholder="tu@email.com" />
                  <FieldError field="customer_email" />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input type="tel" value={form.customer_phone} onChange={(e) => updateForm('customer_phone', e.target.value)} className={inputClass('customer_phone')} placeholder="+54 11 1234-5678" />
                  <FieldError field="customer_phone" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] mb-6">ENVÍO</h2>
              <div className="flex gap-4 mb-6">
                {['delivery', 'pickup'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm('shipping_type', type)}
                    className={`flex-1 border rounded-lg px-4 py-3 text-sm transition-all ${form.shipping_type === type ? 'border-[#C8972E] text-[#1A1A1A] bg-[#C8972E]/5' : 'border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6]'}`}
                  >
                    {type === 'delivery' ? 'Envío a domicilio' : 'Retiro en punto'}
                  </button>
                ))}
              </div>

              {form.shipping_type === 'delivery' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Dirección *</label>
                    <input type="text" value={form.shipping_address} onChange={(e) => updateForm('shipping_address', e.target.value)} className={inputClass('shipping_address')} placeholder="Calle y número" />
                    <FieldError field="shipping_address" />
                  </div>
                  <div>
                    <label className={labelClass}>Ciudad *</label>
                    <input type="text" value={form.shipping_city} onChange={(e) => updateForm('shipping_city', e.target.value)} className={inputClass('shipping_city')} placeholder="Ciudad" />
                    <FieldError field="shipping_city" />
                  </div>
                  <div>
                    <label className={labelClass}>Provincia *</label>
                    <select value={form.shipping_province} onChange={(e) => updateForm('shipping_province', e.target.value)} className={inputClass('shipping_province')}>
                      <option value="" className="bg-white">Seleccionar</option>
                      {provinces.map((p) => (<option key={p} value={p} className="bg-white">{p}</option>))}
                    </select>
                    <FieldError field="shipping_province" />
                  </div>
                  <div>
                    <label className={labelClass}>Código postal *</label>
                    <input type="text" value={form.shipping_zip} onChange={(e) => updateForm('shipping_zip', e.target.value)} className={inputClass('shipping_zip')} placeholder="1234" />
                    <FieldError field="shipping_zip" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Sucursal / Punto de entrega *</label>
                  <input type="text" value={form.shipping_branch} onChange={(e) => updateForm('shipping_branch', e.target.value)} className={inputClass('shipping_branch')} placeholder="Nombre o dirección de la sucursal" />
                  <FieldError field="shipping_branch" />
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Resumen del pedido ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
            <div className="border border-[#E8E4DD] rounded-2xl p-6 sticky top-24 bg-white shadow-sm">
              <h2 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] mb-6">TU PEDIDO</h2>

              {/* Lista de items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {stockChecking ? (
                  <div className="flex items-center gap-2 text-xs text-[#6B6560]">
                    <Loader2 size={14} className="animate-spin" />
                    Verificando disponibilidad...
                  </div>
                ) : (
                  items.map((item) => {
                    const hasIssue = stockIssues.some((i) => i.id === item.id);
                    return (
                      <div key={item.id} className={`flex gap-3 ${hasIssue ? 'opacity-50' : ''}`}>
                        <div className="w-12 h-12 bg-[#F5F1EA] rounded-lg overflow-hidden flex-shrink-0 relative">
                          {item.image_url && <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="48px" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1A1A] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#6B6560]">x{item.quantity}</p>
                          {hasIssue && <p className="text-[10px] text-red-500">{stockIssues.find((issue) => issue.id === item.id)?.issue || 'Sin stock'}</p>}
                        </div>
                        <p className="text-xs font-medium text-[#1A1A1A]">{formatPrice(parseFloat(item.final_price || item.price) * item.quantity)}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Código de descuento */}
              {!discountCode && (
                <div className="mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]/40" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleValidateDiscount())}
                        placeholder="Código de descuento"
                        className="w-full bg-white border border-[#E8E4DD] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidateDiscount}
                      disabled={validating || !code.trim()}
                      className="text-[11px] font-bold tracking-wider border border-[#E8E4DD] px-4 py-2.5 rounded-lg hover:border-[#D4CFC6] transition-all disabled:opacity-50 text-[#1A1A1A]"
                    >
                      {validating ? <Loader2 size={14} className="animate-spin" /> : 'APLICAR'}
                    </button>
                  </div>
                </div>
              )}
              {discountCode && (
                <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-green-700">
                    {discountPercent > 0
                      ? `"${discountCode}" (-${discountPercent}%)`
                      : `"${discountCode}" (-${formatPrice(discountFixed || 0)})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiscount(null, 0, 0)}
                    className="text-[10px] text-green-600 underline hover:no-underline ml-2"
                  >
                    Quitar
                  </button>
                </div>
              )}

              {/* Totales */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">Subtotal</span>
                  <span className="text-[#1A1A1A]">{formatPrice(getSubtotal())}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento ({discountPercent}%)</span>
                    <span className="text-green-600">-{formatPrice(getSubtotal() * discountPercent / 100)}</span>
                  </div>
                )}
                {discountFixed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento</span>
                    <span className="text-green-600">-{formatPrice(discountFixed)}</span>
                  </div>
                )}
                <div className="border-t border-[#E8E4DD] pt-3 flex justify-between text-lg font-bold">
                  <span className="text-[#1A1A1A]">Total</span>
                  <span className="text-[#1A1A1A]">{formatPrice(getTotal())}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || stockChecking || hasBlockingIssues}
                className="w-full bg-[#C8972E] text-white text-[11px] tracking-[0.15em] font-bold py-4 rounded-lg hover:bg-[#B8851F] transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> PROCESANDO...</>
                ) : stockChecking ? (
                  <><Loader2 size={14} className="animate-spin" /> VERIFICANDO...</>
                ) : (
                  'CONFIRMAR PEDIDO'
                )}
              </button>

              {hasBlockingIssues && (
                <p className="text-[10px] text-red-500 text-center mt-2">
                  Quitá los productos sin stock para continuar
                </p>
              )}
            </div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
