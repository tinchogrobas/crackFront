'use client';
import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

const CONDITION_CONFIG = {
  mint: {
    abbr: 'M',
    label: 'Mint',
    color: 'bg-emerald-600',
    textColor: 'text-white',
    description: 'La carta está en perfecto estado, sin marcas, rayones ni imperfecciones.',
  },
  'near mint': {
    abbr: 'NM',
    label: 'Near Mint',
    color: 'bg-green-500',
    textColor: 'text-white',
    description: 'La carta tiene un desgaste mínimo, casi imperceptible. Excelente estado general.',
  },
  'lightly played': {
    abbr: 'LP',
    label: 'Lightly Played',
    color: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    description: 'La carta presenta leve desgaste visible, como pequeñas marcas o bordes ligeramente gastados.',
  },
  'moderately played': {
    abbr: 'MP',
    label: 'Moderately Played',
    color: 'bg-orange-500',
    textColor: 'text-white',
    description: 'La carta muestra desgaste moderado, con marcas, rayones o bordes notablemente gastados.',
  },
  'moderate played': {
    abbr: 'MP',
    label: 'Moderate Played',
    color: 'bg-orange-500',
    textColor: 'text-white',
    description: 'La carta muestra desgaste moderado, con marcas, rayones o bordes notablemente gastados.',
  },
  damage: {
    abbr: 'D',
    label: 'Damage',
    color: 'bg-red-600',
    textColor: 'text-white',
    description: 'La carta tiene daño significativo: dobleces, roturas, manchas o desgaste severo.',
  },
  damaged: {
    abbr: 'D',
    label: 'Damaged',
    color: 'bg-red-600',
    textColor: 'text-white',
    description: 'La carta tiene daño significativo: dobleces, roturas, manchas o desgaste severo.',
  },
};

function getConditionConfig(conditionName) {
  if (!conditionName) return null;
  const key = conditionName.toLowerCase().trim();
  return CONDITION_CONFIG[key] || {
    abbr: conditionName.charAt(0).toUpperCase(),
    label: conditionName,
    color: 'bg-gray-500',
    textColor: 'text-white',
    description: '',
  };
}

export default function ConditionBadge({ conditionName, size = 'default' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const badgeRef = useRef(null);

  const config = getConditionConfig(conditionName);
  if (!config) return null;

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target) &&
        badgeRef.current && !badgeRef.current.contains(e.target)
      ) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener('pointerdown', handleClickOutside);
      return () => document.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [showTooltip]);

  const isCompact = size === 'compact';

  return (
    <span className="relative inline-flex items-center gap-1.5" ref={badgeRef}>
      <span className={`inline-flex items-center ${isCompact ? 'max-w-[132px] sm:max-w-[148px] px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'} ${config.color} ${config.textColor} rounded-full font-bold tracking-wide`}>
        <span className={isCompact ? 'truncate' : ''}>{config.label}</span>
      </span>

      {!isCompact && config.description && (
        <button
          type="button"
          className="text-[#6B6560]/50 hover:text-[#6B6560] transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTooltip((v) => !v); }}
          aria-label="Info sobre estado"
        >
          <HelpCircle size={14} />
        </button>
      )}

      {/* Tooltip */}
      {showTooltip && config.description && (
        <span
          ref={tooltipRef}
          className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-[#1A1A1A] text-white text-[11px] leading-relaxed rounded-lg px-3.5 py-2.5 shadow-xl pointer-events-auto"
        >
          <span className="font-semibold block mb-0.5">{config.label}</span>
          {config.description}
          <span className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1A1A1A]" />
        </span>
      )}
    </span>
  );
}
