'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SportType, SPORT_INFO } from '@/lib/types';

interface SportFilterProps {
  selectedSport: SportType | 'all';
  onSelectSport: (sport: SportType | 'all') => void;
  availableSports?: SportType[];
}

// Sport icons mapping
const SportIcons: Record<SportType | 'all', React.ReactNode> = {
  all: null, // No icon for "all"
  pickleball: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 8 L16 8 L15 16 L9 16 Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  padel: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <circle cx="12" cy="12" r="3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  tennis: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="8" fill="white" />
      <path d="M12 4 L12 20 M4 12 L20 12" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  badminton: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 3 L9 12 L12 20 L15 12 Z" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  ),
  futsal: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12" stroke="white" strokeWidth="1.5" />
      <path d="M6.34 6.34 Q12 12 17.66 17.66" stroke="white" strokeWidth="1" fill="none" />
      <path d="M17.66 6.34 Q12 12 6.34 17.66" stroke="white" strokeWidth="1" fill="none" />
    </svg>
  ),
  basketball: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12" stroke="white" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="8" ry="10" fill="none" stroke="white" strokeWidth="1" />
    </svg>
  ),
  squash: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="7" width="14" height="10" rx="1" />
      <circle cx="12" cy="12" r="3.5" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  ),
  football: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12" stroke="white" strokeWidth="1.5" />
      <path d="M6.34 6.34 Q12 12 17.66 17.66" stroke="white" strokeWidth="1" fill="none" />
      <path d="M17.66 6.34 Q12 12 6.34 17.66" stroke="white" strokeWidth="1" fill="none" />
    </svg>
  ),
};

const SportFilter = ({
  selectedSport,
  onSelectSport,
  availableSports,
}: SportFilterProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Priority order: Pickleball and Padel first, exclude 'all'
  const sportOrder: SportType[] = [
    'pickleball',
    'padel',
    'badminton',
    'futsal',
    'football',
    'tennis',
    'basketball',
    'squash',
  ];

  const filteredSports = availableSports
    ? sportOrder.filter(s => availableSports.includes(s))
    : sportOrder;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        onMouseEnter={checkScrollButtons}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
          transition-all duration-200
          ${canScrollLeft ? 'opacity-100 hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}
        `}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      {/* Scrollable sport list */}
      <div
        ref={scrollRef}
        onScroll={checkScrollButtons}
        className="flex gap-6 overflow-x-auto px-2 scrollbar-hide"
      >
        {filteredSports.map((sport) => {
          const isActive = selectedSport === sport;
          const label = SPORT_INFO[sport].label;

          return (
            <button
              key={sport}
              onClick={() => onSelectSport(sport)}
              className="relative flex flex-col items-center gap-2 flex-shrink-0 pb-2 transition-all duration-200 min-w-[70px]"
            >
              {/* Icon */}
              <div
                className={`
                  flex items-center justify-center
                  transition-colors duration-200
                  ${isActive ? 'text-gray-900' : 'text-gray-500'}
                `}
              >
                {SportIcons[sport]}
              </div>

              {/* Label */}
              <span
                className={`
                  text-xs sm:text-sm font-medium transition-colors duration-200
                  ${isActive ? 'text-gray-900' : 'text-gray-500'}
                `}
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              >
                {label}
              </span>

              {/* Active indicator - blue underline */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        onMouseEnter={checkScrollButtons}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
          transition-all duration-200
          ${canScrollRight ? 'opacity-100 hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}
        `}
        disabled={!canScrollRight}
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};

export default SportFilter;
