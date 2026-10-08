/**
 * Cliente de Supabase Auth.
 *
 * Se importa con `import()` dinámico desde SessionProvider, nunca de forma
 * estática: así supabase-js no entra en el bundle inicial y la home carga
 * igual de rápido que antes.
 *
 * Variables (en .env.local y en Vercel):
 *   NEXT_PUBLIC_SUPABASE_URL              https://<proyecto>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  la clave pública (sb_publishable_… o la "anon")
 * Sin ellas `supabase` es null y las cuentas quedan apagadas: el sitio sigue
 * vendiendo como siempre.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          // PKCE: la vuelta de Google trae un `code` de un solo uso que se
          // canjea por la sesión; el token nunca viaja en la URL.
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
