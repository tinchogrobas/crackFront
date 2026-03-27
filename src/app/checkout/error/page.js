'use client';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ErrorContent() {
  const searchParams = useSearchParams();
  let messages = [];
  try {
    const raw = searchParams.get('msgs');
    if (raw) messages = JSON.parse(decodeURIComponent(raw));
  } catch {}

  return (
    <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center text-center px-4">
      {/* X animada — mismo tamaño y estilo que el check de confirmación */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.line
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            x1="18" y1="6" x2="6" y2="18"
          />
          <motion.line
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            x1="6" y1="6" x2="18" y2="18"
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black text-[#1A1A1A] mb-4"
      >
        NO PUDIMOS PROCESAR TU PEDIDO
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-[#6B6560] text-sm max-w-md mb-8 space-y-1"
      >
        {messages.length > 0 ? (
          messages.map((msg, i) => <p key={i}>{msg}</p>)
        ) : (
          <p>Hubo un problema al procesar tu pedido. Por favor intentá de nuevo.</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          href="/checkout"
          className="bg-[#C8972E] text-white text-[11px] tracking-[0.15em] font-bold px-8 py-4 hover:bg-[#B8851F] transition-all duration-300"
        >
          VOLVER AL CHECKOUT
        </Link>
        <Link
          href="/tienda"
          className="border border-[#1A1A1A] text-[#1A1A1A] text-[11px] tracking-[0.15em] font-bold px-8 py-4 hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
        >
          IR A LA TIENDA
        </Link>
      </motion.div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
