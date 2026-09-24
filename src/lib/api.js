/**
 * API client — conecta con el backend Django.
 * Todos los precios vienen en ARS desde el servidor (price_usd * exchange_rate).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Mensaje para el cliente cuando el backend no mandó uno propio.
 *
 * Lo que sale de acá se lee tal cual en pantalla, así que nunca lleva jerga:
 * ni códigos, ni el statusText de HTTP, ni el "Failed to fetch" del navegador.
 * El detalle técnico ya queda en `status` y `data` para quien lo necesite.
 */
function fallbackMessage(status) {
  if (status === 400) return 'Revisá los datos e intentá de nuevo.';
  if (status === 401 || status === 403) return 'No tenés permiso para hacer esto.';
  if (status === 404) return 'No encontramos lo que buscabas.';
  if (status === 409) return 'Algo cambió mientras completabas la operación. Actualizá la página y volvé a intentar.';
  if (status === 429) return 'Estás haciendo muchas consultas seguidas. Esperá un momento y volvé a intentar.';
  if (status === 503) return 'El servicio no está disponible en este momento. Volvé a intentar en unos minutos.';
  if (status >= 500) return 'Tuvimos un problema de nuestro lado. Volvé a intentar en unos minutos.';
  return 'No pudimos completar la operación. Volvé a intentar en unos minutos.';
}

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    // El servidor no contestó: sin internet, caído o CORS.
    throw Object.assign(
      new Error('No pudimos conectarnos. Revisá tu conexión a internet y volvé a intentar.'),
      { status: 0, data: {} }
    );
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw Object.assign(new Error(error.detail || fallbackMessage(res.status)), {
      status: res.status,
      data: error,
    });
  }

  return res.json();
}

/** Unwrap DRF paginated responses: { results: [...] } → [...] */
function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.search)               qs.set('search', params.search);
  if (params.tcg)                  qs.set('tcg', params.tcg);
  if (params.category)             qs.set('category', params.category);
  if (params.condition)            qs.set('condition', params.condition);
  if (params.certification_entity) qs.set('certification_entity', params.certification_entity);
  if (params.min_price != null)    qs.set('min_price', params.min_price);
  if (params.max_price != null)    qs.set('max_price', params.max_price);
  if (params.in_stock != null)     qs.set('in_stock', params.in_stock);
  if (params.has_discount != null) qs.set('has_discount', params.has_discount);
  if (params.ordering)             qs.set('ordering', params.ordering);
  if (params.page)                 qs.set('page', params.page);

  const query = qs.toString();
  return apiFetch(`/products/${query ? `?${query}` : ''}`);
}

export async function getProductBySlug(slug) {
  return apiFetch(`/products/${slug}/`);
}

export async function getProductsByIds(ids = []) {
  const normalizedIds = [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (normalizedIds.length === 0) return [];

  const qs = new URLSearchParams({ ids: normalizedIds.join(',') });
  return apiFetch(`/products/by-ids/?${qs}`).then(unwrapList);
}

export async function getNewArrivals() {
  return apiFetch('/products/new-arrivals/').then(unwrapList);
}

export async function getFeaturedProducts() {
  return apiFetch('/products/featured/').then(unwrapList);
}

export async function searchProducts(q) {
  if (!q || q.trim().length < 2) return [];
  const qs = new URLSearchParams({ search: q.trim() });
  const data = await apiFetch(`/products/?${qs}`);
  return unwrapList(data);
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export async function getTcgs() {
  return apiFetch('/tcgs/').then(unwrapList);
}

export async function getCategories() {
  return apiFetch('/categories/').then(unwrapList);
}

export async function getConditions() {
  return apiFetch('/conditions/').then(unwrapList);
}

export async function getCertificationEntities() {
  return apiFetch('/certification-entities/').then(unwrapList);
}

// ─── Exchange Rate ────────────────────────────────────────────────────────────

export async function getExchangeRate() {
  return apiFetch('/exchange-rate/');
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Crea una orden en el backend.
 * El backend valida stock y calcula precios — el frontend solo envía product_id + quantity.
 *
 * @param {Object} orderData
 * @param {string} orderData.customer_name
 * @param {string} orderData.customer_email
 * @param {string} [orderData.customer_phone]
 * @param {string} [orderData.shipping_type] - 'home' | 'pickup'
 * @param {string} [orderData.shipping_method] - 'branch_normal' | 'branch_express' | 'home'
 * @param {string} [orderData.shipping_zone] - 'ba' | 'province'
 * @param {string} [orderData.shipping_address]
 * @param {string} [orderData.shipping_city]
 * @param {string} [orderData.shipping_province]
 * @param {string} [orderData.shipping_zip]
 * @param {string} [orderData.discount_code]
 * @param {Array<{product_id: number, quantity: number}>} orderData.items
 */
export async function createOrder(orderData) {
  const payload = { ...orderData };
  if (typeof window !== 'undefined') {
    payload.frontend_origin = window.location.origin;
  }

  return apiFetch('/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Sube el comprobante de la transferencia y devuelve { token, name, content_type, size }.
 *
 * Va antes de crear la orden: ese `token` es lo que después habilita el alta.
 * No pasa por `apiFetch` porque manda FormData, y ahí el navegador tiene que
 * poner el Content-Type con su propio boundary.
 */
export async function uploadTransferReceipt(file) {
  const body = new FormData();
  body.append('file', file);

  let res;
  try {
    res = await fetch(`${BASE_URL}/orders/receipt/`, { method: 'POST', body });
  } catch {
    throw Object.assign(
      new Error('No pudimos conectarnos. Revisá tu conexión a internet y volvé a intentar.'),
      { status: 0, data: {} }
    );
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw Object.assign(new Error(error.detail || fallbackMessage(res.status)), {
      status: res.status,
      data: error,
    });
  }

  return res.json();
}

export async function getPaymentConfig() {
  return apiFetch('/payments/config/');
}

export async function verifyMercadoPagoPayment(payload) {
  return apiFetch('/payments/verify/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Discount ─────────────────────────────────────────────────────────────────

export async function validateDiscount(code) {
  return apiFetch('/payments/validate-discount/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export async function subscribe(email) {
  return apiFetch('/subscribe/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function unsubscribeNewsletter(token) {
  return apiFetch('/unsubscribe/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function sendContact(data) {
  return apiFetch('/contact/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmContactMarkRead(token) {
  return apiFetch('/contact/mark-read/confirm/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function getSiteConfig() {
  return apiFetch('/site-config/');
}

// ─── Importación eBay ─────────────────────────────────────────────────────────

/** Parámetros de la calculadora: tipos de ítem, límites y si la sección está activa. */
export async function getEbayConfig() {
  return apiFetch('/ebay/config/');
}

/**
 * Cotiza una publicación de eBay.
 * @param {string} url - Link de la publicación (largo, corto o el id pelado).
 * @param {number} [quantity]
 */
export async function quoteEbayItem(url, quantity = 1) {
  return apiFetch('/ebay/quote/', {
    method: 'POST',
    body: JSON.stringify({ url, quantity }),
  });
}

/**
 * Confirma el pedido de importación.
 * El backend re-cotiza cada publicación: `quoted_price` viaja solo para que
 * pueda detectar si el precio cambió, nunca se usa para calcular el total.
 */
export async function createEbayOrder(orderData) {
  return apiFetch('/ebay/orders/', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

/** Seguimiento público del pedido por su código. */
export async function getEbayOrder(orderCode) {
  return apiFetch(`/ebay/orders/${encodeURIComponent(orderCode)}/`);
}
