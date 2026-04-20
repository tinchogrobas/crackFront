'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { unsubscribeNewsletter } from '@/lib/api';
import { Check } from 'lucide-react';

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<UnsubscribeFallback />}>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeFallback() {
  return (
    <section className="min-h-[72vh] flex items-center justify-center px-5 py-16 bg-[#FAFAF7]">
      <div className="w-full max-w-2xl border border-[#E8E4DD] bg-white p-8 sm:p-12 text-center shadow-[0_12px_34px_rgba(0,0,0,0.06)]">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#C8972E] font-semibold mb-5">CRACK TCG</p>
        <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
        <h1 className="font-display text-3xl sm:text-4xl text-[#1A1A1A] mb-4 tracking-[-0.02em]">
          Procesando solicitud
        </h1>
        <p className="text-[15px] text-[#6B6560]">Procesando desuscripción...</p>
      </div>
    </section>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('Procesando desuscripción...');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!token) {
        if (!mounted) return;
        setLoading(false);
        setError('El enlace de desuscripción es inválido o está incompleto.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await unsubscribeNewsletter(token);
        if (!mounted) return;
        setDone(true);
        setMessage(response?.message || 'Te desuscribiste correctamente de nuestras novedades.');
      } catch (err) {
        if (!mounted) return;
        const detail = err?.data?.detail || err?.message || 'No pudimos procesar la desuscripción.';
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
      setMessage(response?.message || 'Tu desuscripción fue procesada correctamente.');
    } catch (err) {
      const detail = err?.data?.detail || err?.message || 'No pudimos procesar la desuscripción.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[72vh] flex items-center justify-center px-5 py-16 bg-[#FAFAF7]">
      <div className="w-full max-w-2xl border border-[#E8E4DD] bg-white p-8 sm:p-12 text-center shadow-[0_12px_34px_rgba(0,0,0,0.06)]">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[#C8972E] font-semibold mb-5">CRACK TCG</p>

        {loading ? (
          <>
            <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
            <h1 className="font-display text-3xl sm:text-4xl text-[#1A1A1A] mb-4 tracking-[-0.02em]">
              Procesando solicitud
            </h1>
            <p className="text-[15px] text-[#6B6560]">{message}</p>
          </>
        ) : done ? (
          <>
            <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-[#1A1A1A] text-[#C8972E] flex items-center justify-center">
              <Check size={30} strokeWidth={3} />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-[#1A1A1A] mb-4 tracking-[-0.02em]">
              Desuscripción completada
            </h1>
            <p className="text-[16px] text-[#6B6560] leading-relaxed max-w-lg mx-auto">
              {message}
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center mt-8 bg-[#C8972E] text-white text-[12px] tracking-[0.06em] font-bold px-7 py-3 hover:bg-[#B8851F] transition-colors"
            >
              Volver a la tienda
            </a>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl sm:text-4xl text-[#1A1A1A] mb-4 tracking-[-0.02em]">
              No pudimos desuscribirte
            </h1>
            <p className="text-[15px] text-[#B91C1C] leading-relaxed max-w-lg mx-auto">{error}</p>
            {token ? (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center mt-8 bg-[#1A1A1A] text-white text-[12px] tracking-[0.06em] font-bold px-7 py-3 hover:bg-black transition-colors"
              >
                Reintentar
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
