'use client';
import { Minus, Plus } from 'lucide-react';

/**
 * Selector de cantidad de la sección de importación.
 *
 * Dos variantes, cada una copiando el patrón que la tienda ya usa en ese
 * contexto, para que la sección no invente un control propio:
 *
 * - `split`: dos cuadraditos sueltos con el número en el medio, como el
 *   carrito (`layout/CartDrawer`). Es el de las líneas de un pedido, donde el
 *   control convive con el precio y el tacho en poco espacio.
 * - `segmented`: los tres segmentos unidos por líneas divisorias, como el de
 *   la ficha de producto (`ui/QuantitySelector`). Es el que va al lado de un
 *   botón de acción, donde tiene que pesar lo mismo que él.
 *
 * En las dos, cuando un extremo se agota el botón queda apagado y explica el
 * motivo al pasar el mouse: un `+` que no responde y no dice nada se lee como
 * que la página se colgó.
 */

const BASE_BUTTON =
  'grid place-items-center text-[#6B6560] transition-colors disabled:cursor-not-allowed disabled:opacity-30';

const VARIANTS = {
  split: {
    wrapper: 'inline-flex items-center gap-1.5',
    button: `w-6 h-6 rounded-md border border-[#E8E4DD] hover:border-[#D4CFC6] hover:text-[#1A1A1A] disabled:hover:border-[#E8E4DD] ${BASE_BUTTON}`,
    value: 'w-5 text-center text-[12px] font-semibold tabular-nums text-[#1A1A1A]',
    icon: 10,
  },
  segmented: {
    wrapper: 'inline-flex items-stretch h-11 overflow-hidden rounded-xl border border-[#E8E4DD] bg-white',
    button: `w-11 hover:bg-[#F5F1EA] hover:text-[#1A1A1A] disabled:hover:bg-transparent disabled:hover:text-[#6B6560] ${BASE_BUTTON}`,
    value: 'grid w-12 place-items-center border-x border-[#E8E4DD] text-sm font-bold tabular-nums text-[#1A1A1A]',
    icon: 14,
  },
};

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  variant = 'segmented',
  itemLabel = '',
  maxReasonText = 'No hay más unidades disponibles.',
}) {
  const style = VARIANTS[variant] || VARIANTS.segmented;
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className={style.wrapper}>
      <button
        type="button"
        onClick={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        aria-label={itemLabel ? `Quitar una unidad de ${itemLabel}` : 'Quitar una unidad'}
        title={canDecrease ? undefined : 'Es la cantidad mínima.'}
        className={style.button}
      >
        <Minus size={style.icon} />
      </button>

      <span aria-live="polite" className={style.value}>
        {value}
      </span>

      <button
        type="button"
        onClick={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        aria-label={itemLabel ? `Agregar una unidad de ${itemLabel}` : 'Agregar una unidad'}
        title={canIncrease ? undefined : maxReasonText}
        className={style.button}
      >
        <Plus size={style.icon} />
      </button>
    </div>
  );
}
