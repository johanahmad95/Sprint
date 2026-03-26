'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { SportType, SPORTS_CATEGORIES } from '@/lib/types';
import { cn } from '@/lib/utils';

const SCROLL_AMOUNT = 200;

interface SportFilterProps {
  selectedSport: SportType | 'all';
  onSelectSport: (sport: SportType | 'all') => void;
  availableSports?: SportType[];
}

const SportFilter = ({
  selectedSport,
  onSelectSport,
  availableSports,
}: SportFilterProps) => {
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const filteredSports: (SportType | 'all')[] = [
    'all',
    ...(availableSports
      ? sportOrder.filter((s) => availableSports.includes(s))
      : sportOrder),
  ];

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const threshold = 2;
    setCanScrollLeft(scrollLeft > threshold);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, filteredSports.length]);

  const scrollPrevious = () => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  const handleIconError = (sport: string) => {
    setFailedIcons((prev) => new Set(prev).add(sport));
  };

  return (
    <div className="border-b border-gray-200 pb-2 relative">
      {/* Mobile-only arrows */}
      <button
        type="button"
        onClick={scrollPrevious}
        disabled={!canScrollLeft}
        aria-label="Previous sports"
        className={cn(
          'md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center',
          'w-8 h-8 rounded-full bg-white shadow-md border border-gray-100',
          'text-tomato hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none',
          'transition-opacity duration-200',
        )}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollRight}
        aria-label="Next sports"
        className={cn(
          'md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center',
          'w-8 h-8 rounded-full bg-white shadow-md border border-gray-100',
          'text-tomato hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none',
          'transition-opacity duration-200',
        )}
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide px-12 md:px-4 lg:px-8"
      >
        <div className="flex justify-start md:justify-center gap-6 md:gap-8 min-w-max w-full whitespace-nowrap">
        {filteredSports.map((sport) => {
          const isActive = selectedSport === sport;
          const isAll = sport === 'all';
          const label = isAll ? 'All' : SPORTS_CATEGORIES[sport as SportType].label;
          const iconFailed = !isAll && failedIcons.has(sport);

          return (
            <button
              key={sport}
              onClick={() => onSelectSport(sport)}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 md:gap-2 min-w-[56px] md:min-w-[64px] py-2 transition-all duration-200 flex-shrink-0',
              )}
            >
              {/* Icon - slightly smaller on mobile */}
              <div
                className={cn(
                  'flex items-center justify-center w-7 h-7 md:w-8 md:h-8 transition-transform duration-200',
                  'group-hover:scale-110 group-focus-visible:scale-110',
                  isActive && 'scale-110',
                )}
              >
                {isAll ? (
                  <LayoutGrid
                    className={cn(
                      'w-5 h-5 md:w-6 md:h-6',
                      isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                ) : iconFailed ? (
                  <span
                    className={cn(
                      'flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 text-xs md:text-sm font-semibold text-gray-600',
                      isActive && 'bg-gray-300 text-gray-800',
                    )}
                  >
                    {label.charAt(0)}
                  </span>
                ) : (
                  <Image
                    src={SPORTS_CATEGORIES[sport as SportType].icon}
                    alt={label}
                    width={32}
                    height={32}
                    className="w-7 h-7 md:w-8 md:h-8 object-contain"
                    onError={() => handleIconError(sport)}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'block w-full text-[11px] md:text-xs text-center transition-colors duration-200',
                  'text-gray-500 group-hover:text-gray-900',
                  isActive && 'text-gray-900 font-medium',
                )}
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              >
                {label}
              </span>

              {/* Indicator line - responsive width, centered under icon */}
              <div
                className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-7 md:w-8 bg-gray-900 rounded-full',
                  'transition-opacity duration-200',
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              />
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default SportFilter;
