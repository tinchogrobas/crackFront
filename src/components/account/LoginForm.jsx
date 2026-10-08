'use client';
/**
 * Ingreso sin contraseña, como en Shopify:
 *
 *   email → Google, o el email y "Continuar"
 *   code  → el código de 6 dígitos que llegó al mail
 *
 * Si el email no tiene cuenta, Supabase la crea al verificar el código: el
 * comprador no tiene que decidir antes si "se registra" o "entra".
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { rememberMarketingOptIn, useSession } from './SessionProvider';
import { inputClass, labelClass, primaryButton, textButton } from './ui';

// Supabase no deja mandar otro mail al mismo email antes de 60 s.
const RESEND_WAIT_S = 60;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const GoogleLogo = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function LoginForm({ next = '/cuenta/pedidos' }) {
  const { signInWithGoogle, sendCode, verifyCode } = useSession();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Cuenta regresiva de "Reenviar código".
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const attempt = async (key, fn) => {
    setError('');
    setLoading(key);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading('');
    }
  };

  const withGoogle = () =>
    attempt('google', () => {
      rememberMarketingOptIn(marketingOptIn);
      // Vuelve a /cuenta (y de ahí a `next`). Si sale bien, el navegador se va a Google.
      return signInWithGoogle(next === '/cuenta/pedidos' ? '/cuenta' : `/cuenta?next=${encodeURIComponent(next)}`);
    });

  const submitEmail = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Ingresá un email válido.');
    attempt('send', async () => {
      rememberMarketingOptIn(marketingOptIn);
      await sendCode(email.trim().toLowerCase());
      setCode('');
      setResent(false);
      setWait(RESEND_WAIT_S);
      setStep('code');
    });
  };

  const submitCode = (e) => {
    e.preventDefault();
    if (code.length < 6) return setError('Ingresá el código completo.');
    // Al validar, SessionProvider recibe la sesión y la página redirige sola.
    attempt('verify', () => verifyCode(email.trim().toLowerCase(), code));
  };

  const resend = () =>
    attempt('resend', async () => {
      await sendCode(email.trim().toLowerCase());
      setResent(true);
      setWait(RESEND_WAIT_S);
    });

  const backToEmail = () => {
    setStep('email');
    setCode('');
    setError('');
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Mi cuenta</p>

      {step === 'email' && (
        <>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-[#1A1A1A]">
            Iniciar sesión<span className="text-[#C8972E]">.</span>
          </h1>
          <p className="text-[14px] text-[#6B6560] mt-2 mb-8">
            Seguí tus pedidos y comprá más rápido. Si no tenés cuenta, se crea sola.
          </p>

          <button
            type="button"
            onClick={withGoogle}
            disabled={!!loading}
            className="w-full h-12 bg-white border border-[#E8E4DD] rounded-lg text-[14px] font-semibold text-[#1A1A1A] hover:border-[#1A1A1A]/40 transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {loading === 'google' ? <Loader2 size={16} className="animate-spin" /> : <GoogleLogo />}
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 my-6 text-[11px] tracking-[0.15em] uppercase text-[#6B6560]/60">
            <span className="h-px flex-1 bg-[#E8E4DD]" /> o <span className="h-px flex-1 bg-[#E8E4DD]" />
          </div>

          <form onSubmit={submitEmail} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className={labelClass}>Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-2.5 text-[13px] text-[#1A1A1A] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="w-4 h-4 accent-[#C8972E] flex-shrink-0"
              />
              Enviarme novedades y ofertas por correo electrónico
            </label>
            <button type="submit" disabled={!!loading} className={`${primaryButton} w-full`}>
              {loading === 'send' ? <Loader2 size={14} className="animate-spin" /> : null}
              CONTINUAR
            </button>
          </form>
        </>
      )}

      {step === 'code' && (
        <form onSubmit={submitCode} noValidate>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-[#1A1A1A]">
            Ingresá el código<span className="text-[#C8972E]">.</span>
          </h1>
          <p className="text-[14px] text-[#6B6560] mt-2 mb-8 break-words">
            Te enviamos un código a <span className="text-[#1A1A1A] font-medium">{email.trim()}</span>.
            Si no lo ves, revisá spam y promociones.
          </p>

          <label htmlFor="login-code" className={labelClass}>Código</label>
          <input
            id="login-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={10}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${inputClass} text-center text-xl tracking-[0.5em] font-semibold tabular-nums`}
          />

          <button type="submit" disabled={!!loading} className={`${primaryButton} w-full mt-4`}>
            {loading === 'verify' ? <Loader2 size={14} className="animate-spin" /> : null}
            INGRESAR
          </button>

          <div className="flex items-center justify-between mt-5">
            <button type="button" onClick={backToEmail} className={textButton}>
              Usar otro email
            </button>
            <button type="button" onClick={resend} disabled={wait > 0 || !!loading} className={`${textButton} tabular-nums`}>
              {wait > 0 ? `Reenviar en 0:${String(wait).padStart(2, '0')}` : 'Reenviar código'}
            </button>
          </div>
          <p className="text-[12px] text-emerald-700 mt-3 min-h-[18px]" role="status" aria-live="polite">
            {resent ? 'Te mandamos un código nuevo.' : ''}
          </p>
        </form>
      )}

      {error && (
        <p className="mt-4 text-[13px] text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3" role="alert">
          {error}
        </p>
      )}

      <p className="text-[12px] text-[#6B6560]/70 mt-10 leading-relaxed">
        Al continuar aceptás los{' '}
        <Link href="/terminos" className="underline hover:text-[#1A1A1A]">Términos</Link> y la{' '}
        <Link href="/privacidad" className="underline hover:text-[#1A1A1A]">Política de privacidad</Link>.
      </p>
    </div>
  );
}
