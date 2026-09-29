'use client';
import { useEffect, useState } from 'react';
import { FaInstagram } from 'react-icons/fa';
import { X } from 'lucide-react';
import { WHATSAPP_URL, INSTAGRAM_URL } from '@/lib/social';

/**
 * Accesos flotantes a los canales de contacto, en todas las páginas:
 *   - WhatsApp: botón redondo abajo a la derecha.
 *   - Instagram: pestaña vertical pegada al borde izquierdo, que se puede cerrar.
 *
 * Van en z-30: por debajo del underlay del megamenú, de los drawers (carrito,
 * filtros, menú mobile) y del banner de cookies, así nunca tapan un modal.
 */

// Cerrar la pestaña es una preferencia del visitante; si el storage no está
// disponible (modo privado, bloqueado) simplemente vuelve a aparecer.
const IG_DISMISS_KEY = 'crack_ig_tab_dismissed';

// Logo oficial de WhatsApp (burbuja + teléfono), con el teléfono calado para
// que tome el verde del botón. El de react-icons queda chico y descentrado.
function WhatsAppGlyph({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.004 3C8.826 3 3 8.826 3 16.004c0 2.294.6 4.535 1.74 6.51L3 29l6.66-1.713a12.95 12.95 0 0 0 6.344 1.617h.005C23.18 28.904 29 23.078 29 15.9 29 8.724 23.18 3 16.004 3Zm0 23.7h-.004a10.76 10.76 0 0 1-5.483-1.5l-.393-.234-3.953 1.017 1.055-3.853-.256-.396a10.72 10.72 0 0 1-1.648-5.73c0-5.94 4.835-10.773 10.786-10.773 5.945 0 10.78 4.834 10.78 10.769 0 5.94-4.835 10.7-10.884 10.7Zm5.911-8.064c-.324-.162-1.917-.946-2.214-1.054-.297-.108-.513-.162-.729.162-.216.325-.837 1.054-1.026 1.27-.189.217-.378.244-.702.082-.324-.163-1.368-.505-2.606-1.61-.963-.86-1.614-1.92-1.803-2.245-.189-.324-.02-.5.142-.662.146-.145.324-.379.486-.568.162-.19.216-.325.324-.541.108-.217.054-.406-.027-.568-.081-.163-.729-1.759-.999-2.408-.263-.632-.53-.546-.729-.556l-.621-.011a1.19 1.19 0 0 0-.864.406c-.297.325-1.134 1.109-1.134 2.705 0 1.596 1.161 3.138 1.323 3.355.162.216 2.286 3.49 5.539 4.894.774.334 1.378.534 1.849.683.777.247 1.484.212 2.043.129.623-.093 1.917-.784 2.188-1.54.27-.758.27-1.407.189-1.542-.081-.135-.297-.216-.621-.379Z" />
    </svg>
  );
}

export default function FloatingContact() {
  const [igVisible, setIgVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(IG_DISMISS_KEY) === '1';
    } catch {}
    if (dismissed) return undefined;

    // Entra después de la primera pintura para no competir con el hero.
    const timer = setTimeout(() => setIgVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const dismissIg = () => {
    setIgVisible(false);
    try {
      localStorage.setItem(IG_DISMISS_KEY, '1');
    } catch {}
  };

  return (
    <>
      {/* Instagram — pestaña lateral */}
      <div
        className={`fixed left-0 top-1/2 z-30 -translate-y-1/2 transition-transform duration-500 ease-[cubic-bezier(0.215,0.61,0.355,1)] ${
          igVisible ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
        aria-hidden={!igVisible}
      >
        <div className="relative">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={igVisible ? 0 : -1}
            aria-label="Seguinos en Instagram"
            className="group flex flex-col items-center gap-2.5 rounded-r-md bg-gradient-to-b from-[#C8972E] to-[#B8851F] px-2 py-4 sm:px-2.5 sm:py-5 text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition-[padding,filter] duration-300 hover:pl-3.5 hover:brightness-105"
          >
            <FaInstagram className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" aria-hidden="true" />
            <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]">
              Seguinos en Instagram
            </span>
          </a>
          <button
            type="button"
            onClick={dismissIg}
            tabIndex={igVisible ? 0 : -1}
            aria-label="Cerrar"
            className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-[#1A1A1A] text-white shadow-md transition-colors hover:bg-black"
          >
            <X size={11} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* WhatsApp — botón flotante */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex items-center"
      >
        <span className="pointer-events-none mr-3 hidden translate-x-2 whitespace-nowrap rounded-md bg-white px-3 py-2 text-[12px] font-semibold text-[#1A1A1A] opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
          ¿Consultas? Escribinos
        </span>
        <span className="relative flex h-[52px] w-[52px] sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_18px_-4px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
          {/* El pulso sólo en desktop: en mobile, sobre el contenido, ensucia. */}
          <span className="absolute inset-0 hidden rounded-full bg-[#25D366] opacity-40 animate-ping [animation-duration:2.4s] [animation-iteration-count:3] motion-reduce:hidden sm:block" aria-hidden="true" />
          <WhatsAppGlyph className="relative h-[28px] w-[28px] sm:h-[30px] sm:w-[30px]" />
        </span>
      </a>
    </>
  );
}
