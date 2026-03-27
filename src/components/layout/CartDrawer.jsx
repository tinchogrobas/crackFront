'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/formatPrice';

export default function CartDrawer({ isOpen, onClose }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[60] border-l border-[#E8E4DD] flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#E8E4DD]">
              <h2 className="font-display text-[13px] font-bold tracking-[0.15em] text-[#1A1A1A]">CARRITO</h2>
              <button onClick={onClose} className="text-[#6B6560]/50 hover:text-[#1A1A1A] transition-colors w-8 h-8 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                <ShoppingBag size={40} className="text-[#6B6560]/20" />
                <p className="text-[#6B6560] text-[13px]">Tu carrito está vacío</p>
                <Link href="/tienda" onClick={onClose} className="text-[12px] font-bold bg-[#C8972E] text-white px-6 py-3 hover:bg-[#B8851F] transition-all">
                  IR A LA TIENDA
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <Link href={`/tienda/${item.slug}`} onClick={onClose} className="w-16 h-20 bg-[#F5F1EA] overflow-hidden flex-shrink-0 relative border border-[#E8E4DD] hover:border-[#C8972E]/40 transition-colors">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} fill className="object-contain p-1" sizes="64px" />
                        ) : (
                          <div className="w-full h-full bg-[#F5F1EA]" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/tienda/${item.slug}`} onClick={onClose} className="text-[13px] font-medium text-[#1A1A1A] truncate block hover:text-[#C8972E] transition-colors">{item.name}</Link>
                        <p className="text-[10px] text-[#6B6560] uppercase tracking-wider mt-0.5">{item.category}</p>
                        <p className="text-[13px] font-bold text-[#C8972E] mt-1">{formatPrice(item.final_price || item.price)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          onClick={() => removeFromCart(item.id)}
                          style={{ cursor: 'pointer', display: 'flex' }}
                          aria-label="Eliminar producto del carrito"
                          className="text-[#6B6560]/50 hover:text-[#C8972E] transition-colors p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="m6 7c.55228 0 1 .44772 1 1v11c0 .5523.44772 1 1 1h8c.5523 0 1-.4477 1-1v-11c0-.55228.4477-1 1-1s1 .44772 1 1v11c0 1.6569-1.3431 3-3 3h-8c-1.65685 0-3-1.3431-3-3v-11c0-.55228.44772-1 1-1z"/>
                            <path fill="currentColor" d="m10 8c.5523 0 1 .44772 1 1v8c0 .5523-.4477 1-1 1-.55228 0-1-.4477-1-1v-8c0-.55228.44772-1 1-1z"/>
                            <path fill="currentColor" d="m14 8c.5523 0 1 .44772 1 1v8c0 .5523-.4477 1-1 1s-1-.4477-1-1v-8c0-.55228.4477-1 1-1z"/>
                            <path fill="currentColor" d="m4 5c0-.55228.44772-1 1-1h14c.5523 0 1 .44772 1 1s-.4477 1-1 1h-14c-.55228 0-1-.44772-1-1z"/>
                            <path fill="currentColor" d="m8 3c0-.55228.44772-1 1-1h6c.5523 0 1 .44772 1 1s-.4477 1-1 1h-6c-.55228 0-1-.44772-1-1z"/>
                          </svg>
                        </span>
                        {item.is_unique ? (
                          <span className="text-[10px] text-[#6B6560]/50 px-1">×1</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center border border-[#E8E4DD] text-[#6B6560] hover:text-[#1A1A1A] hover:border-[#D4CFC6] transition-colors">
                              <Minus size={10} />
                            </button>
                            <span className="text-[12px] font-medium w-5 text-center text-[#1A1A1A]">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.stock_quantity != null && item.quantity >= item.stock_quantity}
                              className="w-6 h-6 flex items-center justify-center border border-[#E8E4DD] text-[#6B6560] hover:text-[#1A1A1A] hover:border-[#D4CFC6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E8E4DD] p-6 space-y-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6B6560]">Subtotal</span>
                    <span className="font-medium text-[#1A1A1A]">{formatPrice(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-[#1A1A1A]">Total</span>
                    <span className="text-[#C8972E]">{formatPrice(getTotal())}</span>
                  </div>
                  <Link href="/checkout" onClick={onClose} className="block w-full bg-[#C8972E] text-white text-center py-4 text-[12px] font-bold tracking-[0.05em] hover:bg-[#B8851F] transition-all">
                    Ir al checkout
                  </Link>
                  <button onClick={onClose} className="w-full text-center text-[12px] text-[#6B6560]/50 hover:text-[#6B6560] transition-colors">
                    Seguir comprando
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
