'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Locate } from 'lucide-react';
import { SportType } from '@/lib/types';
import { getUserLocation } from '@/lib/geolocation';
import { toast } from 'sonner';

const BookingSearchBar = () => {
  const router = useRouter();
  const [sport, setSport] = useState<SportType | ''>('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [sportOpen, setSportOpen] = useState(false);

  const sportOptions: { value: SportType | ''; label: string }[] = [
    { value: '', label: 'Select a sport' },
    { value: 'pickleball', label: 'Pickleball' },
    { value: 'padel', label: 'Padel' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'badminton', label: 'Badminton' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'squash', label: 'Squash' },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (location) params.set('q', location);
    if (date) params.set('date', date);
    router.push(`/venues?${params.toString()}`);
  };

  const handleFindNearMe = async () => {
    try {
      const { latitude, longitude } = await getUserLocation();
      const params = new URLSearchParams();
      params.set('lat', String(latitude));
      params.set('lng', String(longitude));
      if (sport) params.set('sport', sport);
      if (date) params.set('date', date);
      router.push(`/venues?${params.toString()}`);
    } catch (err: unknown) {
      const geoErr = err as { code?: number };
      if (geoErr?.code === 1) {
        toast.error('Please enable location to find nearby courts or search by area.');
      } else if (err instanceof Error && err.message === 'Geolocation is not supported') {
        toast.error('Location is not supported by your browser.');
      } else {
        toast.error('Could not get your location. Try again or search by area.');
      }
    }
  };

  return (
    <section className="relative z-20 -mt-8 px-4 sm:px-6 lg:px-8 pb-12" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl md:rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-2 min-h-0 md:min-h-[90px] flex flex-col md:flex-row items-stretch md:items-center gap-0" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
          {/* Sport Selector */}
          <div className="relative w-full md:flex-1 px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-100">
            <div 
              className="cursor-pointer"
              onClick={() => setSportOpen(!sportOpen)}
            >
              <label className="block text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Sport</label>
              <div className="flex items-center justify-between text-base text-gray-500">
                <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>{sport ? sportOptions.find(s => s.value === sport)?.label : 'Select a sport'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${sportOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Dropdown */}
            {sportOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                {sportOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSport(option.value);
                      setSportOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-base hover:bg-gray-50 transition-colors ${
                      sport === option.value ? 'text-tomato font-medium' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="w-full md:flex-1 px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Where</label>
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                placeholder="Search venue name, city, or state"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pr-10 text-base text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              />
              <button
                type="button"
                onClick={handleFindNearMe}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-500 hover:text-tomato hover:bg-tomato/10 transition-colors"
                title="Find courts near me"
              >
                <Locate className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Input */}
          <div className="w-full md:flex-1 px-4 py-3 md:py-0">
            <label className="block text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>When</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full text-base text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
              placeholder="Pick a date"
              style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full md:w-auto mx-0 mt-2 md:mx-2 md:mt-0 px-6 py-3 text-base text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: '#F06038', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0552F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F06038'}
          >
            <Search className="w-4 h-4" />
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Search</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookingSearchBar;
