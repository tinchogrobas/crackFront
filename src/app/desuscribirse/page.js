'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { unsubscribeNewsletter } from '@/lib/api';
import { ArrowRight, Check, RefreshCcw, TriangleAlert } from 'lucide-react';

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<UnsubscribeFallback />}>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeFallback() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#FAFAF7] px-5 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[14%] h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,151,46,0.14),rgba(200,151,46,0.02)_45%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="rounded-[26px] border border-[#E8E4DD] bg-white p-8 text-center shadow-[0_20px_54px_rgba(26,26,26,0.08)] sm:p-12">


          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EAD8AF] bg-[#FFF7E4] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A6771B]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8972E]" />
            Gestion de newsletter
          </div>

          <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
          <h1 className="font-display text-3xl text-[#1A1A1A] sm:text-4xl">Procesando solicitud</h1>
          <p className="mt-4 text-[15px] text-[#6B6560]">Procesando desuscripcion...</p>
        </div>
      </div>
    </section>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('Procesando tu solicitud...');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!token) {
        if (!mounted) return;
        setLoading(false);
        setError('Este enlace no es valido o esta incompleto. Usa el ultimo email que recibiste para intentarlo de nuevo.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await unsubscribeNewsletter(token);
        if (!mounted) return;
        setDone(true);
        setMessage(response?.message || 'Listo. Ya no vas a recibir novedades comerciales por email.');
      } catch (err) {
        if (!mounted) return;
        const detail = err?.data?.detail || err?.message || 'No pudimos validar este enlace de desuscripcion.';
        setError(detail);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleRetry = async () => {
    if (!token || loading) return;
    setLoading(true);
    setError('');

    try {
      const response = await unsubscribeNewsletter(token);
      setDone(true);
      setMessage(response?.message || 'Listo. Tu preferencia quedo actualizada correctamente.');
    } catch (err) {
      const detail = err?.data?.detail || err?.message || 'No pudimos validar este enlace de desuscripcion.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#FAFAF7] px-5 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[14%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,151,46,0.16),rgba(200,151,46,0.02)_46%,transparent_72%)]" />
        <div className="absolute bottom-[-120px] right-[-130px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(26,26,26,0.08),transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="rounded-[26px] border border-[#E8E4DD] bg-white p-8 shadow-[0_20px_54px_rgba(26,26,26,0.08)] sm:p-12">
          <div className="text-center">

            {loading ? (
              <>
                <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
                <h1 className="font-display text-3xl tracking-[-0.03em] text-[#1A1A1A] sm:text-4xl">Procesando solicitud</h1>
                <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#6B6560]">{message}</p>
              </>
            ) : done ? (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1A1A] text-[#C8972E]">
                  <Check size={30} strokeWidth={3} />
                </div>
                <h1 className="font-display text-[clamp(2rem,4.8vw,3.25rem)] leading-[0.96] tracking-[-0.04em] text-[#1A1A1A]">
                  Preferencias actualizadas
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-[#6B6560]">
                  {message}
                </p>

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#C8972E] px-7 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#B8851F]"
                  >
                    Volver a la tienda
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                  <TriangleAlert size={28} strokeWidth={2.4} />
                </div>
                <h1 className="font-display text-[clamp(1.9rem,4.3vw,2.8rem)] leading-[0.98] tracking-[-0.035em] text-[#1A1A1A]">
                  No pudimos validar tu enlace
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#B91C1C]">{error}</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {token ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1A1A1A] px-7 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black"
                    >
                      <RefreshCcw size={14} />
                      Reintentar
                    </button>
                  ) : null}

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-[#D4CFC6] bg-white px-7 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#1A1A1A] transition-colors hover:border-[#C8972E] hover:text-[#A6771B]"
                  >
                    Volver a inicio
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="mx-auto mt-10 max-w-xl border-t border-dashed border-[#E8E4DD] pt-6 text-center text-[13px] leading-relaxed text-[#8B847E]">
            Si este cambio fue un error, podes suscribirte nuevamente desde cualquier formulario de newsletter de la tienda.
          </div>
        </div>
      </div>
    </section>
  );
}
