const WHATSAPP_NUMBER = '541150588131';

export default function WhatsappContactButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="group fixed bottom-5 right-4 z-[65] inline-flex items-center justify-center rounded-full border border-white/95 bg-gradient-to-br from-[#D3A43A] via-[#C8972E] to-[#A87317] text-white shadow-[0_10px_24px_rgba(200,151,46,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(184,133,31,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8972E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF7] size-12 sm:bottom-6 sm:right-6 sm:size-[58px]"
    >
      {/* WhatsApp official icon — white phone on transparent, fits perfectly over gold button */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-6 sm:size-7 shrink-0"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.335-1.508A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.07 16.518c-.253.713-1.474 1.362-2.025 1.408-.55.046-1.07.247-3.607-.752-3.032-1.21-4.97-4.31-5.12-4.51-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37h.56c.18 0 .43-.07.67.51.24.58.82 2.01.89 2.16.07.15.12.32.02.51-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.44.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.14.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.12.07.71-.18 1.4z" />
      </svg>
    </a>
  );
}
