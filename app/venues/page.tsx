'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { SportFilter, Card3D, VenueCard } from '@/components/ui';
import { Select3D } from '@/components/ui/Input3D';
import { SportType, AREA_INFO, KlangValleyArea } from '@/lib/types';
import { getFeaturedVenues, getVenuesBySport, MOCK_VENUES, MOCK_COURTS } from '@/lib/mock-data';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';

export default function VenuesPage() {
  const searchParams = useSearchParams();
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedArea, setSelectedArea] = useState<KlangValleyArea | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize from URL params
  useEffect(() => {
    const sport = searchParams.get('sport') as SportType | null;
    const area = searchParams.get('area') as KlangValleyArea | null;
    
    if (sport && ['pickleball', 'padel', 'tennis', 'badminton', 'futsal', 'basketball', 'squash'].includes(sport)) {
      setSelectedSport(sport);
    }
    if (area && Object.keys(AREA_INFO).includes(area)) {
      setSelectedArea(area);
    }
  }, [searchParams]);

  // Filter venues
  const filteredVenues = MOCK_VENUES
    .map(venue => {
      const court = MOCK_COURTS.find(c => 
        c.venueId === venue.id && 
        (selectedSport === 'all' || c.sport === selectedSport)
      );
      return { venue, court };
    })
    .filter(({ venue, court }) => {
      if (!court) return false;
      if (selectedArea !== 'all' && venue.area !== selectedArea) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          venue.name.toLowerCase().includes(query) ||
          venue.location.toLowerCase().includes(query) ||
          venue.description.toLowerCase().includes(query)
        );
      }
      return true;
    });

  const areaOptions = [
    { value: 'all', label: 'All Areas' },
    ...Object.entries(AREA_INFO).map(([key, value]) => ({
      value: key,
      label: value.label,
    })),
  ];

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8 bg-gradient-to-b from-apricot-light to-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
              Find Your Perfect Court
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore sports courts across Klang Valley. Filter by sport type and location 
              to find the perfect venue for your next game.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search venues by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white
                  shadow-[4px_4px_12px_rgba(0,0,0,0.08),-3px_-3px_10px_rgba(255,255,255,0.9)]
                  border border-gray-100 text-gray-800 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-vista-blue/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters Row */}
          <Card3D variant="clay" padding="md" className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium">Filters:</span>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2 lg:hidden">Sport Type:</p>
                <SportFilter
                  selectedSport={selectedSport}
                  onSelectSport={setSelectedSport}
                />
              </div>

              <div className="w-full lg:w-64">
                <p className="text-sm text-gray-500 mb-2 lg:hidden">Location:</p>
                <Select3D
                  icon={<MapPin className="w-5 h-5" />}
                  options={areaOptions}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value as KlangValleyArea | 'all')}
                />
              </div>
            </div>
          </Card3D>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-800">{filteredVenues.length}</span> venues found
            </p>
            {(selectedSport !== 'all' || selectedArea !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSport('all');
                  setSelectedArea('all');
                  setSearchQuery('');
                }}
                className="text-sm text-tomato hover:text-tomato-dark font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Venues Grid */}
          {filteredVenues.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredVenues.map(({ venue, court }) => (
                court && <VenueCard key={venue.id} venue={venue} court={court} />
              ))}
            </div>
          ) : (
            <Card3D variant="clay" padding="lg" className="text-center">
              <div className="py-12">
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  No venues found
                </p>
                <p className="text-gray-500">
                  Try adjusting your filters or search query.
                </p>
              </div>
            </Card3D>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
