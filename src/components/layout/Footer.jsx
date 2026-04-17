'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#E8E4DD] bg-[#F5F1EA]">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16"
        >
          <div className="lg:col-span-1">
            <Link href="/" aria-label="Crack" className="inline-flex items-center transition-opacity hover:opacity-80">
              <Image
                src="/brand/whiteBgColor.png"
                alt="Crack"
                width={600}
                height={120}
                className="h-[36px] sm:h-[80px] w-auto"
              />
            </Link>
            <p className="text-[13px] text-[#6B6560]/70 mt-4 leading-relaxed">
              Tu tienda de cartas Pokémon TCG en Argentina. Singles, Slabs, Sellados y más.
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#C8972E]/60 uppercase font-medium mb-5">Tienda</p>
            <div className="flex flex-col gap-3">
              {['Singles', 'Slabs', 'Sellados', 'Accesorios', 'Mystery Packs'].map((item) => (
                <Link key={item} href="/tienda" className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">{item}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#C8972E]/60 uppercase font-medium mb-5">Info</p>
            <div className="flex flex-col gap-3">
              <Link href="/contacto" className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">Contacto</Link>
              <Link href="/otros-productos" className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">Otros Productos</Link>
              <a href="#" className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">Términos</a>
              <a href="#" className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">Privacidad</a>
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#C8972E]/60 uppercase font-medium mb-5">Seguinos</p>
            <div className="flex flex-col gap-3">
              {[{ label: 'Instagram', href: '#' }, { label: 'WhatsApp', href: '#' }].map((social) => (
                <a key={social.label} href={social.href} className="group inline-flex items-center gap-1 text-[13px] text-[#6B6560] hover:text-[#C8972E] transition-colors">
                  {social.label}
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
        <div className="border-t border-[#E8E4DD] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#6B6560]/50">&copy; {new Date().getFullYear()} CRACK&reg;. Todos los derechos reservados.</p>
          <p className="text-[11px] text-[#6B6560]/50">Deheza 2921, PB, Saavedra, Buenos Aires, Argentina</p>
        </div>
      </div>
    </footer>
  );
}
