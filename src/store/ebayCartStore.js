'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Carrito de importación eBay.
 *
 * Separado del carrito de la tienda a propósito: son dos compras distintas, con
 * monedas distintas (USD acá, ARS allá) y checkouts que no se parecen. Mezclarlos
 * en un store obligaría a que cada consumidor filtre por tipo.
 *
 * Los importes que se guardan acá son los que el servidor devolvió al cotizar y
 * sirven para dibujar el panel. El total que se cobra lo recalcula el backend al
 * confirmar: nada de lo que vive en localStorage entra en una orden.
 */

/** Una cotización vence y hay que volver a pedirla. */
export function isQuoteStale(item, ttlMinutes = 60) {
  if (!item?.quotedAt) return true;
  return Date.now() - item.quotedAt > ttlMinutes * 60 * 1000;
}

export const useEbayCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      /**
       * Agrega una cotización al pedido.
       * Si la publicación ya está en el pedido, suma cantidad en vez de
       * duplicar la línea — pedir dos veces el mismo link es pedir dos unidades.
       */
      addItem: (quote, maxQuantity = 10) => {
        const items = get().items;
        const key = quote.item.item_id;
        const existing = items.find((item) => item.key === key);
        // El tope real es el menor entre el de la tienda y el stock que informa
        // eBay: de una publicación con una sola unidad no se piden dos.
        const cap = Math.min(maxQuantity, quote.item.max_quantity ?? maxQuantity);

        if (existing) {
          const nextQuantity = Math.min(existing.quantity + quote.quote.quantity, cap);
          if (nextQuantity === existing.quantity) return false;
          set({
            items: items.map((item) =>
              item.key === key ? { ...item, quantity: nextQuantity, quotedAt: Date.now() } : item
            ),
          });
          return true;
        }

        set({
          items: [
            ...items,
            {
              key,
              itemId: quote.item.item_id,
              title: quote.item.title,
              imageUrl: quote.item.image_url,
              url: quote.item.url,
              condition: quote.item.condition,
              quantity: Math.min(quote.quote.quantity, cap),
              maxQuantity: cap,
              price: Number(quote.quote.price),
              commission: Number(quote.quote.commission),
              tax: Number(quote.quote.tax),
              ebayShipping: Number(quote.quote.ebay_shipping),
              shippingToConfirm: quote.item.has_shipping_info === false,
              argShipping: Number(quote.quote.arg_shipping),
              unitTotal: Number(quote.quote.unit_total),
              quotedAt: Date.now(),
            },
          ],
        });
        return true;
      },

      removeItem: (key) => set({ items: get().items.filter((item) => item.key !== key) }),

      updateQuantity: (key, quantity, maxQuantity = 10) => {
        set({
          items: get().items.map((item) => {
            if (item.key !== key) return item;
            const cap = Math.min(maxQuantity, item.maxQuantity ?? maxQuantity);
            return { ...item, quantity: Math.max(1, Math.min(quantity, cap)) };
          }),
        });
      },

      clear: () => set({ items: [] }),

      getCount: () => get().items.reduce((total, item) => total + item.quantity, 0),

      /** Desglose del pedido completo, en la misma estructura que devuelve el backend. */
      getTotals: () => {
        const items = get().items;
        const sum = (field) => items.reduce((total, item) => total + item[field] * item.quantity, 0);

        const shippingToConfirm = items.some((item) => item.shippingToConfirm);

        const itemsTotal = sum('price');
        const commissionTotal = sum('commission');
        const taxTotal = sum('tax');
        const ebayShippingTotal = sum('ebayShipping');
        const argShippingTotal = sum('argShipping');

        return {
          itemsTotal,
          commissionTotal,
          taxTotal,
          ebayShippingTotal,
          argShippingTotal,
          // Hay al menos una publicación cuyo envío eBay todavía no se conoce:
          // el total es parcial y el panel tiene que decirlo.
          shippingToConfirm,
          total: itemsTotal + commissionTotal + taxTotal + ebayShippingTotal + argShippingTotal,
        };
      },

      /** Payload del POST: solo links, tipos y cantidades. Los precios los pone el server. */
      toOrderItems: () =>
        get().items.map((item) => ({
          url: item.url,
          quantity: item.quantity,
          quoted_price: item.price,
        })),
    }),
    {
      name: 'crack-ebay-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
