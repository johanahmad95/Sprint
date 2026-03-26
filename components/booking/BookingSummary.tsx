'use client';

import { useState, useCallback } from 'react';
import { Button3D, Card3D } from '@/components/ui';
import { formatPrice } from '@/lib/types';

const DURATION_PRESETS = [1, 2, 3, 4] as const;
const MIN_DURATION = 1;
const MAX_DURATION = 12;

interface Court {
  id: string;
  name: string;
  hourlyRate: number;
  peakRate: number;
}

interface BookingSummaryProps {
  court: Court;
  selectedDate: string;
  selectedSlot: string | null;
  duration: number;
  onDurationChange: (duration: number) => void;
  totalPrice: number;
  onBooking: () => void;
  isBooking: boolean;
  bookingError: string | null;
  bookingSuccess: boolean;
  user: any;
}

export default function BookingSummary({
  court,
  selectedDate,
  selectedSlot,
  duration,
  onDurationChange,
  totalPrice,
  onBooking,
  isBooking,
  bookingError,
  bookingSuccess,
  user,
}: BookingSummaryProps) {
  const [customInput, setCustomInput] = useState('');

  const handleDurationFromInput = useCallback(
    (value: string) => {
      setCustomInput(value);
      const num = parseFloat(value);
      if (!Number.isNaN(num) && num >= MIN_DURATION) {
        const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, num));
        onDurationChange(clamped);
      }
    },
    [onDurationChange]
  );

  const handlePresetClick = (d: number) => {
    setCustomInput('');
    onDurationChange(d);
  };

  return (
    <div className="sticky top-24">
      <Card3D variant="glass" padding="lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Book This Court</h3>
        
        {/* Pricing */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Standard Rate</span>
            <span className="font-semibold text-gray-800">
              {formatPrice(court.hourlyRate)}/hr
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Peak Rate (6-9pm)</span>
            <span className="font-semibold text-tomato">
              {formatPrice(court.peakRate)}/hr
            </span>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Duration
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handlePresetClick(d)}
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all min-w-[3rem] ${
                  duration === d && !customInput
                    ? 'bg-teal-dark text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                value={customInput || (DURATION_PRESETS.includes(duration as 1 | 2 | 3 | 4) ? '' : String(duration))}
                onChange={(e) => handleDurationFromInput(e.target.value)}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v === '') return;
                  const num = parseFloat(v);
                  if (Number.isNaN(num) || num < MIN_DURATION) {
                    setCustomInput('');
                    onDurationChange(1);
                  } else {
                    const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, num));
                    setCustomInput(String(clamped));
                    onDurationChange(clamped);
                  }
                }}
                className="w-16 py-2 px-2 rounded-xl text-sm font-medium text-center border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-dark/30 focus:border-teal-dark [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Selected Summary */}
        {selectedSlot && (
          <div className="mb-6 p-4 rounded-xl bg-chartreuse/10">
            <p className="text-sm text-gray-600 mb-1">Selected:</p>
            <p className="font-semibold text-gray-800">
              {selectedDate} at {selectedSlot}
            </p>
            <p className="text-sm text-gray-600">{duration} hour(s)</p>
          </div>
        )}

        {/* Total RM = Duration × Hourly Rate (standard or peak) */}
        <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
          <span className="text-lg font-semibold text-gray-800">Total RM</span>
          <span className="text-2xl font-bold text-teal-dark">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {/* Error Message */}
        {bookingError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 font-semibold">Booking confirmed! Redirecting...</p>
          </div>
        )}

        {/* Book Button */}
        <Button3D 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={onBooking}
          disabled={!selectedSlot || isBooking}
          isLoading={isBooking}
        >
          {isBooking ? 'Creating Booking...' : selectedSlot ? 'Confirm Booking' : 'Select a Time Slot'}
        </Button3D>

        {!user && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Please sign in to make a booking
          </p>
        )}
        {user && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Single payment • No split bills • Instant confirmation
          </p>
        )}
      </Card3D>
    </div>
  );
}
