/**
 * Header que identifica al SSR de Next ante el backend (X-Internal-Key).
 *
 * Todo el SSR sale por pocas IPs de Vercel compartidas por todos los
 * visitantes; sin esta clave el límite por IP del backend se agota y la
 * tienda cae con 429. INTERNAL_API_KEY no es NEXT_PUBLIC_: nunca llega al
 * navegador, así que esto solo agrega el header en el servidor.
 */
export function internalApiHeaders() {
  const key = process.env.INTERNAL_API_KEY;
  return key ? { 'X-Internal-Key': key } : {};
}
