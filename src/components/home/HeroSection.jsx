'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import HeroSky from './HeroSky';

export default function HeroSection() {
  return (
    <section className="relative min-h-[65svh] sm:min-h-[min(460px,88svh)] sm:max-h-[min(720px,86svh)] sm:aspect-[16/6] flex items-center sm:items-end overflow-hidden">
      <HeroSky />

      <div className="relative z-10 w-full px-5 sm:px-10 lg:px-16 pb-8 sm:pb-10 pt-0 sm:pt-0 translate-y-14 sm:translate-y-0 flex flex-col items-center sm:items-start text-center sm:text-left">

        {/* Título visual */}
        <div className="mb-7 sm:-mb-2 w-full flex justify-center sm:justify-start">
          {/* Mobile: logo dorado "crack" (home-mobile.png) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden inline-block"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(11,58,68,0.22))',
            }}
          >
            <Image
              src="/brand/home-mobile.png"
              alt="Crack Store Online"
              width={800}
              height={280}
              priority
              fetchPriority="high"
              sizes="80vw"
              className="w-auto mx-auto"
              style={{ height: 'clamp(90px, 24vw, 145px)' }}
            />
          </motion.div>

          {/* Desktop: landing logo original */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="hidden sm:inline-block relative"
          >
            <Image
              src="/brand/landing-logo-ink.png"
              alt="Crack Store Online"
              width={980}
              height={220}
              priority
              fetchPriority="high"
              sizes="980px"
              className="h-[clamp(62px,7.4vw,118px)] w-auto"
              style={{
                filter: 'drop-shadow(0 6px 16px rgba(11,58,68,0.18))',
              }}
            />
          </motion.div>
        </div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.62 }}
          className="mb-12 sm:mb-9 uppercase tracking-[0.2em]"
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 700,
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          <span
            className="hidden sm:inline gradient-text-shimmer drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            style={{ fontSize: '15px', lineHeight: '20px' }}
          >
            Tu tienda favorita de Pokémon TCG en Argentina
          </span>
          <span className="sm:hidden text-[#1A1A1A]/70">
            Tu tienda favorita de Pokémon TCG en Argentina
          </span>
        </motion.p>

        {/* Botón */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link
            href="/tienda"
            className="group inline-flex items-center gap-3 bg-[#1A1A1A] text-white text-[11px] sm:text-[12px] tracking-[0.18em] uppercase font-bold px-9 py-4 shadow-[0_12px_30px_rgba(11,58,68,0.28)] hover:bg-[#C8972E] hover:shadow-[0_14px_34px_rgba(200,151,46,0.45)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Comprar ahora
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
