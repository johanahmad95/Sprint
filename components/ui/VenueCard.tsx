'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin, Car, ShowerHead, Check } from 'lucide-react';
import Badge3D from './Badge3D';
import { Venue, Court, SPORT_INFO, formatPrice, AREA_INFO } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  court: Court;
  variant?: 'standard' | 'featured';
}

const VenueCard = ({ venue, court, variant = 'standard' }: VenueCardProps) => {
  const [tiltStyle, setTiltStyle] = useState({ transform: '' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant === 'featured') return; // Disable tilt for featured card? Or keep it? User didn't say. Keeping it is fine.
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale(1.02)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: '' });
  };

  const sportInfo = SPORT_INFO[court.sport] || { label: court.sport, icon: 'racquet', color: '#4CAF50' };

  const AMENITY_ICONS: Record<string, JSX.Element> = {
    Parking: <Car className="w-3 h-3" />,
    Showers: <ShowerHead className="w-3 h-3" />,
  };

  const normalizeTime = (value: string) => {
    const v = (value || '').trim();
    if (!v) return '';
    // Accept "00:00", "00:00:00", "0:00", etc. and normalize to "HH:MM"
    const parts = v.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return v;
  };

  const openNorm = normalizeTime(venue.operatingHours.open);
  const closeNorm = normalizeTime(venue.operatingHours.close);
  const isAlwaysOpen = openNorm === '00:00' && (closeNorm === '23:59' || closeNorm === '24:00');

  const imageHeight = variant === 'featured' ? 'h-72 md:h-96' : 'h-48';

  // Use local static assets as the final fallback so cards are never blank,
  // even if remote URLs or Supabase data are missing.
  const defaultImage =
    court.sport === 'pickleball'
      ? '/what_is_pickleball.webp'
      : '/courts/tennis.jpg';

  const firstCourtImage =
    Array.isArray(court.image_url) && court.image_url.length > 0
      ? court.image_url.find((u) => typeof u === 'string' && u.trim().length > 0)
      : undefined;

  const firstVenueImage =
    Array.isArray(venue.images) && venue.images.length > 0
      ? venue.images.find((u) => typeof u === 'string' && u.trim().length > 0)
      : undefined;

  const imageSrc = firstCourtImage || firstVenueImage || defaultImage;

  return (
    <div
      className={`group relative bg-white rounded-3xl overflow-hidden 
        shadow-sm hover:shadow-md
        transition-all duration-300 ease-out transform-gpu flex flex-col h-full border border-gray-100`}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <div 
        className={`relative ${imageHeight} overflow-hidden`}
      >
        <Image
          src={imageSrc}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Sport Badge - Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <Badge3D variant="sport" color="teal" size="sm">
            {sportInfo.label.toUpperCase()}
          </Badge3D>
        </div>

        {/* 24/7 Badge - Top Right */}
        {isAlwaysOpen && (
          <div className="absolute top-4 right-4 z-10">
            <Badge3D variant="soft" color="tomato" size="sm">
              24/7
            </Badge3D>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <Link href={`/venues/${venue.slug || venue.id}`} className="block">
          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 hover:text-teal-700 transition-colors">
            {venue.name}
          </h3>
          
          <div className="flex flex-col gap-1 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{venue.operatingHours.days}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-1">
                {venue.location ||
                  venue.address ||
                  (venue.area && AREA_INFO[venue.area]?.label) ||
                  'Location Available Soon'}
              </span>
            </div>
          </div>

          {Array.isArray((court as any).amenities ?? venue.amenities) &&
            ((court as any).amenities ?? venue.amenities).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Array.from(
                new Set<string>(
                  (((court as any).amenities as string[] | undefined) ??
                    venue.amenities ??
                    []) as string[],
                ),
              )
                .slice(0, 4)
                .map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-600 border border-gray-100"
                >
                  {AMENITY_ICONS[amenity] ?? <Check className="w-3 h-3" />}
                  <span className="truncate max-w-[5rem]">{amenity}</span>
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Price & Action */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500">RM</span>
              <span className="text-2xl font-bold text-teal-700">
                {court.hourlyRate.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">/hour</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Peak hours</p>
            <p className="text-sm font-medium text-gray-500">
              RM {court.peakRate.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
