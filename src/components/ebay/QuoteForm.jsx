'use client';
import { Link2, Loader2, Search } from 'lucide-react';

/**
 * Entrada de la calculadora.
 *
 * Solo pide el link: el costo de traerla es el mismo para cualquier
 * publicación —carta suelta, calificada o producto sellado—, así que no hay
 * nada que el cliente tenga que elegir antes de cotizar.
 */
export default function QuoteForm({ url, onUrlChange, onSubmit, loading, disabled }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="bg-white border border-[#E8E4DD] rounded-2xl p-5 sm:p-6"
    >
      <label
        htmlFor="ebay-url"
        className="block text-[10px] font-semibold tracking-[0.18em] text-[#6B6560] uppercase mb-3"
      >
        Link de la publicación
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Link2
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6560]/50 pointer-events-none"
          />
          <input
            id="ebay-url"
            type="text"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://www.ebay.com/itm/..."
            autoComplete="off"
            spellCheck="false"
            disabled={disabled}
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E8E4DD] bg-[#FAFAF7] text-sm text-[#1A1A1A] placeholder:text-[#6B6560]/45 focus:bg-white focus:border-[#C8972E] focus:ring-2 focus:ring-[#C8972E]/15 transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || disabled || !url.trim()}
          className="h-12 px-6 rounded-xl bg-[#1A1A1A] text-white text-xs font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center gap-2 hover:bg-[#C8972E] transition-colors disabled:opacity-40 disabled:hover:bg-[#1A1A1A] whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Cotizando
            </>
          ) : (
            <>
              <Search size={15} />
              Cotizar
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-[#6B6560] leading-relaxed">
        Sirve para cartas sueltas, calificadas y productos sellados: el costo de
        importación es el mismo para todos.
      </p>
    </form>
  );
}
