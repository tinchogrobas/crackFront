'use client';
import { Minus, Plus } from 'lucide-react';

/**
 * Selector de cantidad de la sección de importación.
 *
 * Sigue el patrón del selector de la tienda (`ui/QuantitySelector`): los tres
 * segmentos separados por líneas, en vez de tres elementos sueltos dentro de
 * una caja. Ese borde es el que hace leer los `−` y `+` como botones y no como
 * decoración, que era el problema del control anterior.
 *
 * Cuando un extremo se agota el botón queda apagado y explica el motivo al
 * pasar el mouse: un `+` que no responde y no dice nada se lee como que la
 * página se colgó.
 */

const SIZES = {
  sm: { box: 'h-8 rounded-lg', button: 'w-8', value: 'w-9 text-xs', icon: 12 },
  md: { box: 'h-11 rounded-xl', button: 'w-11', value: 'w-12 text-sm', icon: 14 },
};

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = 'md',
  itemLabel = '',
  maxReasonText = 'No hay más unidades disponibles.',
}) {
  const style = SIZES[size] || SIZES.md;
  const canDecrease = value > min;
  const canIncrease = value < max;

  const buttonClass = `${style.button} grid place-items-center text-[#6B6560] transition-colors hover:bg-[#F5F1EA] hover:text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#6B6560]`;

  return (
    <div className={`inline-flex items-stretch overflow-hidden border border-[#E8E4DD] bg-white ${style.box}`}>
      <button
        type="button"
        onClick={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        aria-label={itemLabel ? `Quitar una unidad de ${itemLabel}` : 'Quitar una unidad'}
        title={canDecrease ? undefined : 'Es la cantidad mínima.'}
        className={buttonClass}
      >
        <Minus size={style.icon} />
      </button>

      <span
        aria-live="polite"
        className={`${style.value} grid place-items-center border-x border-[#E8E4DD] font-bold tabular-nums text-[#1A1A1A]`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        aria-label={itemLabel ? `Agregar una unidad de ${itemLabel}` : 'Agregar una unidad'}
        title={canIncrease ? undefined : maxReasonText}
        className={buttonClass}
      >
        <Plus size={style.icon} />
      </button>
    </div>
  );
}
