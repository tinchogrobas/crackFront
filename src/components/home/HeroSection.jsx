'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[65svh] sm:min-h-0 sm:aspect-[16/6] flex items-center sm:items-end overflow-hidden">
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="relative w-full px-5 sm:px-10 lg:px-16 pb-8 sm:pb-10 pt-0 sm:pt-0 flex flex-col items-center sm:items-start text-center sm:text-left">

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-[0.2em]"
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 600,
            color: '#C8972E',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          <span className="hidden sm:inline" style={{ fontSize: '15px', lineHeight: '20px' }}>
            Tu tienda favorita de Pokémon TCG en Argentina
          </span>
          <span className="sm:hidden">
            Tu tienda favorita de Pokémon TCG en Argentina
          </span>
        </motion.p>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] uppercase w-full"
          style={{
            fontFamily: 'var(--font-bebas), "Barlow Condensed", sans-serif',
            fontWeight: 800,
            color: 'rgb(255,255,255)',
          }}
        >
          <span className="hidden sm:block" style={{ fontSize: '64px', lineHeight: '77px' }}>
            CRACK STORE ONLINE
          </span>
          <span className="sm:hidden block" style={{ fontSize: '56px', lineHeight: '1.05' }}>
            CRACK STORE ONLINE
          </span>
        </motion.h1>

        {/* Botón */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link
            href="/tienda"
            className="group inline-flex items-center gap-3 border-2 border-white text-white text-[11px] sm:text-[12px] tracking-[0.15em] uppercase font-bold px-8 py-3.5 sm:px-8 sm:py-3.5 hover:bg-white hover:text-[#1A1A1A] transition-all duration-300"
          >
            Comprar ahora
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
