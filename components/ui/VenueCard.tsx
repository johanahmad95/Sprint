'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, MapPin } from 'lucide-react';
import Badge3D from './Badge3D';
import { Venue, Court, SPORT_INFO, formatPrice } from '@/lib/types';

interface VenueCardProps {
  venue: Venue;
  court: Court;
}

const VenueCard = ({ venue, court }: VenueCardProps) => {
  const [tiltStyle, setTiltStyle] = useState({ transform: '' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const sportInfo = SPORT_INFO[court.sport];

  return (
    <Link href={`/venues/${venue.id}`}>
      <div
        className="group relative bg-white rounded-3xl overflow-hidden 
          shadow-[8px_8px_20px_rgba(0,0,0,0.08),-4px_-4px_16px_rgba(255,255,255,0.9)]
          transition-all duration-300 ease-out cursor-pointer transform-gpu"
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={venue.images[0] || '/courts/tennis.jpg'}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Rating Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-gray-800">
              {venue.rating.toFixed(1)}
            </span>
          </div>

          {/* Sport Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge3D variant="sport" color="teal" size="sm">
              {sportInfo.label}
            </Badge3D>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-tomato transition-colors">
            {venue.name}
          </h3>
          
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {venue.description}
          </p>

          {/* Info Row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {venue.operatingHours.days}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {venue.location}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-teal-dark">
                {formatPrice(court.hourlyRate)}
              </span>
              <span className="text-sm text-gray-500">/hour</span>
            </div>
            
            {court.peakRate > court.hourlyRate && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Peak hours</p>
                <p className="text-sm font-semibold text-gray-600">
                  {formatPrice(court.peakRate)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VenueCard;
