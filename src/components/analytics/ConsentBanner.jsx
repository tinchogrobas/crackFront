'use client';
/**
 * Banner de consentimiento de cookies.
 *
 * Consent Mode v2 ya arranca con defaults por región (ver `analytics.config`):
 * `denied` en el EEE/UK, `granted` en el resto. Este banner es la interfaz para
 * cambiar esa decisión y dejarla guardada; no es lo que habilita la medición.
 *
 * Se monta después del primer paint y solo si no hay decisión previa, para no
 * empujar layout ni entrar en el LCP.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CONSENT_BANNER_ENABLED, ANALYTICS_ENABLED } from '@/lib/analytics.config';
import { readConsent, setConsent } from '@/lib/analytics';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!CONSENT_BANNER_ENABLED || !ANALYTICS_ENABLED) return;
    if (readConsent()) return;
    // Un frame de gracia: el banner nunca compite con el LCP de la home.
    const timer = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const decide = (accepted) => {
    setConsent(accepted);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferencias de cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 animate-[fadeIn_.3s_ease-out]"
    >
      <div className="max-w-[1100px] mx-auto bg-white border border-[#E8E4DD] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-[12px] leading-relaxed text-[#6B6560] flex-1">
          Usamos cookies propias y de terceros para medir el uso del sitio y mostrarte
          publicidad relevante. Podés rechazarlas y seguir navegando con normalidad.{' '}
          <Link href="/privacidad" className="text-[#C8972E] underline underline-offset-2 hover:text-[#B8851F]">
            Política de privacidad
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide(false)}
            className="px-4 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase border border-[#E8E4DD] text-[#6B6560] hover:border-[#D4CFC6] hover:text-[#1A1A1A] transition-colors rounded-md"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => decide(true)}
            className="px-5 py-2.5 text-[11px] font-bold tracking-[0.08em] uppercase bg-[#C8972E] text-white hover:bg-[#B8851F] transition-colors rounded-md"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
