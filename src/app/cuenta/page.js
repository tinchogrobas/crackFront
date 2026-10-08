'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/account/SessionProvider';
import LoginForm from '@/components/account/LoginForm';
import { AccountLoading, AccountUnavailable } from '@/components/account/AccountShell';
import { safeNext } from '@/components/account/ui';

function CuentaContent() {
  const { status } = useSession();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  // Con sesión, /cuenta es la puerta a los pedidos (o a donde venía).
  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, next, router]);

  if (status === 'disabled') return <AccountUnavailable />;
  if (status !== 'anonymous') return <AccountLoading />;
  return <LoginForm next={next} />;
}

export default function CuentaPage() {
  return (
    <div className="pt-28 pb-24 px-5 sm:px-8">
      <Suspense fallback={<AccountLoading />}>
        <CuentaContent />
      </Suspense>
    </div>
  );
}
