'use client';

import { motion } from 'framer-motion';

/** Maintenance / Suspended page — matches CRACK brand design system. */
export default function MaintenancePage({ message }) {
  const displayMessage =
    message && message.trim()
      ? message
      : 'Estamos realizando mejoras en el sitio. Volvemos a la brevedad.';

  return (
    <div className="relative min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center overflow-hidden select-none px-6">

      {/* ── Background atmosphere ─────────────────────────────────────── */}
      {/* Central warm glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Radial golden aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(200,151,46,0.09) 0%, rgba(200,151,46,0.03) 50%, transparent 75%)',
          }}
        />

        {/* Top edge gold line — same as hero navbar glow */}
        <div className="absolute top-0 left-0 right-0">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C8972E]/50 to-transparent" />
          <div className="h-[6px] bg-gradient-to-r from-transparent via-[#C8972E]/20 to-transparent blur-sm" />
        </div>

        {/* Bottom edge subtle line */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C8972E]/20 to-transparent" />
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">

        {/* Logo */}
        <motion.h1
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-bebas)] leading-none font-bold tracking-[0.25em]"
          style={{
            fontSize: 'clamp(96px, 22vw, 180px)',
            background: 'linear-gradient(170deg, #FFFFFF 30%, #C8972E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CRACK
        </motion.h1>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
          className="flex items-center justify-center gap-3 mt-2 mb-6 w-full origin-center"
        >
          <div className="flex-1 max-w-[88px] h-px bg-gradient-to-r from-transparent to-[#C8972E]/60" />
          {/* Diamond ornament */}
          <svg
            aria-hidden="true"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="5"
              y="0.5"
              width="6.36"
              height="6.36"
              rx="0.5"
              transform="rotate(45 5 0.5)"
              fill="#C8972E"
            />
          </svg>
          <div className="flex-1 max-w-[88px] h-px bg-gradient-to-l from-transparent to-[#C8972E]/60" />
        </motion.div>

        {/* Status label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="text-[10px] sm:text-[11px] tracking-[0.35em] text-[#C8972E] uppercase font-semibold mb-6"
        >
          Sitio en mantenimiento
        </motion.p>

        {/* Dynamic message from backend */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.75, ease: 'easeOut' }}
          className="text-white/50 text-[14px] sm:text-[16px] leading-[1.75] font-light max-w-sm mx-auto"
        >
          {displayMessage}
        </motion.p>

        {/* Animated status row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
          className="flex items-center justify-center gap-2.5 mt-10"
        >
          <span className="w-[7px] h-[7px] rounded-full bg-[#C8972E] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] tracking-[0.25em] text-white/25 uppercase font-medium">
            Volvemos a la brevedad
          </span>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.25 }}
          className="flex items-center gap-8 mt-12"
        >
          {[
            { label: 'Instagram', href: 'https://instagram.com/' },
            { label: 'WhatsApp', href: 'https://wa.me/' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative text-[11px] tracking-[0.18em] uppercase text-white/25 hover:text-[#C8972E] transition-colors duration-300 group"
            >
              {label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#C8972E] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </motion.div>
      </div>

      {/* ── Footer copyright ──────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-7 text-[10px] tracking-[0.12em] text-white/15 uppercase"
      >
        &copy; {new Date().getFullYear()} CRACK&reg; — Buenos Aires, Argentina
      </motion.p>
    </div>
  );
}
