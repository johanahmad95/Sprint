'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Booking, BookingStatus } from '@/lib/types';
import { Navbar, Footer } from '@/components/layout';
import { Calendar, MapPin, Clock, Users, X, CheckCircle, XCircle, AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface BookingWithDetails extends Omit<Booking, 'court' | 'venue'> {
  court: {
    id: string;
    name: string;
    sport: string;
  };
  venue: {
    id: string;
    name: string;
    address: string;
    area: string;
    location?: string;
  };
  venues?: { name: string; address?: string };
  /** Court + venue display (address from joined venues table) */
  courts?: { venue_name?: string; address?: string };
}

type BookingsPageProps = {
  params?: Promise<{ id?: string }>;
};

export default function BookingsPage({ params }: BookingsPageProps) {
  const resolvedParams = React.use(params ?? Promise.resolve({})) as { id?: string };
  const id = resolvedParams?.id;
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const lastFailedBookingIdRef = useRef<string | null>(null);

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar />
        <div className="pt-20 pb-32 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                Supabase Configuration Required
              </h2>
              <p className="text-gray-700 mb-6" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                To use the bookings page, please configure your Supabase environment variables.
              </p>
              <div className="bg-white rounded-lg p-6 text-left mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                  Create a <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file in your project root with:
                </p>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
                </pre>
                <p className="text-sm text-gray-600 mt-4" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                  Get these values from your Supabase dashboard: <strong>Project Settings → API</strong>
                </p>
              </div>
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tomato text-white font-semibold rounded-full hover:bg-tomato-dark transition-colors"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              >
                Open Supabase Dashboard
              </a>
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </main>
    );
  }

  const supabase = createClient();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your bookings.');
        setLoading(false);
        return;
      }

      // Step 1: Fetch bookings with courts only (no nested venues to avoid "more than one relationship")
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts!court_id (
            id,
            name,
            sport,
            venue_id
          )
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;

      const rows = (bookingsData ?? []) as any[];
      const venueIds = [...new Set(rows.map((b) => (b.courts?.venue_id ?? b.venue_id) as string).filter(Boolean))] as string[];

      // Step 2: Fetch venue name and address by venue_id (separate query, no join ambiguity)
      let venueById = new Map<string, { name: string; address: string }>();
      if (venueIds.length > 0) {
        const { data: venuesData } = await supabase
          .from('venues')
          .select('id, name, address')
          .in('id', venueIds);
        (venuesData ?? []).forEach((v: any) => {
          venueById.set(v.id, { name: v.name ?? '', address: v.address ?? '' });
        });
      }

      const transformedBookings: BookingWithDetails[] = rows.map((booking: any) => {
        const c = booking.courts ?? booking.court_id;
        const venueId = (typeof c === 'object' && c?.venue_id) ? c.venue_id : (booking.venue_id ?? '');
        const venueInfo = venueById.get(venueId) ?? { name: 'Unknown Venue', address: '' };
        const venueName = venueInfo.name || 'Unknown Venue';
        const venueAddress = venueInfo.address ?? '';
        const courtId = (typeof c === 'object' && c?.id) ? c.id : '';
        const courtName = (typeof c === 'object' && c?.name) ? c.name : 'Unknown Court';
        const courtSport = (typeof c === 'object' && c?.sport) ? c.sport : '';
        return {
          id: booking.id,
          userId: booking.user_id,
          courtId: booking.court_id,
          bookingDate: booking.booking_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          duration: parseFloat(booking.duration),
          playerCount: booking.player_count,
          totalPrice: parseFloat(booking.total_price),
          status: booking.status as BookingStatus,
          createdAt: booking.created_at,
          court: { id: courtId, name: courtName, sport: courtSport },
          venue: {
            id: venueId,
            name: venueName,
            address: venueAddress,
            area: '',
            location: venueAddress || undefined,
          },
          venues: { name: venueName, address: venueAddress },
          courts: c ? { venue_name: venueName, address: venueAddress } : undefined,
        };
      });

      setBookings(transformedBookings);
    } catch (error: any) {
      const msg = error?.message ?? (typeof error === 'string' ? error : 'Unknown error');
      const details = error?.details ?? error?.hint ?? (error && typeof error === 'object' ? JSON.stringify(error) : '');
      console.error('Error loading bookings:', msg, details, error);
      setError(msg || 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiateCancel = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (overrideId?: string) => {
    const bookingId = overrideId ?? id ?? bookingToCancel;
    if (!bookingId) {
      console.warn('handleConfirmCancel: bookingId is undefined');
      return;
    }

    setIsCancelling(true);

    try {
      // Update status to 'cancelled' (triggers vendor Realtime: bell notification + Cancellations tab)
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select('id, status')
        .maybeSingle();

      if (error) throw error;
      const updatedStatus = (data as { status?: string } | null)?.status?.toLowerCase?.();
      if (!data || updatedStatus !== 'cancelled') {
        throw new Error(
          'Booking could not be cancelled. Run Supabase migrations so users can cancel their own bookings (migration: 20260216000003_users_can_cancel_own_bookings.sql).'
        );
      }

      lastFailedBookingIdRef.current = null;
      setBookingToCancel(null);
      // Only remove from Upcoming once the database confirms success (moves to Past)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
        )
      );
      setIsCancelModalOpen(false);
      loadBookings();
    } catch (err) {
      console.error('Full error:', err);
      lastFailedBookingIdRef.current = bookingId;
      setIsErrorModalOpen(true);
      setIsCancelModalOpen(false);
      // Do NOT remove from UI on error – booking stays in Upcoming
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryCancel = () => {
    setIsErrorModalOpen(false);
    const idToRetry = lastFailedBookingIdRef.current ?? bookingToCancel;
    if (idToRetry) {
      handleConfirmCancel(idToRetry);
    } else {
      console.warn('Try Again: bookingId is undefined, cannot retry');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:mm format
  };

  const formatSport = (sport: string) => {
    return sport.charAt(0).toUpperCase() + sport.slice(1);
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      cancelled: XCircle,
      completed: CheckCircle,
    };

    const Icon = icons[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const now = new Date();
  const upcomingBookings = bookings.filter((booking) => {
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    return bookingDateTime >= now && booking.status !== 'cancelled' && booking.status !== 'completed';
  });

  const pastBookings = bookings.filter((booking) => {
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    return bookingDateTime < now || booking.status === 'cancelled' || booking.status === 'completed';
  });

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar />
        <div className="pt-20 pb-32 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tomato mx-auto mb-4"></div>
              <p className="text-gray-600" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>Loading your bookings...</p>
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar />
        <div className="pt-20 pb-32 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                Error Loading Bookings
              </h2>
              <p className="text-gray-700 mb-6" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                {error}
              </p>
              {error.includes('sign in') && (
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-tomato text-white font-semibold rounded-full hover:bg-tomato-dark transition-colors"
                  style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="pt-20 pb-32 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-600">View and manage your court bookings</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-teal-dark transition-colors rounded-full bg-white/80 border border-gray-200 hover:border-teal-dark"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </div>
          </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'upcoming'
                ? 'border-tomato text-tomato'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Upcoming Bookings ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'past'
                ? 'border-tomato text-tomato'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Past Bookings ({pastBookings.length})
          </button>
        </div>

        {/* Bookings List */}
        {displayedBookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming bookings. Book a court to get started!"
                : "You don't have any past bookings yet."}
            </p>
            {activeTab === 'upcoming' && (
              <a
                href="/venues"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tomato text-white font-semibold rounded-full hover:bg-tomato-dark transition-colors"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
              >
                Browse Courts
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {displayedBookings.map((booking) => {
              const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
              const canCancel = activeTab === 'upcoming' && (booking.status === 'pending' || booking.status === 'confirmed');

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left Section - Booking Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                            {booking.courts?.venue_name || 'Prestige pickle'}
                          </h3>
                          <p className="text-sm text-gray-600">{booking.court.name} - {formatSport(booking.court.sport)}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-700">
                          <Calendar className="w-5 h-5 text-tomato flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                              {formatDate(booking.bookingDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <Clock className="w-5 h-5 text-tomato flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="font-semibold" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <Users className="w-5 h-5 text-tomato flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Players</p>
                            <p className="font-semibold" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                              {booking.playerCount}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <MapPin className="w-5 h-5 text-tomato flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                              {booking.courts?.address || 'Address not found'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                            RM {booking.totalPrice.toFixed(2)}
                          </span>
                          {' '}for {booking.duration} {booking.duration === 1 ? 'hour' : 'hours'}
                        </p>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    {canCancel && (
                      <div className="lg:pl-6 lg:border-l border-gray-200">
                        <button
                          onClick={() => initiateCancel(booking.id)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-full hover:bg-red-100 transition-colors border border-red-200"
                          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
                        >
                          <X className="w-4 h-4" />
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
      
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="bg-white rounded-3xl shadow-xl border-none max-w-md p-8 sm:p-10 [&>button]:hidden">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-semibold text-slate-800 mb-2">
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => handleConfirmCancel()}
              disabled={isCancelling}
              className="w-full py-3.5 rounded-2xl bg-[#F3C5B5] text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-70 disabled:pointer-events-none"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
            <button
              onClick={() => !isCancelling && setIsCancelModalOpen(false)}
              disabled={isCancelling}
              className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-base hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:pointer-events-none"
            >
              Keep Booking
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="bg-white rounded-3xl shadow-xl border-none max-w-md p-8 sm:p-10 [&>button]:hidden">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-semibold text-slate-800 mb-2">
              Cancellation Failed
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              We couldn&apos;t cancel your booking. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleRetryCancel}
              className="w-full py-3.5 rounded-2xl bg-[#F3C5B5] text-white font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-base hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
