'use client';

import { TrendingUp, TrendingDown, Calendar, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnalyticsCardsProps {
  totalEarnings: number;
  earningsTrend: number;
  bookingCount: number;
  capacityPercent: number;
  liveNow: number;
}

export function AnalyticsCards({
  totalEarnings,
  earningsTrend,
  bookingCount,
  capacityPercent,
  liveNow,
}: AnalyticsCardsProps) {
  const cardBase =
    'rounded-lg border border-slate-100 bg-white p-5 shadow-sm flex flex-col gap-2';

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      {/* Total Earnings */}
      <div className={cn(cardBase)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Earnings</span>
          {earningsTrend !== 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                earningsTrend > 0 ? 'text-[#D6F74C]' : 'text-gray-400'
              )}
            >
              {earningsTrend > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {earningsTrend > 0 ? '+' : ''}
              {earningsTrend}%
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold text-gray-900">
          RM {totalEarnings.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400">vs last month</p>
      </div>

      {/* Booking Count */}
      <div className={cn(cardBase)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Booking Count</span>
          <Calendar className="h-4 w-4 text-[#8C9EFF]" strokeWidth={2} />
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{bookingCount}</p>
        <p className="text-xs text-gray-400">confirmed + pending</p>
      </div>

      {/* Capacity */}
      <div className={cn(cardBase)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Capacity</span>
          <BarChart3 className="h-4 w-4 text-[#8C9EFF]" strokeWidth={2} />
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{Math.round(capacityPercent)}%</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#8C9EFF] transition-all duration-300"
            style={{ width: `${Math.min(100, capacityPercent)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">today</p>
      </div>

      {/* Live Now */}
      <div className={cn(cardBase)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Live Now</span>
          <Zap className="h-4 w-4 text-[#F06038]" strokeWidth={2} />
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{liveNow}</p>
        <p className="text-xs text-gray-400">ongoing bookings</p>
      </div>
    </div>
  );
}
