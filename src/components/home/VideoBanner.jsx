'use client';
import { motion } from 'framer-motion';

const stats = [
  { value: '500+', label: 'Productos' },
  { value: '1.2K', label: 'Clientes' },
  { value: '100%', label: 'Originales' },
  { value: '24hs', label: 'Despacho' },
];

export default function VideoBanner() {
  return (
    <section className="py-20 sm:py-28 border-t border-[#E8E4DD]">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group">
              <p className="font-display text-4xl sm:text-5xl font-bold gradient-text tracking-tight">{stat.value}</p>
              <p className="text-[11px] tracking-[0.2em] text-[#6B6560] uppercase mt-2 group-hover:text-[#1A1A1A] transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
