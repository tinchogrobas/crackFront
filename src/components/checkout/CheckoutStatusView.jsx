'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, Check, Clock3, CircleX } from 'lucide-react';

const VARIANTS = {
  success: {
    iconWrap: 'bg-[#C8972E]/10 border-[#C8972E]/30',
    iconColor: '#C8972E',
    codeWrap: 'border-[#C8972E]/40 bg-[#C8972E]/5',
    codeButton: 'border-[#C8972E]/40 text-[#C8972E] hover:bg-[#C8972E] hover:text-white hover:border-[#C8972E]',
  },
  pending: {
    iconWrap: 'bg-orange-50 border-orange-200',
    iconColor: '#EA580C',
    codeWrap: 'border-orange-200 bg-orange-50',
    codeButton: 'border-orange-300 text-orange-700 hover:bg-orange-500 hover:text-white hover:border-orange-500',
  },
  error: {
    iconWrap: 'bg-red-50 border-red-200',
    iconColor: '#EF4444',
    codeWrap: 'border-red-200 bg-red-50',
    codeButton: 'border-red-300 text-red-700 hover:bg-red-500 hover:text-white hover:border-red-500',
  },
};

function StatusIcon({ variant }) {
  const cfg = VARIANTS[variant] || VARIANTS.success;

  if (variant === 'pending') {
    return <Clock3 size={28} color={cfg.iconColor} />;
  }
  if (variant === 'error') {
    return <CircleX size={28} color={cfg.iconColor} />;
  }
  return <Check size={28} color={cfg.iconColor} />;
}

export default function CheckoutStatusView({
  variant = 'success',
  title,
  message,
  email,
  orderCode,
  statusLabel,
  actions = [],
  loadingText,
}) {
  const cfg = VARIANTS[variant] || VARIANTS.success;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!orderCode) return;
    navigator.clipboard.writeText(orderCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center text-center px-4">
      {loadingText && <p className="text-sm text-[#6B6560] mb-4">{loadingText}</p>}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className={`w-16 h-16 rounded-full border flex items-center justify-center mb-6 ${cfg.iconWrap}`}
      >
        <StatusIcon variant={variant} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black text-[#1A1A1A] mb-2 tracking-tight"
      >
        {title}
      </motion.h1>

      {statusLabel && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] tracking-[0.2em] uppercase text-[#6B6560] mb-4 font-semibold"
        >
          {statusLabel}
        </motion.p>
      )}

      {email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-[#6B6560] text-sm mb-6"
        >
          Te enviamos la confirmacion a <span className="text-[#1A1A1A] font-semibold">{email}</span>
        </motion.p>
      )}

      {orderCode && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-sm mb-8"
        >
          <p className="text-[10px] tracking-[0.2em] text-[#6B6560] uppercase mb-3 font-semibold">
            Codigo de pedido
          </p>
          <div className={`border rounded-xl p-5 ${cfg.codeWrap}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-3xl font-black text-[#1A1A1A] tracking-widest select-all">
                {orderCode}
              </span>
              <button
                onClick={handleCopy}
                title="Copiar codigo"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-200 ${cfg.codeButton}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-[11px] text-[#6B6560] mt-3 text-left leading-relaxed">
              Guarda este codigo para seguimiento o contacto con soporte.
            </p>
          </div>
        </motion.div>
      )}

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-[#6B6560] text-sm max-w-sm mb-8 leading-relaxed"
        >
          {message}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={action.primary
              ? 'bg-[#C8972E] text-white text-[11px] tracking-[0.15em] font-bold px-8 py-4 hover:bg-[#B8851F] transition-all duration-300'
              : 'border border-[#1A1A1A] text-[#1A1A1A] text-[11px] tracking-[0.15em] font-bold px-8 py-4 hover:bg-[#1A1A1A] hover:text-white transition-all duration-300'}
          >
            {action.label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
