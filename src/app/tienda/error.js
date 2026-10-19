'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Si el backend falla (429, caída, timeout) la tienda muestra esto en vez de
// "Application error". Reintentar vuelve a pedir los datos al servidor.
export default function TiendaError({ error, reset }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5 py-28">
      <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-3 font-medium">
        Tienda
      </p>
      <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-4">
        No pudimos cargar el catálogo<span className="text-[#C8972E]">.</span>
      </h1>
      <p className="text-[14px] text-[#6B6560] max-w-md mb-10">
        Hubo un problema momentáneo al traer los productos. Probá de nuevo en unos segundos.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={retry}
          disabled={isPending}
          className="inline-flex items-center justify-center bg-[#C8972E] text-white text-[12px] tracking-[0.05em] font-bold px-8 py-4 hover:bg-[#B8851F] transition-colors rounded-sm disabled:opacity-60"
        >
          {isPending ? 'Reintentando…' : 'Reintentar'}
        </button>
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
