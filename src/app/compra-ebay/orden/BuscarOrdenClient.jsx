'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, PackageSearch } from 'lucide-react';

import { getEbayOrder } from '@/lib/api';

/**
 * El código sale de `_generate_order_code` (apps/ebay/models.py): 6 caracteres
 * de un alfabeto sin 0/O ni 1/I/L, porque se dicta por teléfono. La variante de
 * 8 solo aparece si hubo 20 colisiones seguidas, así que el input tolera hasta ahí.
 */
const CODE_MIN_LENGTH = 6;
const CODE_MAX_LENGTH = 8;

/** Deja solo lo que puede formar parte de un código, en mayúsculas. */
function normalizeCode(value) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, CODE_MAX_LENGTH);
}

export default function BuscarOrdenClient() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    setCode(normalizeCode(event.target.value));
    if (error) setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (checking) return;

    if (code.length < CODE_MIN_LENGTH) {
      setError(`El código tiene ${CODE_MIN_LENGTH} caracteres. Revisá que no te falte ninguno.`);
      return;
    }

    setChecking(true);
    setError('');

    try {
      // Confirmamos que el pedido existe antes de navegar: así el "no
      // encontramos ese código" se lee acá, con el input a mano para corregirlo,
      // en vez de mandar a la persona a una pantalla vacía.
      await getEbayOrder(code);
      router.push(`/compra-ebay/orden/${code}`);
      // `checking` queda en true a propósito: el botón sigue en "buscando"
      // hasta que se pinta la pantalla del pedido, sin parpadeo intermedio.
    } catch (err) {
      if (err?.status === 404) {
        setError('No encontramos ningún pedido con ese código. Revisá que esté bien escrito — lo tenés en el email de confirmación.');
      } else {
        setError(err?.message || 'No pudimos buscar tu pedido. Volvé a intentar en unos minutos.');
      }
      setChecking(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pt-24 pb-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md mx-auto">
        <Link
          href="/compra-ebay"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#6B6560] hover:text-[#1A1A1A] transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          Regresar a compras eBay
        </Link>

        <div className="bg-white border border-[#E8E4DD] rounded-2xl px-6 sm:px-8 py-10">
          <div className="text-center">
            <PackageSearch size={34} className="mx-auto text-[#C8972E]" />
            <h1 className="text-2xl font-black tracking-[-0.02em] text-[#1A1A1A] mt-5">
              Seguí tu pedido
            </h1>
            <p className="text-sm text-[#6B6560] mt-2.5 leading-relaxed">
              Ingresá el código de tu pedido de importación y te mostramos en qué estado está.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <label
              htmlFor="order-code"
              className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-[#6B6560] text-center"
            >
              Código de pedido
            </label>
            <input
              id="order-code"
              type="text"
              value={code}
              onChange={handleChange}
              placeholder="ABC123"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={CODE_MAX_LENGTH}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'order-code-error' : undefined}
              className="mt-3 w-full h-16 rounded-xl border border-[#E8E4DD] bg-[#FAFAF7] px-4 text-center text-3xl font-black tracking-[0.18em] tabular-nums text-[#1A1A1A] uppercase outline-none transition-colors focus:border-[#C8972E]/50 focus:bg-white placeholder:text-[#6B6560]/25 placeholder:font-black"
            />

            {error && (
              <p id="order-code-error" role="alert" className="mt-3 text-xs text-red-600 leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={checking}
              className="mt-5 w-full h-12 rounded-xl bg-[#C8972E] text-white text-xs font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#B8851F] transition-colors disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  Ver estado
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#6B6560] mt-6 text-center leading-relaxed">
            El código está en el email de confirmación que te mandamos al hacer el pedido.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
