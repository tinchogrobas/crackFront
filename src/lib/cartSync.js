import { getProductsByIds } from '@/lib/api';
import { getProductMaxQuantity } from '@/store/cartStore';

export function buildCartIssues(items, products) {
  const productsMap = new Map(products.map((product) => [product.id, product]));

  return items.flatMap((item) => {
    const product = productsMap.get(item.id);
    if (!product || product.in_stock === false) {
      return [{ id: item.id, name: item.name, issue: 'sin stock' }];
    }

    const maxQty = getProductMaxQuantity(product);
    if (maxQty === 0) {
      return [{ id: item.id, name: item.name, issue: 'sin stock' }];
    }

    if (Number.isFinite(maxQty) && item.quantity > maxQty) {
      return [{
        id: item.id,
        name: item.name,
        issue: maxQty === 1 ? 'solo queda 1 unidad' : `solo quedan ${maxQty} unidades`,
      }];
    }

    return [];
  });
}

export async function syncCartWithBackend(items, syncCartProducts) {
  if (!items.length) {
    syncCartProducts([]);
    return [];
  }

  const products = await getProductsByIds(items.map((item) => item.id));
  syncCartProducts(products);
  return buildCartIssues(items, products);
}