'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SportFilter, Button3D } from '@/components/ui';
import VenueCard from '@/components/ui/VenueCard';
import { SportType } from '@/lib/types';
import { getFeaturedVenues, getVenuesBySport } from '@/lib/mock-data';

const FeaturedCourts = () => {
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  
  const venues = selectedSport === 'all' 
    ? getFeaturedVenues() 
    : getVenuesBySport(selectedSport);

  return (
    <section className="pt-12 pb-20 bg-cream" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          {/* Main heading */}
          <h2
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-gray-900 mb-3 leading-tight"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Book Klang Valley&apos;s
            <span className="block bg-gradient-to-r from-tomato via-vista-blue to-teal-dark bg-clip-text text-transparent">
              top-rated courts in seconds
            </span>
          </h2>

          {/* Subheading */}
          <p
            className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Curated venues with great lighting, pro-grade surfaces, and easy parking —
            so you can focus on the game, not the logistics.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex justify-center">
          <SportFilter
            selectedSport={selectedSport}
            onSelectSport={setSelectedSport}
          />
        </div>

        {/* Venue Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {venues.slice(0, 6).map(({ venue, court }) => (
            court && (
              <VenueCard key={venue.id} venue={venue} court={court} />
            )
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/venues">
            <Button3D variant="outline" size="lg">
              View All Courts
            </Button3D>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourts;
