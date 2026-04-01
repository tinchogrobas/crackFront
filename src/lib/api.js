/**
 * API client — conecta con el backend Django.
 * Todos los precios vienen en ARS desde el servidor (price_usd * exchange_rate).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(error.detail || 'API error'), { status: res.status, data: error });
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
 * @param {string} [orderData.shipping_address]
 * @param {string} [orderData.shipping_city]
 * @param {string} [orderData.shipping_province]
 * @param {string} [orderData.shipping_zip]
 * @param {string} [orderData.discount_code]
 * @param {Array<{product_id: number, quantity: number}>} orderData.items
 */
export async function createOrder(orderData) {
  return apiFetch('/orders/', {
    method: 'POST',
    body: JSON.stringify(orderData),
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

export async function sendContact(data) {
  return apiFetch('/contact/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSiteConfig() {
  return apiFetch('/site-config/');
}
