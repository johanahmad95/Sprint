'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { SPORT_INFO, AREA_INFO, SportType, KlangValleyArea } from '@/lib/types';

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

  return (
    <section className="relative z-20 -mt-8 px-4 sm:px-6 lg:px-8 pb-12" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-full shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-2 flex flex-col sm:flex-row items-stretch sm:items-center" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
          {/* Sport Selector */}
          <div className="relative flex-1 px-4 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-100">
            <div 
              className="cursor-pointer"
              onClick={() => setSportOpen(!sportOpen)}
            >
              <label className="block text-xs font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Sport</label>
              <div className="flex items-center justify-between text-sm text-gray-500">
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
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
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
          <div className="flex-1 px-4 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-100">
            <label className="block text-xs font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Where</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search venue name, city, or state"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              />
            </div>
          </div>

          {/* Date Input */}
          <div className="flex-1 px-4 py-3 sm:py-0">
            <label className="block text-xs font-semibold text-gray-800 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>When</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-transparent outline-none"
              placeholder="Pick a date"
              style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="mx-2 my-2 sm:my-0 px-6 py-3 text-white font-semibold rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: '#F06038', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0552F'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F06038'}
          >
            <Search className="w-4 h-4" />
            <span style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Search</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <span className="text-sm text-gray-500">Popular:</span>
          {['Pickleball', 'Padel', 'Tennis', 'Badminton'].map((sport) => (
            <button
              key={sport}
              onClick={() => router.push(`/venues?sport=${sport.toLowerCase()}`)}
              className="text-sm text-gray-600 hover:text-tomato transition-colors"
            >
              {sport}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingSearchBar;
