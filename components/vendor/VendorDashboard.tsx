'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useVendorNotification } from '@/contexts/VendorNotificationContext';
import { VendorStats } from './VendorStats';
import { BookingFeed, type BookingFeedItem } from './BookingFeed';
import { VendorTopBar } from './VendorTopBar';

const MAX_BOOKINGS = 20;

interface Venue {
  id: string;
  name: string;
  address?: string | null;
}

interface Court {
  id: string;
  name: string;
  venue_id: string | null;
  is_active?: boolean | null;
  venue_name?: string | null;
}

interface BookingRow {
  id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  user_id?: string | null;
  duration?: number;
  created_at?: string | null;
  profiles?: { full_name: string | null } | null;
  venue_name?: string | null;
  venues?: { name: string } | null;
}

interface VendorDashboardProps {
  userId: string;
  initialCourts: Court[];
  initialVenues: Venue[];
  initialBookings: BookingRow[];
}

export function VendorDashboard({
  userId,
  initialCourts,
  initialVenues,
  initialBookings,
}: VendorDashboardProps) {
  // 2. FIX STATE SEEDING: strictly from server props
  const [courts] = useState<Court[]>(initialCourts);
  const [venues] = useState<Venue[]>(initialVenues);
  const [bookings, setBookings] = useState<BookingRow[]>(
    initialBookings.slice(-MAX_BOOKINGS),
  );

  // Single Supabase client for realtime (avoid creating inside effect)
  const supabase = useMemo(() => createClient(), []);
  const courtIdsRef = useRef<string[]>([]);
  const courtsRef = useRef<Court[]>([]);
  const venuesRef = useRef<Venue[]>([]);
  courtIdsRef.current = courts.map((c) => c.id);
  courtsRef.current = courts;
  venuesRef.current = venues;

  const { addNotification } = useVendorNotification() ?? { addNotification: undefined };

  const venueNameById = useMemo(
    () => new Map(venues.map((v) => [v.id, v.name])),
    [venues],
  );
  const courtVenueById = useMemo(
    () =>
      new Map(
        courts.map((c) => [c.id, (c.venue_id ? venueNameById.get(c.venue_id) : undefined) ?? c.venue_name ?? '']),
      ),
    [courts, venueNameById],
  );

  // Realtime: INSERT for new bookings; onUpdate for bookings so status→cancelled moves card to Cancellations tab immediately
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('vendor-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          const newBooking = payload.new as BookingRow;
          const courtIds = courtIdsRef.current;
          if (!courtIds.includes(newBooking.court_id)) return;

          setBookings((prev) => [newBooking, ...prev].slice(0, MAX_BOOKINGS));

          const court = courtsRef.current.find((c) => c.id === newBooking.court_id);
          const courtName = court?.name ?? 'Court';
          const venueName = court?.venue_id
            ? (venuesRef.current.find((v) => v.id === court.venue_id)?.name ?? court.venue_name ?? 'Venue')
            : (court?.venue_name ?? 'Venue');
          const startTime = newBooking.start_time ? String(newBooking.start_time).substring(0, 5) : '';

          let customerName = 'Customer';
          if (newBooking.user_id) {
            const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', newBooking.user_id).single();
            customerName = (profile?.full_name ?? '').trim() || 'Customer';
          }
          const message = startTime
            ? `New booking: ${venueName} - ${courtName} for ${customerName} at ${startTime}`
            : `New booking: ${venueName} - ${courtName} for ${customerName}`;

          if (addNotification) {
            addNotification(
              {
                id: `local-${newBooking.id}-${Date.now()}`,
                message,
                is_read: false,
                created_at: new Date().toISOString(),
                booking_date: newBooking.booking_date ?? undefined,
              },
              newBooking.id
            );
          }
          toast.success("New Booking Received!", { description: message });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const row = payload.new as Partial<BookingRow> & { id?: string };
          if (!row?.id) return;

          const newStatus = row.status != null ? String(row.status).trim().toLowerCase() : '';

          setBookings((prev) =>
            prev.map((b) =>
              b.id === row.id
                ? {
                    ...b,
                    ...row,
                    status: newStatus,
                    court_id: row.court_id ?? b.court_id,
                    profiles: b.profiles ?? row.profiles ?? null,
                    venues: b.venues ?? row.venues ?? null,
                  }
                : b
            )
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, addNotification]);

  // 1. DATA VALIDATION: no userId = session still loading
  if (!userId) {
    return <div className="p-6 text-sm text-gray-600">Loading session...</div>;
  }

  // 4. ERROR BOUNDARY: distinguish auth vs data error
  if (courts.length === 0) {
    return (
      <div className="p-6 text-sm text-amber-700">
        No data received from server. Check that courts are linked to your vendor account.
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const validBookings = bookings.filter((b) => b.status !== 'cancelled');
  const revenueBookings = validBookings.filter((b) =>
    ['paid', 'confirmed', 'completed'].includes(b.status),
  );
  const totalRevenue = revenueBookings.reduce(
    (sum, b) => sum + Number(b.total_price || 0),
    0,
  );
  const activeBookingsToday = validBookings.filter(
    (b) =>
      b.booking_date === today &&
      ['pending', 'confirmed', 'paid'].includes(b.status),
  ).length;
  const totalSlotsToday = courts.length * 17;
  const occupancyRate =
    totalSlotsToday > 0 ? (activeBookingsToday / totalSlotsToday) * 100 : 0;

  const feedItems: BookingFeedItem[] = [...bookings]
    .sort((a, b) => {
      const aAt = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bAt = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bAt - aAt;
    })
    .slice(0, 24)
    .map((b) => {
      const courtName = courts.find((c) => c.id === b.court_id)?.name ?? 'Court';
      const court = courts.find((c) => c.id === b.court_id);
      const venueByVenueId = court ? venues.find((v) => v.id === court.venue_id)?.name : null;
      const venueName = (b.venues?.name ?? b.venue_name ?? venueByVenueId ?? courtVenueById.get(b.court_id))?.trim() || 'Unknown Venue';
      const venue = court ? venues.find((v) => v.id === court.venue_id) : null;
      const address = venue?.address?.trim() || '';
      const duration =
        typeof b.duration === 'number'
          ? b.duration
          : Number(b.duration) || parseFloat(String(b.duration)) || 1;
      const customerName = (b.profiles?.full_name ?? '')?.trim() || 'Guest';
      const normalizedStatus =
        (b.status && String(b.status).trim().toLowerCase()) || '';
      return {
        id: b.id,
        customerName,
        courtName,
        venueName,
        address,
        startTime: b.start_time,
        bookingDate: b.booking_date,
        duration: Number.isFinite(duration) ? duration : 1,
        status: normalizedStatus,
        created_at: b.created_at ?? null,
      };
    });

  return (
    <div className="space-y-8">
      <VendorTopBar pageTitle="Dashboard" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time updates on your courts and revenue.
          </p>
        </div>
      </div>

      <VendorStats
        totalRevenue={totalRevenue}
        activeBookingsToday={activeBookingsToday}
        occupancyRate={occupancyRate}
      />

      {/* Recent activity / transactions feed */}
      <div className="grid gap-6">
        <BookingFeed items={feedItems} />
      </div>
    </div>
  );
}
