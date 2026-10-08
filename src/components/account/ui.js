/** Clases compartidas de la cuenta: las mismas del checkout para que se sienta un solo sitio. */

export const inputClass =
  'w-full bg-white border border-[#E8E4DD] rounded-lg px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C8972E]/40 placeholder:text-[#6B6560]/40 transition-all disabled:bg-[#F5F1EA] disabled:text-[#6B6560]';

export const labelClass = 'block text-[11px] tracking-[0.1em] text-[#6B6560] uppercase mb-1.5 font-medium';

export const primaryButton =
  'bg-[#C8972E] text-white text-[11px] tracking-[0.15em] font-bold px-6 py-3.5 rounded-lg hover:bg-[#B8851F] transition-all disabled:opacity-50 active:scale-[0.98] inline-flex items-center justify-center gap-2';

export const secondaryButton =
  'bg-white border border-[#E8E4DD] text-[#1A1A1A] text-[12px] font-semibold px-4 py-2 rounded-lg hover:border-[#1A1A1A]/40 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2';

export const textButton =
  'text-[13px] text-[#6B6560] hover:text-[#1A1A1A] underline underline-offset-4 decoration-[#E8E4DD] hover:decoration-[#1A1A1A]/40 transition-colors disabled:opacity-50';

export const cardClass = 'bg-white border border-[#E8E4DD] rounded-xl';

export const sectionTitle = 'text-sm font-bold tracking-[0.15em] text-[#1A1A1A] uppercase';

export const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

/** A dónde volver después de entrar. Solo rutas internas: nada de `//otro-sitio.com`. */
export function safeNext(value, fallback = '/cuenta/pedidos') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
