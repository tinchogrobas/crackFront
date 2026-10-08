'use client';
/**
 * Marco de las páginas con sesión: la columna "Pedidos / Perfil" (como la
 * cuenta de Shopify) y la guarda que manda a /cuenta si no hay nadie logueado.
 */
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from './SessionProvider';

const NAV = [
  { href: '/cuenta/pedidos', label: 'Pedidos' },
  { href: '/cuenta/perfil', label: 'Perfil' },
];

export function AccountLoading() {
  return (
    <div className="flex justify-center py-24 text-[#6B6560]" aria-busy="true">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}

export function AccountUnavailable() {
  return (
    <div className="max-w-[400px] mx-auto text-center py-16">
      <h1 className="text-2xl font-black text-[#1A1A1A]">Cuentas no disponibles</h1>
      <p className="text-[14px] text-[#6B6560] mt-2">
        Por ahora no se puede ingresar. Igual podés comprar como siempre, sin cuenta.
      </p>
      <Link href="/tienda" className="inline-block mt-6 text-[13px] font-semibold text-[#C8972E] hover:text-[#B8851F]">
        Ir a la tienda →
      </Link>
    </div>
  );
}

export default function AccountShell({ children }) {
  const { status, profileError } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/cuenta');
  }, [status, router]);

  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        {status === 'disabled' ? (
          <AccountUnavailable />
        ) : status !== 'authenticated' ? (
          <AccountLoading />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-16">
            <nav aria-label="Mi cuenta" className="flex lg:flex-col gap-6 lg:gap-2 border-b border-[#E8E4DD] lg:border-0 pb-4 lg:pb-0">
              {NAV.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`font-display text-xl lg:text-2xl font-bold transition-colors ${
                      active ? 'text-[#1A1A1A]' : 'text-[#6B6560]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="min-w-0 max-w-[820px]">
              {profileError && (
                <p className="mb-6 text-[13px] text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3" role="alert">
                  {profileError}
                </p>
              )}
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
