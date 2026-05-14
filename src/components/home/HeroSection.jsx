'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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

        {/* Título visual */}
        <div className="-mb-1 sm:-mb-2 w-full">
          {/* Mobile: logo dorado "crack" con efecto de aparición */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, filter: 'blur(12px)' }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: 'blur(0px)',
            }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden inline-block"
          >
            <motion.div
              initial={{ filter: 'drop-shadow(0 0 0px rgba(200,151,46,0))' }}
              animate={{
                filter: [
                  'drop-shadow(0 0 0px rgba(200,151,46,0))',
                  'drop-shadow(0 0 36px rgba(200,151,46,0.85)) drop-shadow(0 0 70px rgba(200,151,46,0.4))',
                  'drop-shadow(0 0 22px rgba(200,151,46,0.55)) drop-shadow(0 0 50px rgba(200,151,46,0.25)) drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
                ],
              }}
              transition={{ duration: 1.6, delay: 0.6, times: [0, 0.55, 1], ease: 'easeOut' }}
            >
              <Image
                src="/brand/logo2.png"
                alt="Crack Store Online"
                width={800}
                height={280}
                priority
                fetchPriority="high"
                sizes="90vw"
                className="h-[120px] w-auto"
              />
            </motion.div>
          </motion.div>

          {/* Desktop: landing logo original */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="hidden sm:inline-block relative"
          >
            <Image
              src="/brand/landing%20logo.png"
              alt="Crack Store Online"
              width={980}
              height={220}
              priority
              fetchPriority="high"
              sizes="980px"
              className="h-[105px] w-auto"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(200,151,46,0.4)) drop-shadow(0 0 40px rgba(200,151,46,0.2)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
              }}
            />
          </motion.div>
        </div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.62 }}
          className="mb-8 sm:mb-9 gradient-text-shimmer uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          style={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 700,
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
