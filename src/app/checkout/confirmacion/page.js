'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Copy, Check } from 'lucide-react';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('code');
  const orderId = searchParams.get('order');
  const email = searchParams.get('email');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!orderCode) return;
    navigator.clipboard.writeText(orderCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center text-center px-4">
      {/* Check animado */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-[#C8972E]/10 border border-[#C8972E]/30 flex items-center justify-center mb-6"
      >
        <motion.svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#C8972E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            points="20 6 9 17 4 12"
          />
        </motion.svg>
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black text-[#1A1A1A] mb-2 tracking-tight"
      >
        ¡PEDIDO CONFIRMADO!
      </motion.h1>

      {email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#6B6560] text-sm mb-6"
        >
          Te enviamos la confirmación a <span className="text-[#1A1A1A] font-semibold">{email}</span>
        </motion.p>
      )}

      {/* Card del código de orden */}
      {orderCode && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm mb-8"
        >
          <p className="text-[10px] tracking-[0.2em] text-[#6B6560] uppercase mb-3 font-semibold">
            Código de pedido
          </p>
          <div className="border border-[#C8972E]/40 rounded-xl bg-[#C8972E]/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-3xl font-black text-[#1A1A1A] tracking-widest select-all">
                {orderCode}
              </span>
              <button
                onClick={handleCopy}
                title="Copiar código"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-200
                  border-[#C8972E]/40 text-[#C8972E] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6560] mt-3 text-left leading-relaxed">
              Guardá este código. Lo necesitarás para consultar el estado de tu pedido o contactar soporte.
            </p>
          </div>
        </motion.div>
      )}

      {/* Mensaje */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-[#6B6560] text-sm max-w-sm mb-8 leading-relaxed"
      >
        Estamos revisando tu pedido y te contactaremos a la brevedad para coordinar el pago y el envío.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-20 min-h-screen flex items-center justify-center text-[#6B6560] text-sm">Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
