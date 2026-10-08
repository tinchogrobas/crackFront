'use client';
/**
 * Sesión del comprador: el único lugar que sabe si hay alguien logueado.
 *
 *   status: 'loading' | 'disabled' (sin Supabase configurado) | 'anonymous' | 'authenticated'
 *
 * Supabase maneja la identidad (Google, código por email, tokens). Django
 * maneja el perfil (datos, direcciones, pedidos). Cuando aparece una sesión,
 * `/customers/session/` los sincroniza: crea el cliente si es nuevo y le trae
 * las compras que haya hecho como invitado con ese email.
 *
 * supabase-js se carga diferido: enseguida en /cuenta y /checkout (donde hace
 * falta ya), y en un momento ocioso en el resto del sitio.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { setCustomerTokenProvider, syncSession } from '@/lib/customerApi';

const SessionContext = createContext(null);

const loadSupabase = () => import('@/lib/supabase').then((m) => m.supabase);
const URGENT_ROUTES = ['/cuenta', '/checkout'];

/**
 * Supabase responde en inglés y con mensajes técnicos. Se busca por fragmento
 * porque el texto exacto cambia entre versiones de la API.
 */
const TRANSLATIONS = [
  ['token has expired or is invalid', 'El código no es válido o ya venció. Pedí uno nuevo.'],
  ['otp_expired', 'El código no es válido o ya venció. Pedí uno nuevo.'],
  ['for security purposes', 'Esperá unos segundos antes de pedir otro código.'],
  ['over_email_send_rate_limit', 'Ya te mandamos un código hace poco. Esperá unos minutos.'],
  ['rate limit', 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'],
  ['signups not allowed', 'Por ahora no se pueden crear cuentas nuevas.'],
  ['invalid email', 'Ingresá un email válido.'],
  ['provider is not enabled', 'Ese método de ingreso no está disponible por ahora.'],
  ['network', 'No hay conexión. Revisá internet y volvé a intentar.'],
  ['fetch', 'No hay conexión. Revisá internet y volvé a intentar.'],
];

function translateError(error, fallback = 'Algo salió mal. Volvé a intentar.') {
  const text = String(error?.message || error?.code || error || '').toLowerCase();
  const found = TRANSLATIONS.find(([fragment]) => text.includes(fragment));
  return found ? found[1] : fallback;
}

/**
 * Una sola sincronización por usuario a la vez, aunque Supabase dispare varios
 * eventos seguidos al volver del login (INITIAL_SESSION, SIGNED_IN…) o React
 * monte el efecto dos veces en desarrollo.
 */
const syncsInFlight = new Map();

/**
 * "Enviarme novedades y ofertas" se marca antes de entrar, pero la suscripción
 * recién se hace con la sesión ya validada (con Google, el navegador se va y
 * vuelve en el medio). Mientras tanto queda guardado acá.
 */
const MARKETING_OPT_IN_KEY = 'crack:marketingOptIn';

export function rememberMarketingOptIn(value) {
  try {
    if (value) localStorage.setItem(MARKETING_OPT_IN_KEY, '1');
    else localStorage.removeItem(MARKETING_OPT_IN_KEY);
  } catch {
    // Sin storage (modo privado estricto): simplemente no se suscribe.
  }
}

function pendingMarketingOptIn() {
  try {
    return localStorage.getItem(MARKETING_OPT_IN_KEY) === '1';
  } catch {
    return false;
  }
}

export function SessionProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const supabaseRef = useRef(null);
  const syncedFor = useRef(null);

  const sync = useCallback(async (session) => {
    try {
      const result = await syncSession(session.access_token, { marketingOptIn: pendingMarketingOptIn() });
      rememberMarketingOptIn(false);
      setProfile(result.profile);
      setProfileError('');
      const n = result.linked_orders;
      if (n > 0) toast.success(n === 1 ? 'Encontramos 1 pedido tuyo' : `Encontramos ${n} pedidos tuyos`);
    } catch (error) {
      // La sesión de Supabase es válida aunque el backend no responda: el
      // comprador sigue logueado y puede comprar; solo falta el perfil.
      syncedFor.current = null;
      setProfileError('No pudimos cargar tu cuenta. Probá recargar la página.');
      console.warn('No se pudo sincronizar la cuenta:', error);
    }
  }, []);

  const applySession = useCallback(
    (session) => {
      if (!session) {
        syncedFor.current = null;
        setUser(null);
        setProfile(null);
        setStatus('anonymous');
        return;
      }
      setUser(session.user);
      setStatus('authenticated');
      // Supabase repite SIGNED_IN al volver a la pestaña: se sincroniza una
      // sola vez por usuario y carga de página.
      const uid = session.user.id;
      if (syncedFor.current !== uid && !syncsInFlight.has(uid)) {
        syncedFor.current = uid;
        const running = sync(session).finally(() => syncsInFlight.delete(uid));
        syncsInFlight.set(uid, running);
      }
    },
    [sync]
  );

  useEffect(() => {
    let cancelled = false;
    let subscription = null;

    const start = async () => {
      const supabase = await loadSupabase();
      if (cancelled) return;
      if (!supabase) {
        setStatus('disabled');
        return;
      }
      supabaseRef.current = supabase;
      setCustomerTokenProvider(
        async () => (await supabase.auth.getSession()).data.session?.access_token ?? null
      );

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // Supabase pide no llamar a su API dentro de este callback (puede
        // trabarse): se difiere al siguiente tick.
        setTimeout(() => applySession(session), 0);
      });
      subscription = data.subscription;
    };

    const urgent = URGENT_ROUTES.some((r) => window.location.pathname.startsWith(r));
    let idleId = null;
    if (urgent || !('requestIdleCallback' in window)) start();
    else idleId = window.requestIdleCallback(start, { timeout: 3000 });

    return () => {
      cancelled = true;
      if (idleId) window.cancelIdleCallback(idleId);
      subscription?.unsubscribe();
    };
  }, [applySession]);

  const actions = useMemo(() => {
    // Cada acción rechaza con un mensaje ya en castellano.
    const run = async (fn, fallback) => {
      const supabase = supabaseRef.current || (await loadSupabase());
      if (!supabase) throw new Error('Las cuentas no están disponibles por ahora.');
      const { data, error } = await fn(supabase);
      if (error) throw new Error(translateError(error, fallback));
      return data;
    };

    return {
      signInWithGoogle: (next = '/cuenta') =>
        run((s) =>
          s.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}${next}` },
          })
        ),

      /** Manda el código de acceso al mail. Si no tiene cuenta, se la crea. */
      sendCode: (email) =>
        run((s) => s.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })),

      verifyCode: (email, token) =>
        run(
          (s) => s.auth.verifyOtp({ email, token, type: 'email' }),
          'El código no es válido o ya venció. Pedí uno nuevo.'
        ),

      /** `everywhere`: cierra también las sesiones de otros dispositivos. */
      signOut: ({ everywhere = false } = {}) =>
        run((s) => s.auth.signOut({ scope: everywhere ? 'global' : 'local' })),

      setProfile,
    };
  }, []);

  const value = useMemo(
    () => ({ status, user, profile, profileError, ...actions }),
    [status, user, profile, profileError, actions]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession tiene que usarse dentro de <SessionProvider>');
  return value;
}
