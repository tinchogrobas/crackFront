import Link from 'next/link';
import { SITE_URL } from '@/lib/seo';

export const metadata = {
  title: 'Página no encontrada',
  description:
    'La página que buscás no existe o el producto ya no está disponible. Volvé a la tienda para explorar el catálogo completo.',
  alternates: { canonical: `${SITE_URL}/404` },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5 py-28">
      <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-3 font-medium">
        Error 404
      </p>
      <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-4">
        Página no encontrada<span className="text-[#C8972E]">.</span>
      </h1>
      <p className="text-[14px] text-[#6B6560] max-w-md mb-10">
        La página que buscás no existe o el producto ya no está disponible. Explorá la tienda para encontrar más cartas Pokémon, slabs y sellados.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/tienda"
          className="inline-flex items-center justify-center bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold px-8 py-4 hover:bg-[#B8851F] transition-colors rounded-sm"
        >
          Ver tienda
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-[#E8E4DD] text-[#3A3530] text-[12px] tracking-[0.05em] font-bold px-8 py-4 hover:border-[#C8972E] hover:text-[#C8972E] transition-colors rounded-sm"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
