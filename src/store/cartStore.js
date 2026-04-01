'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const UNIQUE_CATEGORIES = new Set(['Slab', 'Single']);

export function getProductCategoryName(product) {
  return typeof product?.category === 'object' ? product.category?.name : product?.category;
}

export function isUniqueProduct(product) {
  return UNIQUE_CATEGORIES.has(getProductCategoryName(product));
}

export function getProductMaxQuantity(product) {
  if (!product || product.in_stock === false) return 0;
  if (isUniqueProduct(product)) return 1;
  if (Number.isInteger(product.stock_quantity)) return product.stock_quantity;
  return Number.POSITIVE_INFINITY;
}

function normalizeCartItem(product, quantity, currentItem = {}) {
  const categoryName = getProductCategoryName(product);
  const maxQty = getProductMaxQuantity(product);
  const nextQuantity = Number.isFinite(maxQty) && maxQty > 0
    ? Math.min(quantity, maxQty)
    : quantity;

  return {
    ...currentItem,
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price_ars,
    final_price: product.final_price,
    discount_percent: product.discount_percent,
    image_url: product.image_url,
    category: categoryName,
    stock_quantity: product.stock_quantity ?? null,
    in_stock: product.in_stock !== false,
    is_unique: isUniqueProduct(product),
    quantity: nextQuantity,
  };
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      discountCode: null,
      discountPercent: 0,
      discountFixed: 0,

      // Cart drawer UI state (not persisted — see partialize below)
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addToCart: (product, qty = 1) => {
        const items = get().items;
        const existing = items.find((item) => item.id === product.id);
        const maxQty = getProductMaxQuantity(product);

        if (maxQty === 0) return false;

        if (existing) {
          if (existing.quantity >= maxQty) return false;
          const newQty = Number.isFinite(maxQty)
            ? Math.min(existing.quantity + qty, maxQty)
            : existing.quantity + qty;
          if (newQty === existing.quantity) return false;
          set({
            items: items.map((item) =>
              item.id === product.id ? normalizeCartItem(product, newQty, item) : item
            ),
          });
        } else {
          const initialQuantity = Number.isFinite(maxQty) ? Math.min(qty, maxQty) : qty;
          if (initialQuantity <= 0) return false;

          set({
            items: [...items, normalizeCartItem(product, initialQuantity)],
          });
        }
        return true;
      },

      removeFromCart: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set({
          items: get().items.map((item) => {
            if (item.id !== productId) return item;
            const maxQty = getProductMaxQuantity(item);
            if (maxQty === 0) return item;
            return {
              ...item,
              quantity: Number.isFinite(maxQty) ? Math.min(quantity, maxQty) : quantity,
            };
          }),
        });
      },

      syncCartProducts: (products) => {
        const productsMap = new Map(products.map((product) => [product.id, product]));

        set({
          items: get().items.map((item) => {
            const product = productsMap.get(item.id);

            if (!product) {
              return {
                ...item,
                in_stock: false,
                stock_quantity: 0,
              };
            }

            const maxQty = getProductMaxQuantity(product);
            const nextQuantity = Number.isFinite(maxQty) && maxQty > 0
              ? Math.min(item.quantity, maxQty)
              : item.quantity;

            return normalizeCartItem(product, nextQuantity, item);
          }),
        });
      },

      clearCart: () => set({ items: [], discountCode: null, discountPercent: 0, discountFixed: 0 }),

      setDiscount: (code, percent, fixed = 0) => set({ discountCode: code, discountPercent: percent, discountFixed: fixed }),

      clearDiscount: () => set({ discountCode: null, discountPercent: 0, discountFixed: 0 }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.final_price || item.price);
          return total + price * item.quantity;
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const percent = get().discountPercent;
        const fixed = get().discountFixed || 0;
        const afterPercent = subtotal - (subtotal * percent / 100);
        return Math.max(0, afterPercent - fixed);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'crack-cart',
      partialize: (state) => ({
        items: state.items,
        discountCode: state.discountCode,
        discountPercent: state.discountPercent,
        discountFixed: state.discountFixed,
      }),
    }
  )
);
