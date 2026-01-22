'use client';

import Image from 'next/image';
import { HeroCourt } from '@/lib/types';

interface BackgroundSwitcherProps {
  courts: HeroCourt[];
  activeIndex: number;
}

const BackgroundSwitcher = ({ courts, activeIndex }: BackgroundSwitcherProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {courts.map((court, index) => (
        <div
          key={court.id}
          className={`
            absolute inset-0 transition-opacity duration-1000 ease-in-out
            ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
          `}
        >
          <Image
            src={court.image}
            alt={court.label}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-dark/80 via-teal-dark/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}
    </div>
  );
};

export default BackgroundSwitcher;
