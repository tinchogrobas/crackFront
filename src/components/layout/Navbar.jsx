'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from './CartDrawer';
import SearchOverlay from '@/components/ui/SearchOverlay';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const cartOpen = useCartStore((s) => s.isCartOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/tienda', label: 'Tienda' },
    { href: '/contacto', label: 'Contacto' },
  ];

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-[#C8972E] to-[#B8851F] text-white text-center py-2 text-[11px] tracking-[0.15em] font-bold uppercase fixed top-0 left-0 right-0 z-[60]">
        Envíos a todo el país — 15% OFF con código CRACK15
      </div>

      {/* Main navbar */}
      <nav
        className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? 'bg-white/95 backdrop-blur-2xl border-[#E8E4DD] shadow-md'
            : 'bg-[#1a1a1a]/70 backdrop-blur-md border-[#C8972E]/30'
        }`}
      >
        {/* Gold accent glow below navbar */}
        <div className={`absolute top-full left-0 right-0 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'} pointer-events-none`}>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C8972E] to-transparent" />
          <div className="h-[6px] bg-gradient-to-r from-transparent via-[#C8972E]/50 to-transparent blur-sm" />
          <div className="h-[10px] bg-gradient-to-r from-transparent via-[#C8972E]/20 to-transparent blur-md" />
        </div>

        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: mobile menu + nav links */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden transition-colors ${
                  scrolled
                    ? 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    : 'text-white/70 hover:text-[#C8972E]'
                }`}
              >
                <Menu size={20} />
              </button>
              <div className="hidden lg:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 relative group ${
                      scrolled
                        ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                        : 'text-white/90 hover:text-[#C8972E]'
                    }`}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C8972E] group-hover:w-full transition-all duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <span
                className={`font-display text-xl sm:text-2xl font-bold tracking-[0.3em] transition-all duration-300 ${
                  scrolled
                    ? 'text-[#1A1A1A] hover:text-[#C8972E]'
                    : 'text-white hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                CRACK
              </span>
            </Link>

            {/* Right: search + cart */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir búsqueda"
                className={`transition-colors ${
                  scrolled
                    ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                    : 'text-white/90 hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                <Search size={19} />
              </button>
              <button
                onClick={openCart}
                className={`transition-colors relative ${
                  scrolled
                    ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                    : 'text-white/90 hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                <ShoppingBag size={19} />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#C8972E] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={closeCart} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-full w-full max-w-xs bg-white z-[80] p-8 lg:hidden border-r border-[#E8E4DD] shadow-lg"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="font-display text-lg font-bold tracking-[0.25em] text-[#1A1A1A]">CRACK</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-[#6B6560]/60 hover:text-[#1A1A1A]">
                  <X size={18} />
                </button>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
                className="flex items-center gap-2 mb-8 text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
              >
                <Search size={18} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.12em]">Buscar</span>
              </button>
              <div className="flex flex-col gap-6">
                {[...navLinks, { href: '/otros-productos', label: 'Otros Productos' }].map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="font-display text-2xl font-bold text-[#6B6560] hover:text-[#1A1A1A] transition-colors">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
