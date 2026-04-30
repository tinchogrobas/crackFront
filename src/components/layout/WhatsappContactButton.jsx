const WHATSAPP_NUMBER = '541150588131';

export default function WhatsappContactButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="group fixed bottom-5 right-4 z-[65] flex h-12 w-12 items-center justify-center rounded-full border border-white/95 bg-gradient-to-br from-[#D3A43A] via-[#C8972E] to-[#A87317] text-white shadow-[0_10px_24px_rgba(200,151,46,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(184,133,31,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8972E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF7] sm:bottom-6 sm:right-6 sm:h-[58px] sm:w-[58px]"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-6 w-6 sm:h-7 sm:w-7"
        fill="currentColor"
      >
        <path d="M19.12 17.72c-.29-.14-1.72-.85-1.99-.95-.27-.1-.46-.14-.66.14-.2.29-.76.95-.93 1.15-.17.2-.34.22-.63.07-.29-.14-1.23-.45-2.35-1.44-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.37-.02-.51-.07-.14-.66-1.59-.9-2.17-.24-.57-.49-.49-.66-.5h-.57c-.2 0-.51.07-.78.37-.27.29-1.02.99-1.02 2.42 0 1.42 1.05 2.8 1.19 2.99.15.2 2.03 3.1 4.93 4.35.69.3 1.23.48 1.65.62.69.22 1.31.19 1.8.12.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.27.17-1.38-.07-.12-.27-.19-.56-.34z" />
        <path d="M16.02 3.2c-7.05 0-12.77 5.72-12.77 12.76 0 2.24.59 4.43 1.7 6.35L3 29l6.87-1.8a12.75 12.75 0 0 0 6.15 1.57h.01c7.04 0 12.77-5.73 12.77-12.77 0-3.41-1.33-6.62-3.74-9.02a12.66 12.66 0 0 0-9.04-3.78zm0 23.39h-.01a10.6 10.6 0 0 1-5.39-1.47l-.39-.23-4.08 1.07 1.09-3.98-.25-.41a10.58 10.58 0 0 1 1.63-13.08 10.58 10.58 0 0 1 7.42-3.08c2.81 0 5.45 1.1 7.44 3.09 1.99 1.99 3.08 4.63 3.08 7.44 0 5.8-4.72 10.52-10.54 10.52z" />
      </svg>
    </a>
  );
}