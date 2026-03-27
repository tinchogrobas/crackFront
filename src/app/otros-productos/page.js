'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OtrosProductosPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen flex flex-col items-center justify-center text-center px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] tracking-[0.3em] text-[#ff3333] uppercase mb-3 font-medium">Próximamente</p>
        <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-4">
          Otros productos<span className="text-[#ff3333]">.</span>
        </h1>
        <p className="text-[14px] text-[#6B6560] max-w-md mx-auto mb-10">
          Estamos preparando nuevas categorías. Seguinos en redes para enterarte de los drops.
        </p>
        <Link
          href="/tienda"
          className="inline-flex bg-[#ff3333] text-white text-[12px] tracking-[0.05em] font-bold px-8 py-4 hover:bg-[#e62e2e] transition-colors"
        >
          Ver tienda →
        </Link>
      </motion.div>
    </div>
  );
}
