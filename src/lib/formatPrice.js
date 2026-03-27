export function formatPrice(price) {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
