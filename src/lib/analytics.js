'use client';
/**
 * Capa única de eventos de medición.
 *
 * Un solo `track*()` por acción de negocio alimenta a la vez:
 *   - `window.dataLayer`  → Google Tag Manager (si algún día se enchufa)
 *   - `gtag()`            → GA4 ecommerce + conversiones de Google Ads
 *   - `fbq()`             → Meta Pixel (browser)
 *   - `/api/track`        → Meta Conversions API (server-side)
 *
 * Los componentes nunca llaman a `gtag` ni a `fbq` directo. Si mañana se
 * cambia de proveedor o se mueve todo a GTM, se toca este archivo y nada más.
 *
 * Pixel + CAPI mandan el MISMO `event_id`. Sin eso Meta cuenta dos veces cada
 * conversión y el ROAS que reporta queda inflado al doble.
 */

import {
  ADS_LABELS,
  CAPI_ENABLED,
  CONSENT_STORAGE_KEY,
  GA4_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
} from './analytics.config';

const CURRENCY = 'ARS';

const isBrowser = () => typeof window !== 'undefined';

/** id de evento compartido entre Pixel y CAPI para deduplicar. */
export function newEventId() {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function gtag(...args) {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') window.gtag(...args);
  else window.dataLayer.push(args);
}

function fbq(...args) {
  if (!isBrowser() || typeof window.fbq !== 'function') return;
  window.fbq(...args);
}

function pushDataLayer(payload) {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  // GA4 arrastra el `ecommerce` del evento anterior si no se limpia: dos
  // add_to_cart seguidos mandarían los items del primero pegados al segundo.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(payload);
}

// ─── Consentimiento ──────────────────────────────────────────────────────────

export const CONSENT_GRANTED = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

export const CONSENT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

export function readConsent() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setConsent(accepted) {
  if (!isBrowser()) return;
  const state = accepted ? CONSENT_GRANTED : CONSENT_DENIED;
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ state, decidedAt: new Date().toISOString() }),
    );
  } catch {
    // Modo incógnito con storage bloqueado: se aplica igual para esta sesión.
  }
  gtag('consent', 'update', state);
  pushDataLayer({ event: 'consent_update', consent_accepted: accepted });
  // El Pixel respeta el consentimiento por su propio canal, no por Consent Mode.
  fbq('consent', accepted ? 'grant' : 'revoke');
}

// ─── Normalización de productos ──────────────────────────────────────────────

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function nameOf(value) {
  if (!value) return undefined;
  return typeof value === 'object' ? value.name || value.abbreviation || undefined : String(value);
}

/** Convierte un producto o un item del carrito al formato `items[]` de GA4. */
export function toGa4Item(product, { quantity = 1, index, listName } = {}) {
  if (!product) return null;
  const price = num(product.final_price ?? product.price ?? product.price_ars);
  const fullPrice = num(product.price_ars ?? product.price ?? price);
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_brand: nameOf(product.tcg) || 'CRACK TCG',
    item_category: nameOf(product.category),
    item_category2: nameOf(product.condition),
    item_category3: nameOf(product.certification_entity),
    item_variant: product.slug,
    price,
    // GA4 usa `discount` como monto absoluto por unidad, no como porcentaje.
    ...(fullPrice > price ? { discount: Number((fullPrice - price).toFixed(2)) } : {}),
    quantity: Math.max(1, num(quantity) || 1),
    ...(listName ? { item_list_name: listName } : {}),
    ...(Number.isInteger(index) ? { index } : {}),
  };
}

function ga4ItemsValue(items) {
  return Number(
    items.reduce((total, item) => total + num(item.price) * num(item.quantity || 1), 0).toFixed(2),
  );
}

/** Los `content_ids` de Meta tienen que coincidir con los `id` del catálogo. */
function toMetaContents(items) {
  return items.map((item) => ({
    id: item.item_id,
    quantity: num(item.quantity) || 1,
    item_price: num(item.price),
  }));
}

// ─── Emisor central ──────────────────────────────────────────────────────────

/**
 * @param {object} options
 * @param {string} options.name        nombre GA4 del evento (snake_case)
 * @param {string} [options.metaEvent] evento equivalente de Meta
 * @param {boolean} [options.metaCustom] true → `trackCustom` en vez de `track`
 * @param {object} [options.params]    parámetros GA4
 * @param {object} [options.metaData]  custom_data del Pixel/CAPI
 * @param {object} [options.userData]  datos personales sin hashear (los hashea el server)
 * @param {string} [options.adsLabel]  clave de ADS_LABELS a disparar como conversión
 * @param {string} [options.eventId]   para reusar un id ya generado
 */
function emit({
  name,
  metaEvent,
  metaCustom = false,
  params = {},
  metaData = {},
  userData = null,
  adsLabel = null,
  eventId,
}) {
  if (!isBrowser()) return null;
  const id = eventId || newEventId();

  pushDataLayer({ event: name, event_id: id, ...params });

  if (GA4_ID) gtag('event', name, params);

  const label = adsLabel ? ADS_LABELS[adsLabel] : '';
  if (GOOGLE_ADS_ID && label) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      value: params.value,
      currency: params.currency || CURRENCY,
      transaction_id: params.transaction_id,
    });
  }

  if (META_PIXEL_ID && metaEvent) {
    fbq(metaCustom ? 'trackCustom' : 'track', metaEvent, metaData, { eventID: id });
  }

  if (CAPI_ENABLED && metaEvent) {
    sendToCapi({ eventName: metaEvent, eventId: id, customData: metaData, userData });
  }

  return id;
}

/**
 * Espeja el evento a la Conversions API. Falla en silencio a propósito: el
 * Pixel del browser ya lo mandó, y una caída de CAPI no puede romper un
 * checkout. `keepalive` lo mantiene vivo si la página navega en el medio
 * (justo lo que pasa al redirigir a Mercado Pago).
 */
function sendToCapi({ eventName, eventId, customData, userData }) {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        custom_data: customData || {},
        user_data: userData || {},
      }),
    }).catch(() => {});
  } catch {
    // Sin red: el evento del browser alcanza.
  }
}

/**
 * Enhanced conversions de Google Ads: mejora la atribución cuando se pierde la
 * cookie. Google hashea del lado del cliente, así que acá se manda en claro
 * como pide la API de gtag.
 */
export function setUserData({ email, phone, firstName, lastName, city, region, postalCode } = {}) {
  if (!GOOGLE_ADS_ID && !GA4_ID) return;
  const address = { country: 'AR' };
  if (firstName) address.first_name = firstName;
  if (lastName) address.last_name = lastName;
  if (city) address.city = city;
  if (region) address.region = region;
  if (postalCode) address.postal_code = postalCode;

  gtag('set', 'user_data', {
    ...(email ? { email: String(email).trim().toLowerCase() } : {}),
    ...(phone ? { phone_number: normalizePhone(phone) } : {}),
    ...(Object.keys(address).length > 1 ? { address } : {}),
  });
}

/** Google y Meta piden E.164. Un número argentino suelto se asume +54. */
function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('54')) return `+${digits}`;
  return `+54${digits.replace(/^0/, '')}`;
}

// ─── Eventos del funnel ──────────────────────────────────────────────────────

export function trackPageView(url) {
  if (!isBrowser()) return;
  if (GA4_ID) gtag('event', 'page_view', { page_location: url, page_title: document.title });
  fbq('track', 'PageView');
  pushDataLayer({ event: 'page_view_spa', page_location: url });
}

export function trackViewItem(product) {
  const item = toGa4Item(product);
  if (!item) return;
  return emit({
    name: 'view_item',
    metaEvent: 'ViewContent',
    params: { currency: CURRENCY, value: item.price, items: [item] },
    metaData: {
      content_type: 'product',
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_category: item.item_category,
      contents: toMetaContents([item]),
      currency: CURRENCY,
      value: item.price,
    },
  });
}

export function trackViewItemList(products, listName = 'Tienda') {
  const items = (products || [])
    .slice(0, 30)
    .map((p, i) => toGa4Item(p, { index: i, listName }))
    .filter(Boolean);
  if (!items.length) return;
  return emit({ name: 'view_item_list', params: { item_list_name: listName, items } });
}

export function trackSelectItem(product, listName = 'Tienda', index) {
  const item = toGa4Item(product, { index, listName });
  if (!item) return;
  return emit({ name: 'select_item', params: { item_list_name: listName, items: [item] } });
}

export function trackAddToCart(product, quantity = 1) {
  const item = toGa4Item(product, { quantity });
  if (!item) return;
  const value = ga4ItemsValue([item]);
  return emit({
    name: 'add_to_cart',
    metaEvent: 'AddToCart',
    adsLabel: 'add_to_cart',
    params: { currency: CURRENCY, value, items: [item] },
    metaData: {
      content_type: 'product',
      content_ids: [item.item_id],
      content_name: item.item_name,
      contents: toMetaContents([item]),
      currency: CURRENCY,
      value,
    },
  });
}

export function trackRemoveFromCart(cartItem, quantity) {
  const item = toGa4Item(cartItem, { quantity: quantity ?? cartItem?.quantity ?? 1 });
  if (!item) return;
  return emit({
    name: 'remove_from_cart',
    params: { currency: CURRENCY, value: ga4ItemsValue([item]), items: [item] },
  });
}

export function trackViewCart(cartItems) {
  const items = (cartItems || []).map((i) => toGa4Item(i, { quantity: i.quantity })).filter(Boolean);
  if (!items.length) return;
  return emit({
    name: 'view_cart',
    params: { currency: CURRENCY, value: ga4ItemsValue(items), items },
  });
}

export function trackBeginCheckout(cartItems, { value, coupon } = {}) {
  const items = (cartItems || []).map((i) => toGa4Item(i, { quantity: i.quantity })).filter(Boolean);
  if (!items.length) return;
  const total = value != null ? Number(num(value).toFixed(2)) : ga4ItemsValue(items);
  return emit({
    name: 'begin_checkout',
    metaEvent: 'InitiateCheckout',
    adsLabel: 'begin_checkout',
    params: { currency: CURRENCY, value: total, items, ...(coupon ? { coupon } : {}) },
    metaData: {
      content_type: 'product',
      content_ids: items.map((i) => i.item_id),
      contents: toMetaContents(items),
      num_items: items.reduce((n, i) => n + num(i.quantity), 0),
      currency: CURRENCY,
      value: total,
    },
  });
}

export function trackAddShippingInfo(cartItems, { value, shippingTier } = {}) {
  const items = (cartItems || []).map((i) => toGa4Item(i, { quantity: i.quantity })).filter(Boolean);
  if (!items.length) return;
  return emit({
    name: 'add_shipping_info',
    params: {
      currency: CURRENCY,
      value: value != null ? Number(num(value).toFixed(2)) : ga4ItemsValue(items),
      shipping_tier: shippingTier,
      items,
    },
  });
}

export function trackAddPaymentInfo(cartItems, { value, paymentType, coupon } = {}) {
  const items = (cartItems || []).map((i) => toGa4Item(i, { quantity: i.quantity })).filter(Boolean);
  if (!items.length) return;
  const total = value != null ? Number(num(value).toFixed(2)) : ga4ItemsValue(items);
  return emit({
    name: 'add_payment_info',
    metaEvent: 'AddPaymentInfo',
    params: {
      currency: CURRENCY,
      value: total,
      payment_type: paymentType,
      items,
      ...(coupon ? { coupon } : {}),
    },
    metaData: {
      content_type: 'product',
      content_ids: items.map((i) => i.item_id),
      contents: toMetaContents(items),
      currency: CURRENCY,
      value: total,
    },
  });
}

/**
 * Conversión de compra.
 *
 * `transactionId` es obligatorio: es la clave con la que GA4 y Meta descartan
 * los duplicados si el cliente refresca la pantalla de confirmación. Además el
 * caller la guarda en sessionStorage (ver `hasTrackedPurchase`).
 */
export function trackPurchase({ transactionId, items, value, shipping, tax, coupon, user }) {
  const ga4Items = (items || []).map((i) => toGa4Item(i, { quantity: i.quantity })).filter(Boolean);
  const total = value != null ? Number(num(value).toFixed(2)) : ga4ItemsValue(ga4Items);

  if (user) setUserData(user);

  return emit({
    name: 'purchase',
    metaEvent: 'Purchase',
    adsLabel: 'purchase',
    params: {
      transaction_id: String(transactionId || ''),
      currency: CURRENCY,
      value: total,
      ...(shipping != null ? { shipping: num(shipping) } : {}),
      ...(tax != null ? { tax: num(tax) } : {}),
      ...(coupon ? { coupon } : {}),
      items: ga4Items,
    },
    metaData: {
      content_type: 'product',
      content_ids: ga4Items.map((i) => i.item_id),
      contents: toMetaContents(ga4Items),
      num_items: ga4Items.reduce((n, i) => n + num(i.quantity), 0),
      currency: CURRENCY,
      value: total,
      order_id: String(transactionId || ''),
    },
    userData: user || null,
  });
}

/** Marca una orden como ya trackeada para que un F5 no duplique la conversión. */
export function hasTrackedPurchase(transactionId) {
  if (!isBrowser() || !transactionId) return false;
  const key = `crack-purchase-${transactionId}`;
  try {
    if (window.sessionStorage.getItem(key)) return true;
    window.sessionStorage.setItem(key, '1');
    return false;
  } catch {
    return false;
  }
}

export function trackSearch(term, resultsCount) {
  if (!term) return;
  return emit({
    name: 'search',
    metaEvent: 'Search',
    params: { search_term: term, ...(resultsCount != null ? { results_count: resultsCount } : {}) },
    metaData: { search_string: term, content_category: 'catalog' },
  });
}

export function trackNewsletterSignup(email) {
  return emit({
    name: 'generate_lead',
    metaEvent: 'Subscribe',
    adsLabel: 'lead',
    params: { currency: CURRENCY, value: 0, method: 'newsletter' },
    metaData: { content_name: 'Newsletter', currency: CURRENCY, value: 0 },
    userData: email ? { email } : null,
  });
}

export function trackContactLead({ email, phone, name, source = 'contacto' } = {}) {
  const [firstName, ...rest] = String(name || '').trim().split(/\s+/);
  return emit({
    name: 'generate_lead',
    metaEvent: 'Lead',
    adsLabel: 'lead',
    params: { currency: CURRENCY, value: 0, method: source },
    metaData: { content_name: source, currency: CURRENCY, value: 0 },
    userData: {
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(firstName ? { firstName } : {}),
      ...(rest.length ? { lastName: rest.join(' ') } : {}),
    },
  });
}
