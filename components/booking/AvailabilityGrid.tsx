'use client';

import { Card3D } from '@/components/ui';

interface TimeSlot {
  time: string;
  isPeak: boolean;
  isBooked: boolean;
}

interface AvailabilityGridProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  timeSlots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  loadingSlots: boolean;
}

export default function AvailabilityGrid({
  selectedDate,
  onDateChange,
  timeSlots,
  selectedSlot,
  onSlotSelect,
  loadingSlots,
}: AvailabilityGridProps) {
  return (
    <Card3D variant="clay" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Available Slots</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700"
          disabled={loadingSlots}
        />
      </div>

      {loadingSlots && (
        <div className="text-center py-4 text-gray-500 text-sm mb-4">
          Checking availability...
        </div>
      )}
      
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {timeSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => !slot.isBooked && onSlotSelect(slot.time)}
            disabled={slot.isBooked}
            className={`p-3 rounded-xl text-sm font-medium transition-all ${
              slot.isBooked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : selectedSlot === slot.time
                ? 'bg-teal-dark text-white shadow-lg'
                : slot.isPeak
                ? 'bg-tomato/10 text-tomato hover:bg-tomato/20'
                : 'bg-chartreuse/20 text-gray-700 hover:bg-chartreuse/30'
            }`}
          >
            {slot.time}
            {slot.isPeak && !slot.isBooked && (
              <span className="block text-xs opacity-70">Peak</span>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex gap-4 mt-4 text-sm">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chartreuse/30" /> Available
        </span>
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-tomato/20" /> Peak Hour
        </span>
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-200" /> Booked
        </span>
      </div>
    </Card3D>
  );
}
