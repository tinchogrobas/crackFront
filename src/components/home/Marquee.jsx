'use client';

export default function Marquee() {
  const items = [
    'SINGLES', 'SLABS', 'SELLADOS', 'MYSTERY PACKS',
    'ACCESORIOS', 'PSA', 'BGS', 'CGC',
    'POKÉMON TCG', 'ENVÍOS A TODO EL PAÍS',
  ];

  return (
    <div className="border-y border-[#E8E4DD] py-5 overflow-hidden bg-[#F5F1EA] relative">
      <div className="animate-marquee whitespace-nowrap flex">
        {[0, 1].map((idx) => (
          <span key={idx} className="flex items-center gap-6 mr-6">
            {items.map((item, i) => (
              <span key={`${idx}-${i}`} className="flex items-center gap-6">
                <span className="text-[13px] tracking-[0.25em] font-bold text-[#1A1A1A]/20 uppercase hover:text-[#1A1A1A]/40 transition-colors cursor-default">
                  {item}
                </span>
                <span className="text-[#C8972E]/30 text-xs">&#x2B25;</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
