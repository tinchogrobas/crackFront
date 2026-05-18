'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { confirmContactMarkRead } from '@/lib/api';
import { ArrowRight, Check, Mail, MessageSquareText, RefreshCcw, ShieldAlert, UserRound } from 'lucide-react';

export default function ContactMarkReadPage() {
  return (
    <Suspense fallback={<MarkReadFallback />}>
      <MarkReadContent />
    </Suspense>
  );
}

function MarkReadFallback() {
  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF7] px-5 py-16 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,151,46,0.14),rgba(200,151,46,0.02)_45%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="rounded-[26px] border border-[#E8E4DD] bg-white p-8 text-center shadow-[0_20px_54px_rgba(26,26,26,0.08)] sm:p-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EAD8AF] bg-[#FFF7E4] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A6771B]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8972E]" />
            Gestion de contacto
          </div>

          <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
          <h1 className="font-display text-3xl text-[#1A1A1A] sm:text-4xl">Verificando enlace</h1>
          <p className="mt-4 text-[15px] text-[#6B6560]">Procesando accion segura...</p>
        </div>
      </div>
    </section>
  );
}

function MarkReadContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('Validando token y procesando el mensaje...');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!token) {
        if (!mounted) return;
        setLoading(false);
        setError('El enlace no es valido o esta incompleto. Usa el ultimo email de notificacion para continuar.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await confirmContactMarkRead(token);
        if (!mounted) return;
        setDone(true);
        setResult(response || null);
        setMessage(response?.message || 'El mensaje fue procesado correctamente.');
      } catch (err) {
        if (!mounted) return;
        const detail = err?.data?.detail || err?.message || 'No pudimos validar este enlace seguro.';
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
      const response = await confirmContactMarkRead(token);
      setDone(true);
      setResult(response || null);
      setMessage(response?.message || 'La accion se completo correctamente.');
    } catch (err) {
      const detail = err?.data?.detail || err?.message || 'No pudimos validar este enlace seguro.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const contact = result?.contact;

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF7] px-5 py-16 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,151,46,0.16),rgba(200,151,46,0.02)_46%,transparent_72%)]" />
        <div className="absolute bottom-[-120px] right-[-130px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(26,26,26,0.08),transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="rounded-[26px] border border-[#E8E4DD] bg-white p-8 shadow-[0_20px_54px_rgba(26,26,26,0.08)] sm:p-12">
          <div className="text-center">
            {loading ? (
              <>
                <div className="mx-auto mb-6 h-14 w-14 rounded-full border-4 border-[#F2E8CE] border-t-[#C8972E] animate-spin" />
                <h1 className="font-display text-3xl tracking-[-0.03em] text-[#1A1A1A] sm:text-4xl">Procesando accion</h1>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#6B6560]">{message}</p>
              </>
            ) : done ? (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1A1A] text-[#C8972E]">
                  <Check size={30} strokeWidth={3} />
                </div>
                <h1 className="font-display text-[clamp(2rem,4.8vw,3.25rem)] leading-[0.96] tracking-[-0.04em] text-[#1A1A1A]">
                  Mensaje gestionado
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[#6B6560]">{message}</p>

                {contact ? (
                  <div className="mt-8 rounded-2xl border border-[#E8E4DD] bg-[#FCFBF8] p-5 text-left sm:p-6">
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A6771B]">
                      Informacion del mensaje respondido
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#E8E4DD] bg-white p-4">
                        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B847E]">
                          <UserRound size={14} /> Cliente
                        </p>
                        <p className="text-[15px] font-semibold text-[#1A1A1A]">{contact.name}</p>
                      </div>

                      <div className="rounded-xl border border-[#E8E4DD] bg-white p-4">
                        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B847E]">
                          <Mail size={14} /> Email
                        </p>
                        <p className="break-all text-[14px] text-[#1A1A1A]">{contact.email}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#E8E4DD] bg-white p-4">
                      <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8B847E]">
                        <MessageSquareText size={14} /> Mensaje
                      </p>
                      <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#2F2A25]">{contact.message}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[#6B6560]">
                      <span className="rounded-full border border-[#E8E4DD] bg-white px-3 py-1">Creado: {contact.created_at}</span>
                      {contact.read_at ? <span className="rounded-full border border-[#E8E4DD] bg-white px-3 py-1">Leido: {contact.read_at}</span> : null}
                      {contact.read_by_email ? <span className="rounded-full border border-[#E8E4DD] bg-white px-3 py-1">Marcado por: {contact.read_by_email}</span> : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/admin/core/contactmessage/"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#C8972E] px-7 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#B8851F]"
                  >
                    Ir al admin
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                  <ShieldAlert size={28} strokeWidth={2.4} />
                </div>
                <h1 className="font-display text-[clamp(1.9rem,4.3vw,2.8rem)] leading-[0.98] tracking-[-0.035em] text-[#1A1A1A]">
                  No pudimos validar el enlace
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
                    Volver al inicio
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="mx-auto mt-10 max-w-2xl border-t border-dashed border-[#E8E4DD] pt-6 text-center text-[13px] leading-relaxed text-[#8B847E]">
            Esta accion solo es accesible mediante el token firmado enviado al destinatario autorizado.
          </div>
        </div>
      </div>
    </section>
  );
}
