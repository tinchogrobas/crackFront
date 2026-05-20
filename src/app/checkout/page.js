'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { syncCartWithBackend } from '@/lib/cartSync';
import { formatPrice } from '@/lib/formatPrice';
import { createOrder, getPaymentConfig, validateDiscount } from '@/lib/api';
import toast from 'react-hot-toast';
import { Tag, AlertTriangle, Loader2, X, Truck, MapPin, CreditCard, Landmark, Banknote, BadgePercent, Store, Zap } from 'lucide-react';

const provinces = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const PICKUP_BRANCH_ADDRESS = 'Deheza 2921, PB, Saavedra, Buenos Aires, Argentina';
const PICKUP_BRANCH_MAP_URL = 'https://maps.app.goo.gl/vTPfffMMNMbMLCyn8';
const PICKUP_BRANCH_MAP_EMBED_QUERY = 'Deheza 2921, C1429EAY Cdad. Autónoma de Buenos Aires';
const PICKUP_BRANCH_MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(PICKUP_BRANCH_MAP_EMBED_QUERY)}&output=embed`;

const BA_PROVINCES = new Set(['Buenos Aires', 'CABA']);

const getShippingZoneFromProvince = (province) => (BA_PROVINCES.has(province) ? 'ba' : 'province');

const mercadoPagoBadges = [
  {
    label: 'Mercado Pago',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/mercadopago.BK20nVmQ.svg',
  },
  {
    label: 'Visa',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/visa.sxIq5Dot.svg',
  },
  {
    label: 'Mastercard',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/mastercard.1c4_lyMp.svg',
  },
];

const mercadoPagoHoverBadges = [
  {
    label: 'Amex',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/amex.Csr7hRoy.svg',
  },
  {
    label: 'Diners Club',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/diners_club.B9hVEmwz.svg',
  },
  {
    label: 'Maestro',
    className: 'bg-white border-[#D8DFEA]',
    imageSrc: '/payments/maestro.ByfUQi1c.svg',
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const discountCode = useCartStore((s) => s.discountCode);
  const discountPercent = useCartStore((s) => s.discountPercent);
  const discountFixed = useCartStore((s) => s.discountFixed);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const syncCartProducts = useCartStore((s) => s.syncCartProducts);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_type: 'delivery',
    shipping_delivery_method: 'home',
    payment_method: 'mercadopago',
    shipping_address: '',
    shipping_city: '',
    shipping_province: '',
    shipping_zip: '',
    shipping_branch: '',
  });
  const [paymentConfig, setPaymentConfig] = useState({
    cash_discount_enabled: true,
    cash_discount_percent: 15,
    shipping_prices: {
      branch: { ba: { normal: 0, express: 0 }, province: { normal: 0, express: 0 } },
      home: { ba: { normal: 0 }, province: { normal: 0 } },
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [orderErrors, setOrderErrors] = useState([]); // mensajes de error del backend
  const [fieldErrors, setFieldErrors] = useState({}); // errores de validación por campo
  const [pickupMapOpen, setPickupMapOpen] = useState(false);

  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
  const externalReference = searchParams.get('external_reference') || searchParams.get('code');
  const statusParam = (searchParams.get('status') || '').toLowerCase();
  const emailParam = searchParams.get('email') || '';
  const isReturningFromPayment = Boolean(
    paymentId ||
    externalReference ||
    ['approved', 'authorized', 'pending', 'in_process', 'rejected', 'cancelled', 'failure'].includes(statusParam)
  );

  useEffect(() => {
    if (!isReturningFromPayment) return;

    const params = new URLSearchParams();
    if (paymentId) params.set('payment_id', paymentId);
    if (externalReference) {
      params.set('external_reference', externalReference);
      params.set('code', externalReference);
    }
    if (emailParam) params.set('email', emailParam);
    if (statusParam) params.set('status', statusParam);

    if (statusParam === 'pending' || statusParam === 'in_process') {
      router.replace(`/checkout/pendiente?${params.toString()}`);
      return;
    }

    if (statusParam === 'rejected' || statusParam === 'cancelled' || statusParam === 'failure') {
      router.replace(`/checkout/error?${params.toString()}`);
      return;
    }

    router.replace(`/checkout/confirmacion?${params.toString()}`);
  }, [
    isReturningFromPayment,
    paymentId,
    externalReference,
    emailParam,
    statusParam,
    router,
  ]);

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
            // Auto-remove solo los items sin stock
            const noStockIssues = issues.filter((issue) => issue.issue === 'sin stock');
            if (noStockIssues.length > 0) {
              noStockIssues.forEach((issue) => {
                removeFromCart(issue.id);
              });
              if (noStockIssues.length === issues.length) {
                toast.error('Algunos productos fueron removidos porque ya no están disponibles', { duration: 4000 });
              } else {
                toast.error('Algunos productos fueron removidos por falta de stock. Por favor ajusta los demás.', { duration: 4000 });
              }
            } else {
              toast.error('Algunos productos tienen stock insuficiente. Por favor ajusta las cantidades.', { duration: 4000 });
            }
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
    return () => { cancelled = true };
  }, [cartSignature, syncCartProducts, removeFromCart]);

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentConfig() {
      try {
        const data = await getPaymentConfig();
        if (!cancelled) setPaymentConfig(data);
      } catch {
        if (!cancelled) {
          setPaymentConfig({
            cash_discount_enabled: true,
            cash_discount_percent: 15,
            shipping_prices: {
              branch: { ba: { normal: 0, express: 0 }, province: { normal: 0, express: 0 } },
              home: { ba: { normal: 0 }, province: { normal: 0 } },
            },
          });
        }
      }
    }
    loadPaymentConfig();
    return () => { cancelled = true; };
  }, []);

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
        setDiscount(data.code, data.amount, 0, data.expires_at || null);
        toast.success(`Código aplicado: ${data.amount}% de descuento`);
      } else {
        setDiscount(data.code, 0, data.amount, data.expires_at || null);
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
      const response = await createOrder({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        // Corrección: mapeo explícito de shipping_type y shipping_method
        ...(() => {
          // Retiro en tienda física
          if (form.shipping_type === 'pickup' && form.shipping_delivery_method === undefined) {
            return {
              shipping_type: 'pickup',
              shipping_method: 'pickup_store',
              shipping_zone: '',
              shipping_branch: PICKUP_BRANCH_ADDRESS,
            };
          }
          // Envío a sucursal/correo (normal o express)
          if (form.shipping_type === 'delivery' && (form.shipping_delivery_method === 'branch_normal' || form.shipping_delivery_method === 'branch_express')) {
            return {
              shipping_type: 'home',
              shipping_method: form.shipping_delivery_method,
              shipping_zone: shippingZone,
              shipping_branch: 'Sucursal de correo',
            };
          }
          // Envío a domicilio
          if (form.shipping_type === 'delivery' && form.shipping_delivery_method === 'home') {
            return {
              shipping_type: 'home',
              shipping_method: 'home',
              shipping_zone: shippingZone,
              shipping_branch: '',
            };
          }
          // Fallback seguro
          return {
            shipping_type: 'home',
            shipping_method: 'home',
            shipping_zone: shippingZone,
            shipping_branch: '',
          };
        })(),
        payment_method: form.payment_method,
        shipping_address: form.shipping_address.trim(),
        shipping_city: form.shipping_city.trim(),
        shipping_province: form.shipping_province,
        shipping_zip: form.shipping_zip.trim(),
        discount_code: discountCode || '',
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      });

      const order = response?.order || response;
      const checkout = response?.checkout || null;

      if (form.payment_method === 'mercadopago') {
        const checkoutUrl = checkout?.init_point || checkout?.sandbox_init_point;
        if (!checkoutUrl) {
          throw new Error('No recibimos URL de Checkout Pro.');
        }
        window.location.href = checkoutUrl;
        return;
      }

      router.push(`/checkout/confirmacion?order=${order.id}&code=${order.order_code}&email=${encodeURIComponent(order.customer_email)}&cash=1`);
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

  if (isReturningFromPayment) {
    return (
      <div className="pt-24 pb-20 text-center min-h-screen flex flex-col items-center justify-center">
        <p className="text-[#6B6560] text-sm mb-2">Estamos confirmando el estado de tu pago...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-20 text-center min-h-screen flex flex-col items-center justify-center">
        <p className="text-[#6B6560] text-sm mb-4">No hay productos en el carrito</p>
        <a href="/tienda" className="text-xs text-[#6B6560]/70 hover:text-[#1A1A1A] underline">Ir a la tienda</a>
      </div>
    );
  }

  const hasBlockingIssues = stockIssues.length > 0;
  const subtotal = getSubtotal();
  const shippingZone = getShippingZoneFromProvince(form.shipping_province);
  const shippingMethod = form.shipping_type === 'pickup'
    ? 'pickup_store'
    : form.shipping_delivery_method;
  const shippingPrice = form.shipping_type === 'pickup'
    ? 0
    : (shippingMethod === 'home'
      ? Number(paymentConfig?.shipping_prices?.home?.[shippingZone]?.normal || 0)
      : Number(paymentConfig?.shipping_prices?.branch?.[shippingZone]?.[shippingMethod === 'branch_express' ? 'express' : 'normal'] || 0));
  const codeDiscountAmount = discountPercent > 0
    ? subtotal * discountPercent / 100
    : (discountFixed || 0);
  const subtotalAfterCode = Math.max(0, subtotal - codeDiscountAmount);
  const cashDiscountAvailablePercent = paymentConfig?.cash_discount_enabled
    ? Number(paymentConfig?.cash_discount_percent || 0)
    : 0;
  const cashDiscountPreviewAmount = subtotalAfterCode * cashDiscountAvailablePercent / 100;
  const cashDiscountPercent = (
    form.payment_method === 'cash' && paymentConfig?.cash_discount_enabled
  ) ? Number(paymentConfig?.cash_discount_percent || 0) : 0;
  const cashDiscountAmount = subtotalAfterCode * cashDiscountPercent / 100;
  const checkoutTotal = Math.max(0, subtotalAfterCode - cashDiscountAmount + shippingPrice);
  const paymentRadioClass = (selected) => `mt-0.5 flex h-5 w-5 min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-[#C8972E] bg-[#FFF8E8]' : 'border-[#B7B0A6] bg-white'}`;
  const paymentRadioDotClass = (selected) => `h-2.5 w-2.5 rounded-full transition-colors ${selected ? 'bg-[#C8972E]' : 'bg-transparent'}`;

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

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F3F1EC] p-1.5 mb-6">
                {['delivery', 'pickup'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm('shipping_type', type)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition-all ${
                      form.shipping_type === type
                        ? 'border-[#D9D3C7] bg-white text-[#111111] shadow-[0_6px_18px_rgba(17,17,17,0.06)]'
                        : 'border-transparent bg-transparent text-[#3A3530] hover:bg-white/70'
                    }`}
                  >
                    {type === 'delivery' ? <Truck size={18} strokeWidth={2.2} /> : <MapPin size={18} strokeWidth={2.2} />}
                    <span>{type === 'delivery' ? 'Envío' : 'Retiro'}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {form.shipping_type === 'delivery' ? (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Provincia *</label>
                        <div className="relative">
                          <select
                            value={form.shipping_province}
                            onChange={(e) => updateForm('shipping_province', e.target.value)}
                            className={`${inputClass('shipping_province')} appearance-none pr-10`}
                          >
                            <option value="">Seleccionar provincia</option>
                            {provinces.map((p) => (<option key={p} value={p}>{p}</option>))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </div>
                        <FieldError field="shipping_province" />
                      </div>
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
                        <label className={labelClass}>Código postal *</label>
                        <input type="text" value={form.shipping_zip} onChange={(e) => updateForm('shipping_zip', e.target.value)} className={inputClass('shipping_zip')} placeholder="1234" />
                        <FieldError field="shipping_zip" />
                      </div>
                    </div>

                    <div className="mt-5">
                      {form.shipping_province ? (
                        <>
                          <div className="mb-3 rounded-xl border border-[#E8E4DD] bg-[#F8F6F1] px-4 py-3 text-sm text-[#3A3530]">
                            Opciones para {shippingZone === 'ba' ? 'Buenos Aires / CABA' : 'interior del país'}.
                          </div>
                          <div className="space-y-2">
                            {[
                              {
                                key: 'branch_normal',
                                title: 'Envío a sucursal',
                                subtitle: '4 a 7 días hábiles',
                                badge: 'Normal',
                                icon: <Store size={16} strokeWidth={1.9} />,
                                price: Number(paymentConfig?.shipping_prices?.branch?.[shippingZone]?.normal || 0),
                              },
                              {
                                key: 'branch_express',
                                title: 'Envío a sucursal (Express)',
                                subtitle: '2 a 3 días hábiles',
                                badge: 'Express',
                                icon: <Zap size={16} strokeWidth={1.9} />,
                                price: Number(paymentConfig?.shipping_prices?.branch?.[shippingZone]?.express || 0),
                              },
                              {
                                key: 'home',
                                title: 'Envío a domicilio',
                                subtitle: 'Por Andreani / Correo Argentino',
                                badge: '',
                                icon: <Truck size={16} strokeWidth={1.9} />,
                                price: Number(paymentConfig?.shipping_prices?.home?.[shippingZone]?.normal || 0),
                              },
                            ].map((option) => {
                              const selected = form.shipping_delivery_method === option.key;
                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => updateForm('shipping_delivery_method', option.key)}
                                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${selected
                                    ? 'border-[#C8972E] bg-[#FFFCF5] shadow-[0_6px_16px_rgba(200,151,46,0.10)]'
                                    : 'border-[#E8E4DD] bg-white hover:border-[#D4CFC6]'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={`flex h-5 w-5 min-h-5 min-w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-[#C8972E]' : 'border-[#B7B0A6]'}`}>
                                      <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-[#C8972E]' : 'bg-transparent'}`} />
                                    </span>
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F1EA] text-[#6B6560]">{option.icon}</span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-[#1A1A1A]">{option.title}</p>
                                        {option.badge ? (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${option.badge === 'Express' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#F3F1EC] text-[#6B6560]'}`}>
                                            {option.badge}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="text-xs text-[#6B6560] mt-0.5">{option.subtitle}</p>
                                    </div>
                                    <p className={`text-2sm font-bold ${selected ? 'text-[#C8972E]' : 'text-[#1A1A1A]'}`}>{formatPrice(option.price)}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#D4CFC6] bg-[#FBFAF7] px-4 py-4 text-sm text-[#6B6560]">
                          Seleccioná la provincia para mostrar las opciones de envío disponibles.
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pickup"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-green-700" />
                        <p className="text-xs font-semibold text-green-700">PickUp en tienda</p>
                      </div>
                      <span className="text-sm font-bold text-green-700">Gratis</span>
                    </div>

                    <label className={labelClass}>Punto de retiro</label>
                    <div className="w-full bg-[#F8F6F1] border border-[#E8E4DD] rounded-lg px-4 py-3 text-sm text-[#3A3530] mb-3">
                      {PICKUP_BRANCH_ADDRESS}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPickupMapOpen((v) => !v)}
                      className="text-[11px] tracking-[0.1em] uppercase font-medium text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
                    >
                      {pickupMapOpen ? 'Ocultar mapa' : 'Ver mapa'}
                    </button>
                    <AnimatePresence initial={false}>
                      {pickupMapOpen && (
                        <motion.div
                          key="pickup-map"
                          initial={{ height: 0, opacity: 0, y: -4 }}
                          animate={{ height: 'auto', opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden mt-3"
                        >
                          <div className="rounded-lg border border-[#E8E4DD] bg-white overflow-hidden">
                            <iframe
                              title="Mapa de punto de retiro"
                              src={PICKUP_BRANCH_MAP_EMBED_SRC}
                              className="w-full h-44"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                          <a
                            href={PICKUP_BRANCH_MAP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-[11px] tracking-[0.08em] uppercase text-[#6B6560] hover:text-[#1A1A1A] underline"
                          >
                            Abrir en Google Maps
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] mb-6">PAGO</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => updateForm('payment_method', 'mercadopago')}
                  className={`border rounded-lg px-4 py-3 text-left transition-all ${
                    form.payment_method === 'mercadopago'
                      ? 'border-[#C8972E] bg-[#FFF8E8] text-[#1A1A1A] shadow-[0_8px_24px_rgba(200,151,46,0.14)]'
                      : 'border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6] hover:shadow-[0_10px_30px_rgba(17,17,17,0.06)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={paymentRadioClass(form.payment_method === 'mercadopago')}>
                          <span className={paymentRadioDotClass(form.payment_method === 'mercadopago')} />
                        </span>
                        <p className="text-sm font-semibold text-[#111111]">Mercado Pago</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6B6560]">
                        <CreditCard size={14} />
                        <span>Crédito, débito y saldo en cuenta</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6B6560]">
                        <Landmark size={14} />
                        <span>Pago online inmediato</span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-start justify-end gap-1.5">
                      <div className="flex items-center justify-end gap-1.5 sm:hidden">
                        <span className="flex h-8 min-w-[52px] items-center justify-center rounded-md border border-[#D8DFEA] bg-white shadow-sm">
                          <Image src="/payments/mercadopago.BK20nVmQ.svg" alt="Mercado Pago" width={28} height={18} className="h-5 w-auto" />
                        </span>
                      </div>
                      <div className="hidden sm:flex items-start justify-end gap-1.5">
                        {mercadoPagoBadges.map((badge) => (
                          <span key={badge.label} className={`flex h-8 min-w-[52px] items-center justify-center rounded-md border shadow-sm ${badge.className}`}>
                            <Image src={badge.imageSrc} alt={badge.label} width={30} height={18} className="h-5 w-auto" />
                          </span>
                        ))}
                        <span className="group/plus relative flex h-8 min-w-[36px] items-center justify-center rounded-md border border-[#D8DFEA] bg-white text-[11px] font-semibold text-[#3A3530] shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                          +3
                          <span className="pointer-events-none absolute -top-12 right-0 hidden items-center gap-1 rounded-xl bg-[#1A1A1A] px-2 py-2 opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-all duration-150 group-hover/plus:flex group-hover/plus:opacity-100">
                            {mercadoPagoHoverBadges.map((badge) => (
                              <span key={badge.label} className={`flex h-7 min-w-[42px] items-center justify-center rounded-md border px-2 ${badge.className}`}>
                                <Image src={badge.imageSrc} alt={badge.label} width={26} height={16} className="h-4 w-auto" />
                              </span>
                            ))}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('payment_method', 'cash')}
                  className={`border rounded-lg px-4 py-3 text-left transition-all ${
                    form.payment_method === 'cash'
                      ? 'border-[#C8972E] bg-[#FFF8E8] text-[#1A1A1A] shadow-[0_8px_24px_rgba(200,151,46,0.14)]'
                      : 'border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={paymentRadioClass(form.payment_method === 'cash')}>
                          <span className={paymentRadioDotClass(form.payment_method === 'cash')} />
                        </span>
                        <p className="text-sm font-semibold text-[#111111]">Efectivo / Transferencia / Crypto</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6B6560]">
                        <Banknote size={14} />
                        <span>Coordinación manual por WhatsApp o tienda</span>
                      </div>
                      {cashDiscountAvailablePercent > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700">
                          <BadgePercent size={13} />
                          <span>{cashDiscountAvailablePercent}% OFF</span>
                          <span className="text-green-600">Ahorrás {formatPrice(cashDiscountPreviewAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Resumen del pedido ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
            <div className="border border-[#E8E4DD] rounded-2xl p-6 sticky top-24 bg-white shadow-sm">
              <h2 className="text-sm font-bold tracking-[0.15em] text-[#1A1A1A] mb-6">TU PEDIDO</h2>

              {/* Lista de items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-3">
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
                  <span className="text-[#1A1A1A]">{formatPrice(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento ({discountPercent}%)</span>
                    <span className="text-green-600">-{formatPrice(codeDiscountAmount)}</span>
                  </div>
                )}
                {discountFixed > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento</span>
                    <span className="text-green-600">-{formatPrice(discountFixed)}</span>
                  </div>
                )}
                {cashDiscountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento efectivo ({cashDiscountPercent}%)</span>
                    <span className="text-green-600">-{formatPrice(cashDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">Costo de envío</span>
                  <span className="text-[#1A1A1A]">{formatPrice(shippingPrice)}</span>
                </div>
                <div className="border-t border-[#E8E4DD] pt-3 flex justify-between text-lg font-bold">
                  <span className="text-[#1A1A1A]">Total</span>
                  <span className="text-[#1A1A1A]">{formatPrice(checkoutTotal)}</span>
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
                  'PAGAR AHORA'
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-20 min-h-screen flex items-center justify-center text-[#6B6560] text-sm">Cargando...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
