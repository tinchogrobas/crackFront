import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { META_PIXEL_ID } from '@/lib/analytics.config';

/**
 * Conversions API de Meta (server-side).
 *
 * El Pixel del browser lo bloquean los ad blockers, Safari le corta la cookie a
 * 7 días y iOS le saca el click id. Este endpoint manda el mismo evento desde
 * el server con el MISMO `event_id`, así Meta deduplica contra el del browser y
 * recupera las conversiones que el Pixel solo no ve.
 *
 * Corre en runtime Node porque necesita `crypto` para el hash SHA-256: Meta no
 * acepta datos personales en claro.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || '';
const GRAPH_VERSION = 'v21.0';

/**
 * Allowlist de eventos.
 *
 * El endpoint es público (lo llama el browser) y gasta nuestro access token.
 * Sin esta lista cualquiera puede inyectar eventos basura en el pixel y
 * ensuciar las audiencias y el modelo de optimización de las campañas.
 */
const ALLOWED_EVENTS = new Set([
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Search',
  'Lead',
  'Subscribe',
]);

const MAX_BODY_BYTES = 32 * 1024;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Meta exige minúsculas + trim antes del hash; si no, nunca matchea. */
function hashNormalized(value) {
  const clean = String(value ?? '').trim().toLowerCase();
  return clean ? sha256(clean) : undefined;
}

function hashPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return undefined;
  const e164 = digits.startsWith('54') ? digits : `54${digits.replace(/^0/, '')}`;
  return sha256(e164);
}

/** Primera IP de la cadena de proxies — la del cliente real. */
function clientIp(headerList) {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headerList.get('x-real-ip') || undefined;
}

/**
 * `_fbc` es el click id de un anuncio y es LO que atribuye la conversión a la
 * campaña. Si el visitante llegó recién, la cookie todavía no existe pero el
 * `fbclid` sigue en la URL: se arma el valor a mano con el formato de Meta.
 */
function resolveFbc(cookieStore, sourceUrl) {
  const fromCookie = cookieStore.get('_fbc')?.value;
  if (fromCookie) return fromCookie;
  try {
    const fbclid = new URL(sourceUrl).searchParams.get('fbclid');
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    // URL inválida en el body: se sigue sin click id.
  }
  return undefined;
}

function buildUserData({ cookieStore, headerList, sourceUrl, userData }) {
  const u = userData || {};
  return {
    em: hashNormalized(u.email),
    ph: hashPhone(u.phone),
    fn: hashNormalized(u.firstName),
    ln: hashNormalized(u.lastName),
    ct: hashNormalized(u.city),
    st: hashNormalized(u.region),
    zp: hashNormalized(u.postalCode),
    country: hashNormalized(u.country || 'ar'),
    fbp: cookieStore.get('_fbp')?.value,
    fbc: resolveFbc(cookieStore, sourceUrl),
    client_ip_address: clientIp(headerList),
    client_user_agent: headerList.get('user-agent') || undefined,
  };
}

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
}

export async function POST(request) {
  // Sin token configurado el endpoint es un no-op: el Pixel del browser sigue
  // funcionando solo y no se rompe nada.
  if (!ACCESS_TOKEN || !META_PIXEL_ID) {
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventName = body?.event_name;
  if (!ALLOWED_EVENTS.has(eventName)) {
    return new Response(null, { status: 400 });
  }

  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const sourceUrl = typeof body.event_source_url === 'string' ? body.event_source_url : '';

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        // Misma clave que usó el Pixel del browser: es lo que deduplica.
        event_id: String(body.event_id || ''),
        event_source_url: sourceUrl || undefined,
        action_source: 'website',
        user_data: stripUndefined(
          buildUserData({ cookieStore, headerList, sourceUrl, userData: body.user_data }),
        ),
        custom_data: body.custom_data && typeof body.custom_data === 'object' ? body.custom_data : {},
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      // Se loguea el status pero nunca el cuerpo de la respuesta ni el token.
      console.error('[capi] Meta respondió', res.status);
    }
  } catch (error) {
    console.error('[capi] fallo de red', error?.message);
  }

  // Siempre 204: el cliente no espera respuesta y no tiene por qué enterarse de
  // si Meta aceptó el evento.
  return new Response(null, { status: 204 });
}
