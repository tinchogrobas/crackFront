'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const BYPASS_COOKIE_MAX_AGE = 60 * 60 * 8;

/** Maintenance / Suspended page — matches CRACK brand design system. */
export default function MaintenancePage({ message }) {
  const displayMessage =
    message && message.trim()
      ? message
      : 'Estamos realizando mejoras en el sitio. Volvemos a la brevedad.';

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const loginRes = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!loginRes.ok) {
        setError('Credenciales inválidas.');
        setSubmitting(false);
        return;
      }

      const { access } = await loginRes.json();
      if (!access) {
        setError('Respuesta inválida del servidor.');
        setSubmitting(false);
        return;
      }

      const meRes = await fetch(`${API_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (!meRes.ok) {
        setError('No se pudo verificar la cuenta.');
        setSubmitting(false);
        return;
      }
      const me = await meRes.json();
      if (!me.is_staff) {
        setError('Tu cuenta no tiene permisos de administrador.');
        setSubmitting(false);
        return;
      }

      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `admin_bypass=${access}; Path=/; Max-Age=${BYPASS_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
      window.location.reload();
    } catch {
      setError('Error de red. Probá de nuevo.');
      setSubmitting(false);
    }
  };

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
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center w-full"
        >
          <img
            src="/brand/whiteBgColor.png"
            alt="CRACK"
            className="w-auto max-w-full"
            style={{ height: 'clamp(96px, 22vw, 180px)' }}
          />
        </motion.div>

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

        {/* Admin bypass entry */}
        <motion.button
          type="button"
          onClick={() => setModalOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-10 text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-white/30 hover:text-[#C8972E] transition-colors duration-300"
        >
          ¿Sos administrador? Ingresá aquí
        </motion.button>

        {/* Animated status row */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
          className="flex items-center justify-center gap-2.5 mt-10"
        >
          <span className="w-[7px] h-[7px] rounded-full bg-[#C8972E] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] tracking-[0.25em] text-white/25 uppercase font-medium">
            Volvemos a la brevedad
          </span>
        </motion.div> */}

        {/* Social links
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
        </motion.div> */}
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

      {/* ── Admin login modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-[#1A1A1A] border border-[#C8972E]/30 px-7 py-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gold line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8972E]/60 to-transparent" />

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Cerrar"
                className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors text-lg leading-none disabled:opacity-30"
              >
                ×
              </button>

              <p className="text-[10px] tracking-[0.35em] text-[#C8972E] uppercase font-semibold text-center mb-2">
                Acceso administrador
              </p>
              <p className="text-white/50 text-[13px] text-center mb-6">
                Ingresá con tus credenciales del panel.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-transparent border border-white/15 focus:border-[#C8972E]/70 outline-none px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 transition-colors"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-transparent border border-white/15 focus:border-[#C8972E]/70 outline-none px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 transition-colors"
                />

                {error && (
                  <p className="text-[12px] text-red-400/90 text-center -mb-1">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full bg-[#C8972E] hover:bg-[#d4a23a] disabled:bg-[#C8972E]/50 disabled:cursor-not-allowed text-[#1A1A1A] font-semibold tracking-[0.18em] uppercase text-[12px] py-3 transition-colors"
                >
                  {submitting ? 'Ingresando…' : 'Ingresar'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
