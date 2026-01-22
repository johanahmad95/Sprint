'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BackgroundSwitcher from './BackgroundSwitcher';
import BookingCard from './BookingCard';
import Badge3D from '@/components/ui/Badge3D';
import { HeroCourt } from '@/lib/types';

// Court data for background switcher - Priority: Pickleball & Padel first
const HERO_COURTS: HeroCourt[] = [
  { id: '01', label: 'Pickleball Courts', sport: 'pickleball', image: '/courts/pickleball.jpg' },
  { id: '02', label: 'Padel Arena', sport: 'padel', image: '/courts/padel.jpg' },
  { id: '03', label: 'Tennis Courts', sport: 'tennis', image: '/courts/tennis.jpg' },
  { id: '04', label: 'Badminton Hall', sport: 'badminton', image: '/courts/badminton.jpg' },
  { id: '05', label: 'Futsal Arena', sport: 'futsal', image: '/courts/futsal.jpg' },
  { id: '06', label: 'Football Field', sport: 'football', image: '/courts/football.jpg' },
];

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_COURTS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_COURTS.length) % HERO_COURTS.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_COURTS.length);
  };

  return (
    <section 
      className="relative h-[85vh] min-h-[600px] max-h-[800px] flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images */}
      <BackgroundSwitcher courts={HERO_COURTS} activeIndex={activeIndex} />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="text-white space-y-5">
            <Badge3D variant="glow" color="chartreuse" className="animate-pulse-glow">
              Welcome to Sprint
            </Badge3D>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Your Premier{' '}
              <span className="text-chartreuse">Sports Court</span>{' '}
              Booking Platform
            </h1>
            
            <p className="text-base text-white/80 max-w-lg">
              Our user-friendly platform allows you to find the perfect court, 
              whether you&apos;re a seasoned player or just starting out. 
              Book courts across Klang Valley in seconds.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-2">
              <div>
                <p className="text-2xl font-bold text-chartreuse">50+</p>
                <p className="text-sm text-white/60">Venues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chartreuse">200+</p>
                <p className="text-sm text-white/60">Courts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chartreuse">10K+</p>
                <p className="text-sm text-white/60">Bookings</p>
              </div>
            </div>
          </div>

          {/* Right Content - Booking Card */}
          <div className="flex justify-center lg:justify-end">
            <BookingCard />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-8 left-4 sm:left-8 lg:left-12 z-20 flex items-center gap-4">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 
              flex items-center justify-center text-white
              hover:bg-white/30 transition-all duration-200
              shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 
              flex items-center justify-center text-white
              hover:bg-white/30 transition-all duration-200
              shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Current slide indicator */}
        <div className="text-white/80 text-sm font-medium">
          <span className="text-chartreuse font-bold">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="mx-1">/</span>
          <span>{String(HERO_COURTS.length).padStart(2, '0')}</span>
        </div>

        {/* Dot indicators */}
        <div className="hidden sm:flex items-center gap-2">
          {HERO_COURTS.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-chartreuse w-6' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
        <div 
          className="h-full bg-chartreuse transition-all duration-300"
          style={{ 
            width: `${((activeIndex + 1) / HERO_COURTS.length) * 100}%` 
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
