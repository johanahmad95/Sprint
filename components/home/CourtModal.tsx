'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Clock, Star, Check, Users, Wifi, Car, Dumbbell, Coffee } from 'lucide-react';
import { Button3D, Badge3D, Card3D } from '@/components/ui';
import { Venue, Court, SPORT_INFO, formatPrice } from '@/lib/types';

// Amenity icons mapping
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Parking': <Car className="w-4 h-4" />,
  'Showers': <Dumbbell className="w-4 h-4" />,
  'Pro Shop': <Dumbbell className="w-4 h-4" />,
  'Cafe': <Coffee className="w-4 h-4" />,
  'Coaching': <Users className="w-4 h-4" />,
  'Equipment Rental': <Dumbbell className="w-4 h-4" />,
  'Air-Con': <Wifi className="w-4 h-4" />,
  'Lockers': <Dumbbell className="w-4 h-4" />,
  'Canteen': <Coffee className="w-4 h-4" />,
};

interface CourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { venue: Venue; court: Court } | null;
}

const DURATION_PRESETS = [1, 2, 3, 4] as const;
const MIN_DURATION = 1;
const MAX_DURATION = 12;

const CourtModal = ({ isOpen, onClose, data }: CourtModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [duration, setDuration] = useState(1);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setImageIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;
  if (!data) return null;

  const { venue, court } = data;
  const sportInfo = SPORT_INFO[court.sport] || { label: court.sport, icon: 'racquet', color: '#4CAF50' };

  const imageUrls = court.image_url && court.image_url.length > 0 ? court.image_url : venue.images;
  const mainImage = imageUrls?.[imageIndex] ?? imageUrls?.[0] ?? '/courts/tennis.jpg';
  const hasImageGallery = Array.isArray(imageUrls) && imageUrls.length > 1;

  const handleSelectTimeSlot = () => {
    window.location.href = `/venues/${court.id}?duration=${duration}`;
  };

  // Total RM = Duration × Hourly Rate (standard rate used in modal; peak applied on venue page)
  const totalPrice = duration * court.hourlyRate;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 flex flex-col md:flex-row max-h-[90vh] ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors shadow-sm backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Left Side: Content */}
        <div className="w-full md:w-2/3 overflow-y-auto bg-white">
          {/* Hero Image */}
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={mainImage}
              alt={venue.name}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge3D variant="sport" color="teal" size="md">
                {sportInfo.label}
              </Badge3D>
            </div>
            {(venue.rating ?? 0) > 0 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-gray-800">
                  {(venue.rating ?? 0).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail gallery when court has multiple images */}
          {hasImageGallery && imageUrls && (
            <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-100">
              {imageUrls.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    imageIndex === idx ? 'border-teal-dark ring-2 ring-teal-dark/30' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${venue.name} image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="p-6 md:p-8 space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{venue.location}</span>
              </div>
            </div>

            {/* About */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">About This Venue</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {venue.description}
              </p>
            </section>

            {/* Operating Hours */}
            <section>
              <div className="flex items-center gap-2 text-gray-800 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-teal-dark" />
                <span className="font-semibold">Operating Hours:</span>
                <span className="text-gray-600">
                  {venue.operatingHours.open} - {venue.operatingHours.close} ({venue.operatingHours.days})
                </span>
              </div>
            </section>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      {AMENITY_ICONS[amenity] || <Check className="w-4 h-4 text-teal-600" />}
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Side: Booking Widget */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 md:p-8 border-l border-gray-100 flex flex-col overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-0">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Book This Court</h3>

            {/* Pricing */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Standard Rate</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(court.hourlyRate)}/hr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Peak Rate</span>
                <span className="font-bold text-tomato">
                  {formatPrice(court.peakRate)}/hr
                </span>
              </div>
            </div>

            {/* Duration: 1hr, 2hr, 3hr, 4hr + key-in custom hours */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Duration
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuration(d);
                      setCustomDurationInput('');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border min-w-[3rem] ${
                      duration === d && !customDurationInput
                        ? 'bg-teal-dark text-white border-teal-dark shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-teal-dark hover:text-teal-dark'
                    }`}
                  >
                    {d}hr
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 whitespace-nowrap">Key in:</span>
                  <input
                    type="number"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    step={1}
                    placeholder="hrs"
                    value={customDurationInput || (DURATION_PRESETS.includes(duration as 1 | 2 | 3 | 4) ? '' : String(duration))}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDurationInput(val);
                      const num = parseFloat(val);
                      if (!Number.isNaN(num) && num >= MIN_DURATION) {
                        const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, num));
                        setDuration(clamped);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '') return;
                      const num = parseFloat(val);
                      if (Number.isNaN(num) || num < MIN_DURATION) {
                        setCustomDurationInput('');
                        setDuration(1);
                      } else {
                        const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, num));
                        setCustomDurationInput(String(clamped));
                        setDuration(clamped);
                      }
                    }}
                    className="w-16 py-2.5 px-2 rounded-xl text-sm font-medium text-center border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-dark/30 focus:border-teal-dark [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Total RM */}
            <div className="flex justify-between items-center mb-6 py-3 border-t border-b border-gray-200">
              <span className="text-base font-semibold text-gray-800">Total RM</span>
              <span className="text-xl font-bold text-teal-dark">{formatPrice(totalPrice)}</span>
            </div>

            {/* Action */}
            <Button3D 
              variant="primary" 
              size="lg" 
              fullWidth
              onClick={handleSelectTimeSlot}
            >
              Select a Time Slot
            </Button3D>

            <p className="text-xs text-center text-gray-400 mt-4">
              You&apos;ll be redirected to complete your booking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtModal;
