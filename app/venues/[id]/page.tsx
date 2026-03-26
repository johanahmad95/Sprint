'use client';

import { useState, use, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { Button3D, Card3D, Badge3D } from '@/components/ui';
import { 
  MapPin, Clock, Star, Phone, Mail, 
  ChevronLeft, ChevronRight, Check, Users,
  Calendar, Wifi, Car, Dumbbell, Coffee, ShowerHead
} from 'lucide-react';
import { MOCK_VENUES, MOCK_COURTS } from '@/lib/mock-data';
import { formatPrice, SPORT_INFO } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

// Amenity icons mapping
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Parking': <Car className="w-4 h-4" />,
  'Showers': <ShowerHead className="w-4 h-4" />,
  'Pro Shop': <Dumbbell className="w-4 h-4" />,
  'Cafe': <Coffee className="w-4 h-4" />,
  'Coaching': <Users className="w-4 h-4" />,
  'Equipment Rental': <Dumbbell className="w-4 h-4" />,
  'Air-Con': <Wifi className="w-4 h-4" />,
  'Lockers': <Dumbbell className="w-4 h-4" />,
  'Canteen': <Coffee className="w-4 h-4" />,
};

// Helpers for dynamic time slot generation
const parseTimeToMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const parts = v.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const formatMinutesToHHMM = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Generate base time slots structure based on dynamic opening/closing hours
const generateTimeSlots = (opening: string | null | undefined, closing: string | null | undefined) => {
  const openMin = parseTimeToMinutes(opening);
  const closeMin = parseTimeToMinutes(closing);

  // Fallback to 06:00–22:00 if invalid
  const defaultStart = 6 * 60;
  const defaultEnd = 22 * 60;

  let start = openMin ?? defaultStart;
  let end = closeMin ?? defaultEnd;

  // If closing time is before or equal opening, fallback to default range
  if (end <= start) {
    start = defaultStart;
    end = defaultEnd;
  }

  // Clamp within 0–24h
  start = Math.max(0, Math.min(start, 24 * 60));
  end = Math.max(start + 60, Math.min(end, 24 * 60)); // ensure at least 1 hour

  // Special handling for 24h courts: 00:00 to 23:59:59 → 24 one-hour slots
  const is24h = start === 0 && end >= (23 * 60 + 59);
  if (is24h) {
    start = 0;
    end = 24 * 60;
  }

  const slots: { time: string; isPeak: boolean; isBooked: boolean }[] = [];
  const startHour = Math.floor(start / 60);
  const endHour = Math.ceil(end / 60);

  for (let hour = startHour; hour < endHour; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    // Peak hours: 18:00–21:00 (6pm–9pm). If later you store peak ranges in DB, wire them here.
    const isPeak = hour >= 18 && hour <= 21;
    slots.push({ time, isPeak, isBooked: false });
  }

  return slots;
};

type DbCourt = {
  id: string;
  name: string;
  venue_name?: string | null;
  sport?: string | null;
  opening_hour?: string | null;
  closing_hour?: string | null;
  hourly_rate?: number | null;
  peak_rate?: number | null;
  amenities?: string[] | null;
  image?: string[] | null;
  image_url?: string[] | null;
  description?: string | null;
  address?: string | null;
};

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  console.log('Current URL ID:', id);
  // Use local date (getFullYear/getMonth/getDate) so today shows correctly in Malaysia (GMT+8).
  // toISOString() uses UTC and can show the previous day before 8am MYT.
  const getTodayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayLocal);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [dbCourt, setDbCourt] = useState<DbCourt | null>(null);
  const [dbVenue, setDbVenue] = useState<any>(null); // Venue details
  const [courtError, setCourtError] = useState<string | null>(null);
  const [courtLoading, setCourtLoading] = useState(true);
  const [venueCourts, setVenueCourts] = useState<DbCourt[]>([]);
  const [venueCourtsLoading, setVenueCourtsLoading] = useState(false);

  const venue = MOCK_VENUES.find(v => v.id === id);
  const courts = MOCK_COURTS.filter(c => c.venueId === id);
  const [selectedCourt, setSelectedCourt] = useState(courts[0]);
  const [selectedDbCourt, setSelectedDbCourt] = useState<DbCourt | null>(null);
  const [timeSlots, setTimeSlots] = useState(generateTimeSlots(null, null));
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch the venue and its courts by venue ID
  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const supabase = createClient();

        console.log('VenueDetailPage: fetching venue for param:', id);
        
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        // 1. Fetch Venue Details (by id or by slug when param looks like a slug, e.g. prestige-pickle)
        let venueData: any = null;
        let venueError: any = null;
        if (isUuid) {
          const r = await supabase.from('venues').select('*').eq('id', id).single();
          venueData = r.data;
          venueError = r.error;
        } else {
          const r = await supabase.from('venues').select('*').eq('slug', id).single();
          venueData = r.data;
          venueError = r.error;
        }

        console.log('VenueDetailPage: Supabase venue result:', {
          isUuid,
          idOrSlug: id,
          data: venueData,
          error: venueError,
        });

        if (venueError || !venueData) {
          if (venueError?.code !== 'PGRST116') {
            console.warn('Venue fetch:', venueError?.message ?? venueError?.code ?? venueError);
          }
          const { data: courtData, error: courtError } = await supabase
            .from('courts')
            .select('*')
            .eq('id', id)
            .single();
            
          if (courtError || !courtData) {
             console.warn('VenueDetailPage: neither venue nor court found for id/slug:', id, {
               venueError,
               courtError,
             });
             setCourtError('Venue not found');
             return;
          }
          // It's a court ID
          setDbCourt(courtData as DbCourt);
          // We can fetch venue by venue_id from this court if needed, 
          // but let's stick to existing logic for fallback.
        } else {
          setDbVenue(venueData);
          const venueId = venueData.id;
          console.log('Resolved venueId for courts query:', venueId);
          // 2. Fetch Courts for this Venue (by venue_id) – no is_active/status filter so approved/active courts all appear
          const { data: courtsData, error: courtsError } = await supabase
            .from('courts')
            .select('*')
            .eq('venue_id', venueId)
            .order('display_order', { ascending: true })
            .order('name', { ascending: true }); // Fallback sort

          if (courtsError) {
            console.error('Error fetching venue courts:', courtsError);
          } else {
            const courts = (courtsData || []) as DbCourt[];
            console.log('Venue Courts:', courts);
            setVenueCourts(courts);
            // Default to first court
            if (courts.length > 0) {
              setDbCourt(courts[0]);
              setSelectedDbCourt(courts[0]);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching venue:', err);
        setCourtError('Venue not found');
      } finally {
        setCourtLoading(false);
      }
    };

    fetchVenueData();
  }, [id]);

  // (Removed old fetchCourt and fetchVenueCourts effects)


  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          return;
        }
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  // Fetch bookings and update time slots when date or court changes
  // Court for slots: prefer selectedDbCourt (real DB), then selectedCourt (mock), then dbCourt when URL is a court UUID
  const courtForSlots =
    selectedDbCourt
      ? { id: selectedDbCourt.id, name: selectedDbCourt.name, sport: selectedDbCourt.sport ?? '' }
      : selectedCourt
      ?? (dbCourt ? { id: dbCourt.id, name: dbCourt.name, sport: dbCourt.sport ?? '' } : null);

  useEffect(() => {
    const fetchBookingsAndUpdateSlots = async () => {
      if (!courtForSlots || !selectedDate) return;

      // Only fetch if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return;
      }

      setLoadingSlots(true);
      try {
        // Create Supabase client - works for both authenticated and unauthenticated users
        // Uses anon key which allows public read access to bookings (via RLS policy)
        const supabase = createClient();
        
        // First, try to find the court ID in Supabase
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let courtId: string | null = null;

        if (uuidRegex.test(courtForSlots.id)) {
          // Court ID is already a valid UUID
          courtId = courtForSlots.id;
        } else {
          // Try to find court in Supabase by name and sport
          const { data: courtData } = await supabase
            .from('courts')
            .select('id')
            .eq('name', courtForSlots.name)
            .eq('sport', courtForSlots.sport)
            .or('is_active.eq.true,is_active.is.null')
            .limit(1)
            .single();

          if (courtData) {
            courtId = courtData.id;
          }
        }

        if (!courtId) {
          // If court not found in Supabase, use default dynamic slots
          const fallbackSlots = generateTimeSlots(null, null);
          setTimeSlots(fallbackSlots);
          setLoadingSlots(false);
          return;
        }

        // Fetch existing bookings for this court and date only (strict: one court per grid)
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('start_time, end_time, status, court_id')
          .eq('court_id', courtId)
          .eq('booking_date', selectedDate)
          .in('status', ['pending', 'confirmed']);

        if (error) {
          console.error('Error fetching bookings:', error);
          const fallbackSlots = generateTimeSlots(null, null);
          setTimeSlots(fallbackSlots);
          setLoadingSlots(false);
          return;
        }

        // Determine opening/closing hours from the DB-backed court when available
        const slotsCourtSource = selectedDbCourt ?? dbCourt ?? null;
        const openingFromDb = (slotsCourtSource as DbCourt | null)?.opening_hour ?? null;
        const closingFromDb = (slotsCourtSource as DbCourt | null)?.closing_hour ?? null;

        // Generate base slots dynamically based on DB hours (fallback to 06:00–22:00)
        const slots = generateTimeSlots(openingFromDb, closingFromDb);

        // Get current date in local time (not UTC) so Malaysia users see correct "today"
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if the selected date is in the past
        const isPastDate = selectedDate < today;

        slots.forEach(slot => {
          // Mark as booked if the date is in the past
          if (isPastDate) {
            slot.isBooked = true;
            return;
          }

          // If the date is today, check if the time slot has passed
          if (selectedDate === today) {
            const slotHour = parseInt(slot.time.split(':')[0]);
            // Mark as booked if the slot time has already passed
            if (slotHour < currentHour || (slotHour === currentHour && 0 < currentMinute)) {
              slot.isBooked = true;
              return;
            }
          }

          // Strict: only mark booked if a booking for THIS court has the same slot time (or overlaps)
          if (bookings && bookings.length > 0) {
            const slotStartTime = slot.time;
            const slotEndTime = slot.time === '22:00' ? '23:00' : `${(parseInt(slot.time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

            const isOverlapping = bookings.some(
              (booking) =>
                booking.court_id === courtId &&
                (booking.start_time?.substring(0, 5) === slotStartTime ||
                  (slotStartTime < (booking.end_time?.substring(0, 5) ?? '') && slotEndTime > (booking.start_time?.substring(0, 5) ?? '')))
            );
            if (isOverlapping) {
              slot.isBooked = true;
            }
          }
        });

        setTimeSlots(slots);
      } catch (error) {
        console.error('Error updating time slots:', error);
        const fallbackSlots = generateTimeSlots(null, null);
        setTimeSlots(fallbackSlots);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookingsAndUpdateSlots();
  }, [selectedDate, selectedCourt, selectedDbCourt, dbCourt]);

  if (courtLoading) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading court...</p>
      </main>
    );
  }

  // When id is venue_id: we may have dbVenue but no courts — show venue with "No courts"
  const hasVenue = !!dbVenue;
  const hasCourts = venueCourts && venueCourts.length > 0;

  if (courtError) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Venue not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            Venue or court with ID <span className="font-mono">{id}</span> could not be loaded.
          </p>
          <Button3D variant="outline" className="mt-4" onClick={() => router.push('/venues')}>
            Back to Venues
          </Button3D>
        </div>
        <Footer />
      </main>
    );
  }

  if (!hasVenue && !dbCourt) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Court not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            Court with ID <span className="font-mono">{id}</span> could not be loaded.
            Ensure you are using a court ID from the courts table, not a venue ID.
          </p>
          <Button3D variant="outline" className="mt-4" onClick={() => router.push('/vendor/dashboard/courts')}>
            Back to Court Manager
          </Button3D>
        </div>
        <Footer />
      </main>
    );
  }

  if (hasVenue && !hasCourts) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{dbVenue.name}</h1>
          <p className="mt-2 text-sm text-gray-600">No courts available at this venue.</p>
          <Button3D variant="outline" className="mt-4" onClick={() => router.push('/venues')}>
            Back to Venues
          </Button3D>
        </div>
        <Footer />
      </main>
    );
  }


  // Active court for display: prefer a selected DB-backed court, then mock-selected, then the primary dbCourt, then first venue court
  const activeCourtSource: any = selectedDbCourt ?? selectedCourt ?? dbCourt ?? (venueCourts && venueCourts.length > 0 ? venueCourts[0] : null);
  const displayCourt = activeCourtSource
    ? {
        id: activeCourtSource.id,
        name: activeCourtSource.name,
        sport: activeCourtSource.sport ?? '',
        hourlyRate: Number(
          typeof activeCourtSource.hourlyRate !== 'undefined'
            ? activeCourtSource.hourlyRate
            : activeCourtSource.hourly_rate ?? 0,
        ),
        peakRate: Number(
          typeof activeCourtSource.peakRate !== 'undefined'
            ? activeCourtSource.peakRate
            : activeCourtSource.peak_rate ?? activeCourtSource.hourly_rate ?? 0,
        ),
      }
    : {
        id: '',
        name: 'Unknown Court',
        sport: '',
        hourlyRate: 0,
        peakRate: 0,
      };

  // Venue Info: prioritize dbVenue (from venues table), then venue (mock), then fallback to court fields
  const title = dbVenue?.name ?? venue?.name ?? displayCourt.name;
  const address = dbVenue?.address ?? venue?.address ?? (dbCourt as any)?.address ?? 'Address not available';
  const description = dbVenue?.description ?? venue?.description ?? (dbCourt as any)?.description ?? 'No description available.';
  
  // Images logic
  const venueImages = dbVenue?.images && Array.isArray(dbVenue.images) && dbVenue.images.length > 0 ? dbVenue.images : null;
  const courtImages = activeCourtSource?.image_url ?? activeCourtSource?.image;
  const validCourtImages = Array.isArray(courtImages) && courtImages.length > 0 ? courtImages : null;
  const mockImages = venue?.images && venue.images.length > 0 ? venue.images : null;
  
  const heroImages = venueImages ?? validCourtImages ?? mockImages ?? ['/courts/tennis.jpg'];
  const heroImage = heroImages[imageIndex] ?? heroImages[0] ?? '/courts/tennis.jpg';
  const hasImageGallery = heroImages.length > 1;
  const hasPhotoGallery = heroImages.length > 0;

  // Merge amenities from venue + all its courts, ensuring uniqueness
  const venueAmenities = (dbVenue?.amenities as string[] | undefined)
    ?? (venue?.amenities as string[] | undefined)
    ?? [];

  const courtsAmenities = Array.isArray(venueCourts)
    ? venueCourts.flatMap((c) =>
        Array.isArray(c.amenities) ? c.amenities : []
      )
    : [];

  const courtLevelFallback = Array.isArray((dbCourt as any)?.amenities)
    ? ((dbCourt as any).amenities as string[])
    : [];

  const mergedAmenitiesRaw = [...venueAmenities, ...courtsAmenities, ...courtLevelFallback]
    .map((a) => (typeof a === 'string' ? a.trim() : ''))
    .filter((a) => a.length > 0);

  const displayAmenities = Array.from(new Set(mergedAmenitiesRaw));
  
  const oh = dbVenue?.operating_hours as { open?: string; close?: string; days?: string } | undefined;
  if (oh) {
    console.log('Venue operating_hours (raw):', oh);
  }
  const operatingHours = oh 
    ? { open: oh.open ?? '07:00', close: oh.close ?? '23:00', days: oh.days ?? 'Daily' }
    : venue?.operatingHours ?? { open: '07:00', close: '23:00', days: 'Daily' };

  const rating = dbVenue?.rating ?? venue?.rating ?? 4.8;
  const reviewCount = dbVenue?.review_count ?? venue?.reviewCount ?? 124;

  const totalPrice = selectedSlot 
    ? (timeSlots.find(s => s.time === selectedSlot)?.isPeak 
        ? displayCourt.peakRate 
        : displayCourt.hourlyRate) * duration
    : 0;

  const handleBooking = async () => {
    if (!selectedSlot || !displayCourt) return;

    // Check if user is authenticated
    if (!user) {
      setBookingError('Please sign in to make a booking');
      setTimeout(() => {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
      return;
    }

    setIsBooking(true);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setBookingError('Supabase is not configured. Please check your environment variables.');
        setIsBooking(false);
        return;
      }

      const supabase = createClient();

      // Validate court ID is a UUID (Supabase requires UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let courtId: string;
      let courtVendorId: string | null = null;
      let courtStatus: string | null = null;
      let venueId: string | null = dbVenue?.id ?? null;

      if (!uuidRegex.test(displayCourt.id)) {
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id')
          .eq('slug', venue?.name.toLowerCase().replace(/\s+/g, '-'))
          .single();

        if (venueError || !venueData) {
          const { data: courtData, error: courtError } = await supabase
            .from('courts')
            .select('id, vendor_id, venue_id')
            .eq('name', displayCourt.name)
            .eq('sport', displayCourt.sport)
            .limit(1)
            .single();

          if (courtError || !courtData) {
            setBookingError('Court not found in database. Please ensure your Supabase database has the courts set up. The mock data court IDs do not match the database.');
            setIsBooking(false);
            return;
          }
          courtId = (courtData as { id: string }).id;
          courtVendorId = (courtData as { vendor_id?: string }).vendor_id ?? null;
          courtStatus = (courtData as { status?: string }).status ?? null;
          if (!venueId) venueId = (courtData as { venue_id?: string }).venue_id ?? null;
        } else {
          const { data: courtData, error: courtError } = await supabase
            .from('courts')
            .select('id, vendor_id, venue_id')
            .eq('venue_id', venueData.id)
            .eq('name', displayCourt.name)
            .eq('sport', displayCourt.sport)
            .limit(1)
            .single();

          if (courtError || !courtData) {
            setBookingError('Court not found in database. Please ensure your Supabase database has the courts set up.');
            setIsBooking(false);
            return;
          }
          courtId = (courtData as { id: string }).id;
          courtVendorId = (courtData as { vendor_id?: string }).vendor_id ?? null;
          courtStatus = (courtData as { status?: string }).status ?? null;
          venueId = (courtData as { venue_id?: string }).venue_id ?? venueData.id;
        }
      } else {
        const { data: courtRow, error: courtRowError } = await supabase
          .from('courts')
          .select('id, vendor_id, venue_id')
          .eq('id', displayCourt.id)
          .single();

        if (courtRowError || !courtRow) {
          setBookingError('Court not found in database. Please ensure your Supabase database has the courts set up.');
          setIsBooking(false);
          return;
        }
        const row = courtRow as { id: string; vendor_id?: string; venue_id?: string; status?: string };
        courtId = row.id;
        courtVendorId = row.vendor_id ?? null;
        courtStatus = row.status ?? null;
        if (row.venue_id) venueId = row.venue_id;
      }

      if (!venueId && courtId) {
        const { data: courtForVenue } = await supabase.from('courts').select('venue_id').eq('id', courtId).single();
        venueId = (courtForVenue as { venue_id?: string } | null)?.venue_id ?? null;
      }

      // Vetting check: only allow bookings for approved courts
      if (courtStatus && courtStatus !== 'approved') {
        setBookingError('This court is currently undergoing vetting and is not yet open for bookings.');
        setIsBooking(false);
        return;
      }

      // Calculate end time from start time and duration
      const [startHour, startMinute] = selectedSlot.split(':').map(Number);
      const endHour = Math.floor(startHour + duration);
      const endMinute = startMinute + ((duration % 1) * 60);
      const finalEndHour = endHour + Math.floor(endMinute / 60);
      const finalEndMinute = endMinute % 60;
      const endTime = `${finalEndHour.toString().padStart(2, '0')}:${Math.floor(finalEndMinute).toString().padStart(2, '0')}:00`;

      // Payload with court_id and venue_id explicit so DB can map correctly
      const bookingData: Record<string, unknown> = {
        user_id: user.id,
        court_id: courtId,
        booking_date: selectedDate,
        start_time: selectedSlot.includes(':00') ? selectedSlot : `${selectedSlot}:00`,
        end_time: endTime,
        duration: duration,
        player_count: 2,
        total_price: totalPrice,
        status: 'confirmed',
      };
      if (venueId) bookingData.venue_id = venueId;
      if (courtVendorId) bookingData.vendor_id = courtVendorId;

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) {
        console.error('Booking error:', error);
        setBookingError(error.message || 'Failed to create booking. Please try again.');
        setIsBooking(false);
        return;
      }

      // Success! Reload time slots to show the new booking (respecting dynamic hours)
      const slotsCourtSource = selectedDbCourt ?? dbCourt ?? null;
      const openingFromDb = (slotsCourtSource as DbCourt | null)?.opening_hour ?? null;
      const closingFromDb = (slotsCourtSource as DbCourt | null)?.closing_hour ?? null;
      const slots = generateTimeSlots(openingFromDb, closingFromDb);
      // Mark the booked slot
      const bookedSlot = slots.find((s) => s.time === selectedSlot);
      if (bookedSlot) {
        bookedSlot.isBooked = true;
      }
      setTimeSlots(slots);
      
      setBookingSuccess(true);
      setTimeout(() => {
        // Hard redirect to avoid stale client state
        window.location.href = '/bookings';
      }, 1500);
    } catch (err: any) {
      console.error('Unexpected booking error:', err);
      setBookingError(err.message || 'An unexpected error occurred. Please try again.');
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      {/* Hero Image Gallery */}
      <section className="pt-20">
        <div className="relative h-[400px] lg:h-[500px]">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all duration-200 group"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          {/* Image Navigation */}
          {heroImages.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex(prev => prev > 0 ? prev - 1 : heroImages.length - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setImageIndex(prev => prev < heroImages.length - 1 ? prev + 1 : 0)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Venue Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Badge3D variant="sport" color="teal" size="md" className="mb-3">
                {SPORT_INFO[displayCourt.sport]?.label ?? displayCourt.sport}
              </Badge3D>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {address}
                </span>
                {reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {rating} ({reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail gallery when court has multiple images */}
        {hasImageGallery && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {heroImages.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    imageIndex === idx ? 'border-teal-dark ring-2 ring-teal-dark/30' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${title} image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Venue Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card3D variant="clay" padding="lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">About This Venue</h2>
                <p className="text-gray-600 leading-relaxed">{description}</p>
                
                {/* Operating Hours */}
                {(operatingHours.open !== '—' || operatingHours.close !== '—') && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Clock className="w-5 h-5 text-teal-dark" />
                      <span className="font-semibold">Operating Hours:</span>
                      <span className="text-gray-600">
                        {operatingHours.open} - {operatingHours.close} ({operatingHours.days})
                      </span>
                    </div>
                  </div>
                )}
              </Card3D>

              {/* Photo Gallery */}
              {hasPhotoGallery && heroImages.length > 0 && (
                <Card3D variant="clay" padding="lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Photo Gallery</h2>
                  <div className="flex gap-4 overflow-x-auto py-4">
                    {heroImages.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${title} photo ${i + 1}`}
                        className="w-48 h-32 object-cover rounded-xl border flex-shrink-0"
                      />
                    ))}
                  </div>
                </Card3D>
              )}

              {/* Amenities */}
              {displayAmenities.length > 0 && (
                <Card3D variant="clay" padding="lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayAmenities.map((amenity) => (
                      <div 
                        key={amenity}
                        className="flex items-center gap-2 p-3 rounded-xl bg-gray-50"
                      >
                        {AMENITY_ICONS[amenity] || <Check className="w-4 h-4" />}
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </Card3D>
              )}

              {/* Court Selection - group courts by venue_name */}
              {(venueCourts.length > 1 || courts.length > 1) && (
                <Card3D variant="clay" padding="lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Select Court</h2>

                  {venueCourtsLoading && (
                    <p className="text-sm text-gray-500 mb-3">Loading courts for this venue...</p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {venueCourts.length > 0
                      ? venueCourts.map((court) => (
                          <div
                            key={court.id}
                            className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                              selectedDbCourt?.id === court.id
                                ? 'border-teal-dark bg-teal-dark text-white shadow-lg'
                                : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            <div>
                              <p className="font-semibold">{court.name}</p>
                              <p className="text-sm opacity-80">
                                {formatPrice(Number(court.hourly_rate ?? 0))}/hr
                              </p>
                            </div>
                            <Button3D
                              variant={selectedDbCourt?.id === court.id ? 'secondary' : 'primary'}
                              size="sm"
                              onClick={() => setSelectedDbCourt(court)}
                            >
                              {selectedDbCourt?.id === court.id ? 'Selected' : 'Add to Cart'}
                            </Button3D>
                          </div>
                        ))
                      : courts.map((court) => (
                          <button
                            key={court.id}
                            onClick={() => setSelectedCourt(court)}
                            className={`px-4 py-3 rounded-xl transition-all ${
                              selectedCourt.id === court.id
                                ? 'bg-teal-dark text-white shadow-lg'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <p className="font-semibold">{court.name}</p>
                            <p className="text-sm opacity-80">
                              {formatPrice(court.hourlyRate)}/hr
                            </p>
                          </button>
                        ))}
                  </div>
                </Card3D>
              )}

              {/* Time Slots */}
              <Card3D variant="clay" padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Available Slots</h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getTodayLocal()}
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
                      onClick={() => !slot.isBooked && setSelectedSlot(slot.time)}
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
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card3D variant="glass" padding="lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Book This Court</h3>
                  
                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Standard Rate</span>
                      <span className="font-semibold text-gray-800">
                        {formatPrice(displayCourt.hourlyRate)}/hr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Peak Rate (6-9pm)</span>
                      <span className="font-semibold text-tomato">
                        {formatPrice(displayCourt.peakRate)}/hr
                      </span>
                    </div>
                  </div>

                  {/* Duration Selection: 1hr, 2hr, 3hr, 4hr + key-in custom hours */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Duration
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDuration(d);
                            setCustomDurationInput('');
                          }}
                          className={`py-2 px-4 rounded-xl text-sm font-medium transition-all min-w-[3rem] ${
                            duration === d && !customDurationInput
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
                          min={1}
                          max={12}
                          step={1}
                          placeholder="hrs"
                          value={customDurationInput || ([1, 2, 3, 4].includes(duration) ? '' : String(duration))}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomDurationInput(val);
                            const num = parseFloat(val);
                            if (!Number.isNaN(num) && num >= 1) {
                              const clamped = Math.min(12, Math.max(1, num));
                              setDuration(clamped);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '') return;
                            const num = parseFloat(val);
                            if (Number.isNaN(num) || num < 1) {
                              setCustomDurationInput('');
                              setDuration(1);
                            } else {
                              const clamped = Math.min(12, Math.max(1, num));
                              setCustomDurationInput(String(clamped));
                              setDuration(clamped);
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
                    onClick={handleBooking}
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
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
