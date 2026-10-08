/**
 * API de la cuenta del comprador (`/api/v1/customers/...` en Django).
 *
 * El token de Supabase viaja en `X-Customer-Token` y no en `Authorization`:
 * ese header ya lo usa el JWT del staff, y mezclarlos haría que el backend
 * rechace la compra de un cliente logueado (ver apps/customers/authentication.py).
 *
 * El token lo da SessionProvider a través de `setCustomerTokenProvider`. Se
 * pide en cada request (y no se guarda una vez) porque supabase-js lo renueva
 * solo cada hora.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const CUSTOMER_TOKEN_HEADER = 'X-Customer-Token';

let tokenProvider = async () => null;

export function setCustomerTokenProvider(fn) {
  tokenProvider = fn;
}

/** El token vigente del comprador, o null si no hay sesión. Nunca rechaza. */
export async function getCustomerToken() {
  try {
    return await tokenProvider();
  } catch {
    return null;
  }
}

function errorMessage(status, data) {
  if (data?.detail) return data.detail;
  const firstField = data && typeof data === 'object' ? Object.values(data)[0] : null;
  if (Array.isArray(firstField) && firstField[0]) return String(firstField[0]);
  if (status === 401) return 'Tu sesión venció. Volvé a ingresar.';
  if (status === 429) return 'Estás haciendo muchas consultas seguidas. Esperá un momento y volvé a intentar.';
  if (status >= 500) return 'Tuvimos un problema de nuestro lado. Volvé a intentar en unos minutos.';
  return 'No pudimos completar la operación. Volvé a intentar.';
}

async function customerFetch(path, { token, ...options } = {}) {
  const authToken = token ?? (await getCustomerToken());
  let res;
  try {
    res = await fetch(`${BASE_URL}/customers${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { [CUSTOMER_TOKEN_HEADER]: authToken } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw Object.assign(
      new Error('No pudimos conectarnos. Revisá tu conexión a internet y volvé a intentar.'),
      { status: 0, data: {} }
    );
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(errorMessage(res.status, data)), { status: res.status, data });
  }
  return data;
}

/**
 * Al entrar: crea la cuenta si es nueva y trae las compras de invitado.
 * `marketingOptIn`: marcó "Enviarme novedades y ofertas" en el login.
 */
export const syncSession = (token, { marketingOptIn = false } = {}) =>
  customerFetch('/session/', {
    method: 'POST',
    token,
    body: JSON.stringify({ marketing_opt_in: marketingOptIn }),
  });

export const getProfile = () => customerFetch('/profile/');
export const updateProfile = (data) =>
  customerFetch('/profile/', { method: 'PATCH', body: JSON.stringify(data) });

export const getAddresses = () => customerFetch('/addresses/');
export const createAddress = (data) =>
  customerFetch('/addresses/', { method: 'POST', body: JSON.stringify(data) });
export const updateAddress = (id, data) =>
  customerFetch(`/addresses/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAddress = (id) => customerFetch(`/addresses/${id}/`, { method: 'DELETE' });

export const getOrders = () => customerFetch('/orders/');
