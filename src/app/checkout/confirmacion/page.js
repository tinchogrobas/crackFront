'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ConfirmacionPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6"
      >
        <motion.svg
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            points="20 6 9 17 4 12"
          />
        </motion.svg>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black text-[#1A1A1A] mb-4"
      >
        ¡PEDIDO CONFIRMADO!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-[#6B6560] text-sm max-w-md mb-8"
      >
        Tu pedido fue recibido correctamente. Te enviaremos un email con los detalles y el seguimiento.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          href="/tienda"
          className="border border-[#1A1A1A] text-[#1A1A1A] text-[11px] tracking-[0.15em] font-bold px-8 py-4 hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
        >
          VOLVER A LA TIENDA
        </Link>
      </motion.div>
    </div>
  );
}
