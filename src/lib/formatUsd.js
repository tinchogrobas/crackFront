/**
 * Formato de dólares para la sección de importación.
 *
 * A diferencia de `formatPrice`, que muestra pesos sin decimales, acá los
 * centavos importan: los precios de eBay terminan casi siempre en .99 y
 * redondearlos haría que el total no cierre con el desglose.
 */
export function formatUsd(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '$0.00';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
