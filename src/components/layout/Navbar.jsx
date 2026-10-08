'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Menu, X, Search, LogOut, CircleUserRound } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from './CartDrawer';
import TiendaMegaMenu from './TiendaMegaMenu';
import SearchOverlay from '@/components/ui/SearchOverlay';
import { GRADEOS_WHATSAPP_URL } from '@/lib/gradeos';

const DEFAULT_BANNER_MESSAGE = 'Envíos a todo el país — 15% OFF con código CRACK15';

export default function Navbar({ showTopBanner = true, topBannerMessage = DEFAULT_BANNER_MESSAGE, megaMenu = null }) {
  const ANNOUNCEMENT_BAR_HEIGHT = 36;
  const NAVBAR_TOP_GAP = 0;
  const [scrolled, setScrolled] = useState(false);
  // Megamenú de Tienda: `primed` difiere la descarga de las imágenes hasta que
  // el mouse entra al navbar, así no se bajan en cada carga de página.
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaPrimed, setMegaPrimed] = useState(false);
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const cartOpen = useCartStore((s) => s.isCartOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    setMounted(true);
    setAdminBypass(document.cookie.split('; ').some((c) => c.startsWith('admin_bypass=')));
  }, []);

  const exitAdminMode = () => {
    document.cookie = 'admin_bypass=; Path=/; Max-Age=0; SameSite=Lax';
    window.location.reload();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // `external` manda a WhatsApp en vez de a una ruta del sitio, así que se
  // renderiza con <a> y no con <Link>.
  const navLinks = [
    { href: '/tienda', label: 'Tienda' },
    { href: '/compra-ebay', label: 'Compra eBay'},
    { href: GRADEOS_WHATSAPP_URL, label: 'Gradeos', external: true },
    { href: '/contacto', label: 'Contacto' },
  ];
  // Con el megamenú abierto el navbar toma el estilo claro, igual que al scrollear.
  const light = scrolled || megaOpen;
  const bannerMessage = (topBannerMessage || DEFAULT_BANNER_MESSAGE).trim();
  const navTop = showTopBanner ? ANNOUNCEMENT_BAR_HEIGHT + NAVBAR_TOP_GAP : 0;

  return (
    <>
      {/* Top announcement bar */}
      {showTopBanner && (
        <div className="bg-gradient-to-r from-[#C8972E] to-[#B8851F] text-white text-center h-9 fixed top-0 left-0 right-0 z-30 px-4 overflow-hidden flex items-center justify-center">
          {/* Mobile: marquee del mensaje configurable */}
          <div className="sm:hidden">
            <div className="animate-marquee-slow whitespace-nowrap inline-flex gap-16 text-[10px] tracking-[0.08em] font-bold uppercase">
              <span>{bannerMessage}</span>
              <span>·</span>
              <span>{bannerMessage}</span>
              <span>·</span>
            </div>
          </div>
          {/* Desktop: texto estático configurable */}
          <span className="hidden sm:inline text-[11px] tracking-[0.15em] font-bold uppercase">
            {bannerMessage}
          </span>
        </div>
      )}

      {/* Main navbar */}
      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-500 border-b ${
          megaOpen
            ? 'bg-white border-[#E8E4DD]'
            : scrolled
            ? 'bg-white/95 backdrop-blur-2xl border-[#E8E4DD] shadow-md'
            : 'bg-[#1a1a1a]/70 backdrop-blur-md border-[#C8972E]/30'
        }`}
        style={{ top: `${navTop}px` }}
        onPointerEnter={() => setMegaPrimed(true)}
      >
        {/* Gold accent glow below navbar */}
        <div className={`absolute top-full left-0 right-0 transition-opacity duration-500 ${light ? 'opacity-0' : 'opacity-100'} pointer-events-none`}>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C8972E] to-transparent" />
          <div className="h-[6px] bg-gradient-to-r from-transparent via-[#C8972E]/50 to-transparent blur-sm" />
          <div className="h-[10px] bg-gradient-to-r from-transparent via-[#C8972E]/20 to-transparent blur-md" />
        </div>

        <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-14 sm:h-16">
            {/* Left: mobile menu + nav links */}
            <div className="flex items-center gap-8 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden transition-colors ${
                  light
                    ? 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    : 'text-white/70 hover:text-[#C8972E]'
                }`}
              >
                <Menu size={20} />
              </button>
              <div className="hidden lg:flex items-center gap-8">
                {navLinks.map((link) => {
                  const linkClass = `text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 relative group ${
                    light
                      ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                      : 'text-white/90 hover:text-[#C8972E]'
                  }`;
                  const underline = (
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#C8972E] group-hover:w-full transition-all duration-300" />
                  );
                  const content = (
                    <>
                      {link.label}
                      {underline}
                    </>
                  );

                  if (link.href === '/tienda' && megaMenu) {
                    return (
                      <TiendaMegaMenu
                        key={link.href}
                        data={megaMenu}
                        open={megaOpen}
                        primed={megaPrimed}
                        onOpenChange={setMegaOpen}
                        linkClassName={linkClass}
                        underline={underline}
                      />
                    );
                  }

                  return link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href} className={linkClass}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Center: logo */}
            <Link href="/" className="justify-self-center px-2 -translate-y-[3px] sm:-translate-y-[4px]">
              {!logoUnavailable ? (
                <span className="relative block w-[132px] sm:w-[160px] h-8 sm:h-10">
                  <Image
                    src="/brand/logo.png"
                    alt="Crack"
                    fill
                    priority
                    sizes="(min-width: 640px) 160px, 132px"
                    className={`object-contain transition-opacity duration-500 ease-out ${
                      light ? 'opacity-0' : 'opacity-100'
                    }`}
                    onError={() => setLogoUnavailable(true)}
                  />
                  <Image
                    src="/brand/logo2.png"
                    alt="Crack"
                    fill
                    priority
                    sizes="(min-width: 640px) 160px, 132px"
                    className={`object-contain transition-opacity duration-500 ease-out ${
                      light ? 'opacity-100' : 'opacity-0'
                    }`}
                    onError={() => setLogoUnavailable(true)}
                  />
                </span>
              ) : (
                <span
                  className={`font-display text-xl sm:text-2xl font-bold tracking-[0.3em] transition-all duration-300 ${
                    light
                      ? 'text-[#1A1A1A] hover:text-[#C8972E]'
                      : 'text-white hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  CRACK
                </span>
              )}
            </Link>

            {/* Right: search + cart */}
            <div className="flex items-center justify-end gap-5">
              {mounted && adminBypass && (
                <button
                  onClick={exitAdminMode}
                  aria-label="Salir del modo administrador"
                  title="Salir del modo administrador"
                  className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors ${
                    light
                      ? 'text-[#C8972E] hover:text-[#1A1A1A]'
                      : 'text-[#C8972E] hover:text-white'
                  }`}
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Salir admin</span>
                </button>
              )}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir búsqueda"
                className={`transition-colors ${
                  light
                    ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                    : 'text-white/90 hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                <Search size={22} />
              </button>
              <Link
                href="/cuenta"
                aria-label="Mi cuenta"
                title="Mi cuenta"
                className={`transition-colors ${
                  light
                    ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                    : 'text-white/90 hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                <CircleUserRound size={22} />
              </Link>
              <button
                onClick={openCart}
                className={`transition-colors relative ${
                  light
                    ? 'text-[#6B6560] hover:text-[#1A1A1A]'
                    : 'text-white/90 hover:text-[#C8972E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                }`}
              >
                <ShoppingBag size={22} />
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

      <div className={`mm-underlay hidden lg:block ${megaOpen ? 'is-visible' : ''}`} aria-hidden="true" />

      <CartDrawer isOpen={cartOpen} onClose={closeCart} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} menu={megaMenu} />

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
                {!logoUnavailable ? (
                  <Image
                    src="/brand/logo2.png"
                    alt="Crack"
                    width={124}
                    height={40}
                    className="h-7 w-auto px-1 py-0.5"
                    onError={() => setLogoUnavailable(true)}
                  />
                ) : (
                  <span className="font-display text-lg font-bold tracking-[0.25em] text-[#1A1A1A]">CRACK</span>
                )}
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
              <Link
                href="/cuenta"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 -mt-4 mb-8 text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
              >
                <CircleUserRound size={18} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.12em]">Mi cuenta</span>
              </Link>
              <div className="flex flex-col gap-6">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-display text-2xl font-bold text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="font-display text-2xl font-bold text-[#6B6560] hover:text-[#1A1A1A] transition-colors">
                        {link.label}
                      </Link>
                    )}
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
