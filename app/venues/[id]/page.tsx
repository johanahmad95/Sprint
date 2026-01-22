'use client';

import { useState, use, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { Button3D, Card3D, Badge3D } from '@/components/ui';
import { 
  MapPin, Clock, Star, Phone, Mail, 
  ChevronLeft, ChevronRight, Check, Users,
  Calendar, Wifi, Car, Dumbbell, Coffee
} from 'lucide-react';
import { MOCK_VENUES, MOCK_COURTS } from '@/lib/mock-data';
import { formatPrice, SPORT_INFO } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

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

// Generate base time slots structure
const generateBaseTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const isPeak = hour >= 18 && hour <= 21; // Peak hours: 6pm - 9pm
    slots.push({ time, isPeak, isBooked: false });
  }
  return slots;
};

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const venue = MOCK_VENUES.find(v => v.id === id);
  const courts = MOCK_COURTS.filter(c => c.venueId === id);
  const [selectedCourt, setSelectedCourt] = useState(courts[0]);
  const [timeSlots, setTimeSlots] = useState(generateBaseTimeSlots());
  const [loadingSlots, setLoadingSlots] = useState(false);

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
  // Note: This works for both authenticated and unauthenticated users
  // Unauthenticated users can see availability but cannot make bookings
  useEffect(() => {
    const fetchBookingsAndUpdateSlots = async () => {
      if (!selectedCourt || !selectedDate) return;

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

        if (uuidRegex.test(selectedCourt.id)) {
          // Court ID is already a valid UUID
          courtId = selectedCourt.id;
        } else {
          // Try to find court in Supabase by name and sport
          const { data: courtData } = await supabase
            .from('courts')
            .select('id')
            .eq('name', selectedCourt.name)
            .eq('sport', selectedCourt.sport)
            .limit(1)
            .single();

          if (courtData) {
            courtId = courtData.id;
          }
        }

        if (!courtId) {
          // If court not found in Supabase, use base slots
          setTimeSlots(generateBaseTimeSlots());
          setLoadingSlots(false);
          return;
        }

        // Fetch existing bookings for this court and date
        // This query works for all users (authenticated and unauthenticated) due to RLS policy
        // that allows public read access: "Bookings are viewable by everyone for availability"
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('start_time, end_time, status')
          .eq('court_id', courtId)
          .eq('booking_date', selectedDate)
          .in('status', ['pending', 'confirmed']); // Only count pending and confirmed bookings

        if (error) {
          console.error('Error fetching bookings:', error);
          setTimeSlots(generateBaseTimeSlots());
          setLoadingSlots(false);
          return;
        }

        // Generate base slots
        const slots = generateBaseTimeSlots();

        // Get current date and time
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
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

          // Check if slot overlaps with existing bookings (only for future dates/times)
          if (bookings && bookings.length > 0) {
            const slotStartTime = slot.time; // Format: "HH:00"
            const slotEndTime = slot.time === '22:00' ? '23:00' : `${(parseInt(slot.time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

            // Check if this slot overlaps with any booking
            const isOverlapping = bookings.some(booking => {
              const bookingStart = booking.start_time.substring(0, 5); // "HH:mm"
              const bookingEnd = booking.end_time.substring(0, 5); // "HH:mm"

              // Check if slot time overlaps with booking time
              // Slot overlaps if: slotStart < bookingEnd AND slotEnd > bookingStart
              return slotStartTime < bookingEnd && slotEndTime > bookingStart;
            });

            if (isOverlapping) {
              slot.isBooked = true;
            }
          }
        });

        setTimeSlots(slots);
      } catch (error) {
        console.error('Error updating time slots:', error);
        setTimeSlots(generateBaseTimeSlots());
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookingsAndUpdateSlots();
  }, [selectedDate, selectedCourt]);

  if (!venue || !selectedCourt) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Venue not found</h1>
          <Button3D variant="outline" className="mt-4" onClick={() => router.push('/venues')}>
            Back to Venues
          </Button3D>
        </div>
        <Footer />
      </main>
    );
  }

  const totalPrice = selectedSlot 
    ? (timeSlots.find(s => s.time === selectedSlot)?.isPeak 
        ? selectedCourt.peakRate 
        : selectedCourt.hourlyRate) * duration
    : 0;

  const handleBooking = async () => {
    if (!selectedSlot || !selectedCourt) return;

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

      if (!uuidRegex.test(selectedCourt.id)) {
        // Court ID is not a UUID - this means we're using mock data
        // Try to find the court in Supabase by matching venue and court name
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id')
          .eq('slug', venue?.name.toLowerCase().replace(/\s+/g, '-'))
          .single();

        if (venueError || !venueData) {
          // If venue not found, try to find court by name across all venues
          const { data: courtData, error: courtError } = await supabase
            .from('courts')
            .select('id')
            .eq('name', selectedCourt.name)
            .eq('sport', selectedCourt.sport)
            .limit(1)
            .single();

          if (courtError || !courtData) {
            setBookingError('Court not found in database. Please ensure your Supabase database has the courts set up. The mock data court IDs do not match the database.');
            setIsBooking(false);
            return;
          }

          // Use the found court ID
          courtId = courtData.id;
        } else {
          // Find court in the venue
          const { data: courtData, error: courtError } = await supabase
            .from('courts')
            .select('id')
            .eq('venue_id', venueData.id)
            .eq('name', selectedCourt.name)
            .eq('sport', selectedCourt.sport)
            .limit(1)
            .single();

          if (courtError || !courtData) {
            setBookingError('Court not found in database. Please ensure your Supabase database has the courts set up.');
            setIsBooking(false);
            return;
          }

          courtId = courtData.id;
        }
      } else {
        // Court ID is already a valid UUID
        courtId = selectedCourt.id;
      }

      // Calculate end time from start time and duration
      const [startHour, startMinute] = selectedSlot.split(':').map(Number);
      const endHour = Math.floor(startHour + duration);
      const endMinute = startMinute + ((duration % 1) * 60);
      const finalEndHour = endHour + Math.floor(endMinute / 60);
      const finalEndMinute = endMinute % 60;
      const endTime = `${finalEndHour.toString().padStart(2, '0')}:${Math.floor(finalEndMinute).toString().padStart(2, '0')}:00`;

      // Create booking in Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          court_id: courtId,
          booking_date: selectedDate,
          start_time: `${selectedSlot}:00`,
          end_time: endTime,
          duration: duration,
          player_count: 2,
          total_price: totalPrice,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Booking error:', error);
        setBookingError(error.message || 'Failed to create booking. Please try again.');
        setIsBooking(false);
        return;
      }

      // Success! Reload time slots to show the new booking
      const slots = generateBaseTimeSlots();
      // Mark the booked slot
      const bookedSlot = slots.find(s => s.time === selectedSlot);
      if (bookedSlot) {
        bookedSlot.isBooked = true;
      }
      setTimeSlots(slots);
      
      setBookingSuccess(true);
      setTimeout(() => {
        router.push('/bookings');
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
            src={venue.images[imageIndex] || '/courts/tennis.jpg'}
            alt={venue.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Image Navigation */}
          {venue.images.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex(prev => prev > 0 ? prev - 1 : venue.images.length - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setImageIndex(prev => prev < venue.images.length - 1 ? prev + 1 : 0)}
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
                {SPORT_INFO[selectedCourt.sport].label}
              </Badge3D>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {venue.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venue.address}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {venue.rating} ({venue.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
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
                <p className="text-gray-600 leading-relaxed">{venue.description}</p>
                
                {/* Operating Hours */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-800">
                    <Clock className="w-5 h-5 text-teal-dark" />
                    <span className="font-semibold">Operating Hours:</span>
                    <span className="text-gray-600">
                      {venue.operatingHours.open} - {venue.operatingHours.close} ({venue.operatingHours.days})
                    </span>
                  </div>
                </div>
              </Card3D>

              {/* Amenities */}
              <Card3D variant="clay" padding="lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity) => (
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

              {/* Court Selection */}
              {courts.length > 1 && (
                <Card3D variant="clay" padding="lg">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Select Court</h2>
                  <div className="flex flex-wrap gap-3">
                    {courts.map((court) => (
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
                        <p className="text-sm opacity-80">{formatPrice(court.hourlyRate)}/hr</p>
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
                        {formatPrice(selectedCourt.hourlyRate)}/hr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Peak Rate (6-9pm)</span>
                      <span className="font-semibold text-tomato">
                        {formatPrice(selectedCourt.peakRate)}/hr
                      </span>
                    </div>
                  </div>

                  {/* Duration Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Duration
                    </label>
                    <div className="flex gap-2">
                      {[1, 1.5, 2].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                            duration === d
                              ? 'bg-teal-dark text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {d}hr
                        </button>
                      ))}
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

                  {/* Total */}
                  <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-800">Total</span>
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
