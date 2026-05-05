import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ quantity, onIncrease, onDecrease, max = 99 }) {
  return (
    <div className="flex items-center border border-[#E8E4DD]">
      <button
        onClick={onDecrease}
        disabled={quantity <= 1}
        className="w-11 h-11 flex items-center justify-center text-[#6B6560] hover:text-[#1A1A1A] disabled:opacity-20 transition-all hover:bg-[#F5F1EA]"
      >
        <Minus size={13} />
      </button>
      <span className="w-10 text-center text-[13px] font-medium border-x border-[#E8E4DD] text-[#1A1A1A]">{quantity}</span>
      <button
        onClick={onIncrease}
        disabled={quantity >= max}
        className="w-11 h-11 flex items-center justify-center text-[#6B6560] hover:text-[#1A1A1A] disabled:opacity-20 transition-all hover:bg-[#F5F1EA]"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
