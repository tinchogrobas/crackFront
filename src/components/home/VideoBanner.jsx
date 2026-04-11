'use client';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Fecha de referencia: 11 de abril 2026, base 1200 clientes, +5 por día
const BASE_DATE = new Date('2026-04-11');
const BASE_CLIENTS = 1200;
const DAILY_INCREMENT = 5;

function getClientCount() {
  const today = new Date();
  const diffDays = Math.floor((today - BASE_DATE) / (1000 * 60 * 60 * 24));
  return BASE_CLIENTS + Math.max(0, diffDays) * DAILY_INCREMENT;
}

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return { count, ref };
}

const stats = [
  { key: 'clientes', label: 'Clientes' },
  { key: 'productos', value: '500+', label: 'Productos' },
  { key: 'originales', value: '100%', label: 'Originales' },
  { key: 'despacho', value: '24hs', label: 'Despacho' },
];

export default function VideoBanner() {
  const clientTarget = getClientCount();
  const { count, ref: counterRef } = useCountUp(clientTarget);

  return (
    <section className="py-20 sm:py-28 border-t border-[#E8E4DD]">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group" ref={stat.key === 'clientes' ? counterRef : undefined}>
              <p className="font-display text-4xl sm:text-5xl font-bold gradient-text tracking-tight">
                {stat.key === 'clientes' ? `${count.toLocaleString('es-AR')}+` : stat.value}
              </p>
              <p className="text-[11px] tracking-[0.2em] text-[#6B6560] uppercase mt-2 group-hover:text-[#1A1A1A] transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
