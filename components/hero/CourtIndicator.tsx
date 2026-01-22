'use client';

import { HeroCourt } from '@/lib/types';

interface CourtIndicatorProps {
  courts: HeroCourt[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const CourtIndicator = ({ courts, activeIndex, onSelect }: CourtIndicatorProps) => {
  return (
    <div className="flex flex-col gap-3">
      {courts.map((court, index) => {
        const isActive = index === activeIndex;
        
        return (
          <button
            key={court.id}
            onClick={() => onSelect(index)}
            className={`
              relative flex items-center gap-3 text-left
              transition-all duration-300 ease-out
              group
              ${isActive ? 'pl-4' : 'pl-0 hover:pl-2'}
            `}
          >
            {/* Active indicator bar */}
            <div
              className={`
                absolute left-0 top-1/2 -translate-y-1/2
                w-1 rounded-full bg-chartreuse
                transition-all duration-300
                ${isActive 
                  ? 'h-8 opacity-100 shadow-[0_0_15px_rgba(214,247,76,0.8)]' 
                  : 'h-0 opacity-0'
                }
              `}
            />
            
            {/* Index number */}
            <span
              className={`
                text-sm font-bold tabular-nums
                transition-all duration-300
                ${isActive 
                  ? 'text-chartreuse' 
                  : 'text-white/50 group-hover:text-white/70'
                }
              `}
            >
              {court.id}.
            </span>
            
            {/* Label */}
            <span
              className={`
                text-sm font-medium whitespace-nowrap
                transition-all duration-300
                ${isActive 
                  ? 'text-white' 
                  : 'text-white/50 group-hover:text-white/70'
                }
              `}
            >
              {court.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CourtIndicator;
