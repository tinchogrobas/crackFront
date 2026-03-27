'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        const categoryName = typeof product.category === 'object' ? product.category.name : product.category;
        const isUnique = categoryName === 'Slab' || categoryName === 'Single';
        const maxQty = isUnique ? 1 : (product.stock_quantity || 99);

        if (existing) {
          if (existing.quantity >= maxQty) return false;
          const newQty = Math.min(existing.quantity + qty, maxQty);
          if (newQty === existing.quantity) return false;
          set({
            items: items.map((item) =>
              item.id === product.id ? { ...item, quantity: newQty } : item
            ),
          });
        } else {
          set({
            items: [...items, {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price_ars,
              final_price: product.final_price,
              discount_percent: product.discount_percent,
              image_url: product.image_url,
              category: categoryName,
              stock_quantity: product.stock_quantity,
              is_unique: isUnique,
              quantity: Math.min(qty, maxQty),
            }],
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
            const maxQty = item.is_unique ? 1 : (item.stock_quantity || 99);
            return { ...item, quantity: Math.min(quantity, maxQty) };
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
