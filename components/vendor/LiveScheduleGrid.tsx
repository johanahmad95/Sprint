'use client';

import { cn } from '@/lib/utils';

export interface ScheduleBooking {
  id: string;
  courtId: string;
  courtName: string;
  venueName: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
}

export interface LiveScheduleGridProps {
  bookings: ScheduleBooking[];
  courts: { id: string; name: string; venueName: string }[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hourInRange(hour: number, start: string, end: string): boolean {
  const startM = parseTime(start);
  const endM = parseTime(end);
  const cellStart = hour * 60;
  const cellEnd = (hour + 1) * 60;
  return cellStart < endM && cellEnd > startM;
}

export function LiveScheduleGrid({
  bookings,
  courts,
  selectedDate,
  onDateChange,
}: LiveScheduleGridProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  return (
    <div
      className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-gray-900">Live Schedule</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-gray-700 focus:border-[#8C9EFF] focus:outline-none focus:ring-1 focus:ring-[#8C9EFF]"
        />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[140px_repeat(17,minmax(0,1fr))] gap-px border-b border-slate-100 pb-2">
            <div className="text-xs font-medium text-gray-500">Court</div>
            {HOURS.map((h) => (
              <div key={h} className="text-center text-xs font-medium text-gray-500">
                {h}:00
              </div>
            ))}
          </div>

          {courts.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">No courts</div>
          ) : (
            courts.map((court) => (
              <div
                key={court.id}
                className="grid grid-cols-[140px_repeat(17,minmax(0,1fr))] gap-px border-b border-slate-50 py-1.5 items-center"
              >
                <div className="truncate text-sm font-medium text-gray-800">
                  {court.name}
                  <span className="ml-1 text-xs font-normal text-gray-400">({court.venueName})</span>
                </div>
                {HOURS.map((h) => {
                  const booking = bookings.find(
                    (b) =>
                      b.courtId === court.id &&
                      hourInRange(h, b.startTime, b.endTime)
                  );
                  if (booking) {
                    return (
                      <div
                        key={`${court.id}-${h}`}
                        className={cn(
                          'flex h-9 items-center justify-center rounded px-1 py-0.5 text-xs font-medium text-white',
                          booking.isLive ? 'bg-[#F06038]' : 'bg-[#8C9EFF]'
                        )}
                        title={`${booking.startTime.slice(0, 5)}–${booking.endTime.slice(0, 5)}${booking.isLive ? ' • Live' : ''}`}
                      >
                        {booking.isLive && h === Math.floor(parseTime(booking.startTime) / 60) ? 'Live' : '•'}
                      </div>
                    );
                  }
                  return (
                    <div key={`${court.id}-${h}`} className="h-9 rounded bg-slate-50" />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#8C9EFF]" /> Booked
        </span>
        {isToday && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#F06038]" /> Live
          </span>
        )}
      </div>
    </div>
  );
}
