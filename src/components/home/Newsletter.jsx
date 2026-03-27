'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { subscribe } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await subscribe(email.trim());
      toast.success(res.message || '¡Te suscribiste correctamente!');
      setEmail('');
    } catch {
      toast.error('Error al suscribirte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 sm:py-32 border-t border-[#E8E4DD] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(200,151,46,0.06)_0%,_transparent_60%)]" />
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-5 sm:px-8 text-center relative">
        <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-3 font-medium">Newsletter</p>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#1A1A1A] mb-4">
          Enterate <span className="gradient-text">primero.</span>
        </h2>
        <p className="text-sm text-[#6B6560] mb-10 max-w-sm mx-auto">
          Nuevos ingresos, drops exclusivos y descuentos antes que nadie.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white border border-[#E8E4DD] px-5 py-3.5 text-[13px] text-[#1A1A1A] outline-none focus:border-[#C8972E]/50 placeholder:text-[#6B6560]/40 transition-all"
          />
          <button type="submit" disabled={loading} className="group inline-flex items-center justify-center gap-2 bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold px-7 py-3.5 hover:bg-[#B8851F] transition-all disabled:opacity-50 min-w-[150px]">
            {loading ? '...' : 'Suscribirse'}
            <Send size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      </motion.div>
    </section>
  );
}
