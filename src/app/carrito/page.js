'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { syncCartWithBackend } from '@/lib/cartSync';
import { getProductMaxQuantity, useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';

export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const syncCartProducts = useCartStore((s) => s.syncCartProducts);
  const [stockIssues, setStockIssues] = useState([]);
  const cartSignature = useMemo(() => items.map((item) => `${item.id}:${item.quantity}`).join('|'), [items]);
  const cartItemsSnapshot = useMemo(() => items.map((item) => ({ ...item })), [cartSignature]);
  const stockIssuesById = useMemo(() => new Map(stockIssues.map((issue) => [issue.id, issue])), [stockIssues]);

  useEffect(() => {
    let cancelled = false;

    async function syncCart() {
      try {
        const issues = await syncCartWithBackend(cartItemsSnapshot, syncCartProducts);
        if (!cancelled) setStockIssues(issues);
      } catch {
        if (!cancelled) setStockIssues([]);
      }
    }

    syncCart();
    return () => { cancelled = true; };
  }, [cartItemsSnapshot, syncCartProducts]);

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center gap-4"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
          <ShoppingBag size={48} className="text-[#6B6560]/30" />
        </motion.div>
        <p className="text-[#6B6560] text-sm">Tu carrito está vacío</p>
        <Link href="/tienda" className="text-xs tracking-[0.15em] font-medium border border-[#E8E4DD] px-6 py-3 hover:bg-[#F5F1EA] hover:text-[#1A1A1A] transition-all duration-200">
          IR A LA TIENDA
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-black tracking-tight text-[#1A1A1A] mb-10">TU CARRITO</motion.h1>

        {stockIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-red-700">Hay productos con stock insuficiente en tu carrito.</p>
            <p className="text-xs text-red-600 mt-1">Los marcados en rojo deberían quitarse o ajustarse antes de avanzar al checkout.</p>
          </motion.div>
        )}

        <div className="space-y-4 mb-10">
          <AnimatePresence>
          {items.map((item, i) => {
            const maxQty = getProductMaxQuantity(item);
            const issue = stockIssuesById.get(item.id);
            return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex gap-4 rounded-lg p-4 ${issue ? 'border border-red-200 bg-red-50/70' : 'border border-[#E8E4DD] bg-white'}`}
            >
              <div className="w-20 h-20 bg-[#F5F1EA] rounded-lg overflow-hidden flex-shrink-0 relative">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full bg-[#F5F1EA]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</h3>
                <p className="text-[11px] text-[#6B6560] mt-0.5">{item.category}</p>
                <p className="text-sm font-semibold text-[#1A1A1A] mt-1">{formatPrice(item.final_price || item.price)}</p>
                {issue && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                      Stock insuficiente
                    </span>
                    <p className="text-[11px] text-red-600">{issue.issue}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeFromCart(item.id)} className="text-[#6B6560]/40 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
                {issue && (
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[11px] font-semibold text-red-600 underline hover:no-underline"
                  >
                    Quitar
                  </button>
                )}
                {item.is_unique ? (
                  <span className="text-[11px] text-[#6B6560]/50 px-1">×1</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center border border-[#E8E4DD] rounded text-[#6B6560] hover:text-[#1A1A1A] hover:border-[#D4CFC6] transition-colors">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center text-[#1A1A1A]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={maxQty === 0 || (Number.isFinite(maxQty) && item.quantity >= maxQty)}
                      className="w-7 h-7 flex items-center justify-center border border-[#E8E4DD] rounded text-[#6B6560] hover:text-[#1A1A1A] hover:border-[#D4CFC6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
            );
          })}
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-[#E8E4DD] rounded-lg p-6 space-y-4 bg-white">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6560]">Subtotal</span>
            <span className="text-[#1A1A1A]">{formatPrice(getSubtotal())}</span>
          </div>
          <div className="flex justify-between text-xl font-bold">
            <span className="text-[#1A1A1A]">Total</span>
            <span className="text-[#1A1A1A]">{formatPrice(getTotal())}</span>
          </div>
          <Link href="/checkout" className={`block w-full text-center py-4 text-xs font-bold tracking-[0.15em] transition-colors ${stockIssues.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#C8972E] hover:bg-[#B8851F] text-white'}`}>
            IR AL CHECKOUT
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
