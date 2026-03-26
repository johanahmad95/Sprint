'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { SportFilter, Card3D, VenueCard } from '@/components/ui';
import { Select3D } from '@/components/ui/Input3D';
import { SportType, AREA_INFO, KlangValleyArea, Venue, Court } from '@/lib/types';
import { Search, MapPin, SlidersHorizontal, Locate } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserLocation } from '@/lib/geolocation';
import { toast } from 'sonner';

// Map Supabase venue row (snake_case) to Venue type
function mapSupabaseVenue(row: Record<string, unknown>): Venue {
  const oh = (row.operating_hours as Record<string, string>) || {};

  const rawAddress = String(row.address ?? '').trim();
  const rawLocation = String(row.location ?? '').trim();

  const looksLikeGeometry = (val: string) =>
    val.startsWith('0101') || val.startsWith('\\x0101') || /^0x[0-9a-f]+$/i.test(val);

  const safeAddress = rawAddress && !looksLikeGeometry(rawAddress) ? rawAddress : '';
  const safeLocation = rawLocation && !looksLikeGeometry(rawLocation) ? rawLocation : '';

  const address = safeAddress || safeLocation || '';
  const location = safeLocation || safeAddress || '';

  const imagesSource =
    (Array.isArray((row as any).images) && ((row as any).images as string[])) ||
    (Array.isArray((row as any).image_url) && ((row as any).image_url as string[])) ||
    [];

  return {
    id: String(row.id),
    name: String(row.name || ''),
    slug: String(row.slug || ''),
    description: String(row.description || ''),
    address: address || 'Location TBD',
    area: (row.area as KlangValleyArea) || 'kuala-lumpur',
    location: location || 'Location TBD',
    images: imagesSource,
    amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    operatingHours: {
      open: oh.open || '06:00',
      close: oh.close || '22:00',
      days: oh.days || 'Open daily',
    },
    createdAt: String(row.created_at || ''),
  };
}

// Map Supabase court row to Court type (price, location, category from DB)
function mapSupabaseCourt(row: Record<string, unknown>, venueId: string): Court {
  const imageRaw = row.image_url ?? row.image;
  const imageUrls = Array.isArray(imageRaw)
    ? (imageRaw as string[])
    : typeof imageRaw === 'string' && imageRaw
    ? [imageRaw]
    : null;
  const sport = String(row.sport ?? row.sport_type ?? '').toLowerCase() as SportType;
  return {
    id: String(row.id),
    venueId,
    name: String(row.name || ''),
    sport: sport || 'tennis',
    description: row.description != null ? String(row.description) : undefined,
    image_url: imageUrls,
    hourlyRate: Number(row.hourly_rate) ?? 0,
    peakRate: Number(row.peak_rate) ?? Number(row.hourly_rate) ?? 0,
    isIndoor: Boolean(row.is_indoor ?? true),
    displayOrder: Number(row.display_order) ?? 0,
    amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
  };
}

type VenueWithCourt = { venue: Venue; court: Court; courts: Court[] };

export default function VenuesPage() {
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<VenueWithCourt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<KlangValleyArea | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<VenueWithCourt[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Fetch ALL venues (no sport filter in query); then courts. Sport filter applied client-side to match DB column 'sport' (lowercase).
  useEffect(() => {
    const fetchVenuesAndCourts = async () => {
      try {
        const supabase = createClient();

        // 1) Fetch ALL venues — no .eq() so we get every venue (no initial filter)
        let query = supabase.from('venues').select('*');
        const { data: venuesData, error: venuesError } = await query;
        console.log('Venues from DB:', venuesData);
        if (venuesError) {
          console.error('Venues fetch error:', venuesError);
        }
        const venues = (venuesError ? [] : venuesData ?? []).map((row: Record<string, unknown>) => mapSupabaseVenue(row));

        // 2) Fetch courts by venue_id (join); prefer active/approved, but gracefully fall back if status column is missing
        const venueIds = venues.map((v) => v.id);
        let courtsRaw: Record<string, unknown>[] = [];
        const { data: courtsData, error: courtsError } = await supabase
          .from('courts')
          .select('*, venues(*)')
          .in('venue_id', venueIds)
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false });
        console.log('Fetched Courts (with status filter):', courtsData);
        if (courtsError) {
          console.warn('Courts fetch with status filter failed, retrying without status/join:', courtsError);
          const { data: courtsDataFallback, error: courtsErrorFallback } = await supabase
            .from('courts')
            .select('*')
            .in('venue_id', venueIds)
            .order('created_at', { ascending: false });
          if (courtsErrorFallback) {
            console.error('Courts fetch error (fallback):', courtsErrorFallback);
            courtsRaw = [];
          } else {
            courtsRaw = (courtsDataFallback ?? []) as Record<string, unknown>[];
          }
        } else {
          courtsRaw = (courtsData ?? []) as Record<string, unknown>[];
        }
        console.log('Courts from DB:', courtsRaw);
        console.log('Courts from DB:', courtsRaw);

        const courtsByVenue = new Map<string, Court[]>();
        for (const c of courtsRaw) {
          const venueId = String(c.venue_id ?? '');
          const court = mapSupabaseCourt(c, venueId);
          if (!courtsByVenue.has(venueId)) {
            courtsByVenue.set(venueId, []);
          }
          courtsByVenue.get(venueId)!.push(court);
        }

        const venueGroups: VenueWithCourt[] = [];
        
        courtsByVenue.forEach((venueCourts, venueId) => {
          let venue = venues.find((v) => v.id === venueId);
          
          // Create synthetic venue if not found (handling orphan courts)
          if (!venue) {
            const rawCourt = courtsRaw.find(c => String(c.venue_id ?? '') === venueId);
            if (rawCourt) {
              const vName = String(rawCourt.venue_name ?? rawCourt.name ?? 'Unknown Venue');
              const vAddr = String(rawCourt.address ?? rawCourt.venue_name ?? '').trim() || 'Location TBD';
              venue = {
                id: venueId || 'unknown',
                name: vName,
                slug: '',
                description: String(rawCourt.description ?? ''),
                address: vAddr,
                area: 'kuala-lumpur',
                location: vAddr,
                images: [],
                amenities: Array.isArray(rawCourt.amenities) ? (rawCourt.amenities as string[]) : [],
                rating: 0,
                reviewCount: 0,
                operatingHours: { open: '07:00', close: '23:00', days: 'Daily' },
                createdAt: '',
              };
            }
          }

          if (venue && venueCourts.length > 0) {
            // Find the representative court (lowest price)
            const bestCourt = venueCourts.reduce((prev, curr) => 
              prev.hourlyRate < curr.hourlyRate ? prev : curr
            );
            venueGroups.push({ venue, court: bestCourt, courts: venueCourts });
          }
        });

        // Filter out any groups where ALL courts are filtered out by sport?
        // Wait, the filtering logic later does filtering on the *representative* court's sport?
        // "if ((court.sport ?? '').toLowerCase() !== selectedCategory.toLowerCase()) return false;"
        // This means if the "best" court is Tennis, but the venue also has Badminton, and user selects Badminton,
        // this venue might be hidden if we only check the representative court.
        
        // Correction: The filtering logic should check if *any* court in the venue matches the filter.
        // But `displayVenues` logic uses `item.court`.
        // I should probably move the filtering logic UP, or adjust `displayVenues`.
        
        // For now, let's stick to the current structure: `venues` state holds the list.
        // If I change `venues` state to hold `courts[]`, I break `displayVenues`.
        
        // To support "Show venue if ANY court matches":
        // I should probably keep `VenueWithCourt` but maybe `court` property is just *one* of them for display,
        // but I should attach `allCourts` to check filters?
        // Or update `displayVenues` filter logic.
        
        // The user wants: "Only show one card per unique venue".
        // If I select "Badminton", I expect to see venues that have Badminton courts.
        // And the card should probably show "Badminton".
        // If a venue has Tennis and Badminton, and I select All, what does it show?
        // Probably the "main" sport or just one of them.
        
        // Let's modify the `venueGroups` construction to be sensitive to the *current* filter?
        // No, `useEffect` fetches once. Filtering happens in render.
        
        // So I need to pass ALL courts to the render/filter logic.
        // But `venues` state is typed as `{ venue: Venue; court: Court }[]`.
        // I should change the state type to `{ venue: Venue; courts: Court[] }[]`.
        
        // Let's refactor the state type.
        
        venueGroups.sort((a, b) => a.court.displayOrder - b.court.displayOrder || 0);
        setVenues(venueGroups);
      } catch (err) {
        console.error('Courts page fetch error:', err);
        toast.error('Could not load courts.');
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchVenuesAndCourts();
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const sport = searchParams.get('sport') as SportType | null;
    const area = searchParams.get('area') as KlangValleyArea | null;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (sport && ['pickleball', 'padel', 'tennis', 'badminton', 'futsal', 'basketball', 'squash'].includes(sport)) {
      setSelectedCategory(sport);
    }
    if (area && Object.keys(AREA_INFO).includes(area)) {
      setSelectedArea(area);
    }
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        fetchNearbyCourts(latNum, lngNum, (sport as SportType) || undefined);
      }
    }
  }, [searchParams]);

  const fetchNearbyCourts = async (latitude: number, longitude: number, sportFilter?: SportType) => {
    setIsLoadingNearby(true);
    setIsNearbyMode(true);
    setNearbyResults([]);

    try {
      const supabase = createClient();
      const { data: venuesData, error } = await supabase.rpc('get_nearby_courts', {
        user_lat: latitude,
        user_lng: longitude,
        distance_meters: 10000,
      });

      if (error) {
        console.error('RPC error:', error);
        toast.error('No nearby courts found. Try searching by area.');
        setIsNearbyMode(false);
        setIsLoadingNearby(false);
        return;
      }

      const rows = (venuesData || []) as Record<string, unknown>[];
      const venues = rows.map(mapSupabaseVenue);

      if (venues.length === 0) {
        toast.error('No nearby courts found. Try searching by area.');
        setIsNearbyMode(false);
        setIsLoadingNearby(false);
        return;
      }

      // Fetch courts for these venues; prefer active/approved, but gracefully fall back if status column is missing
      const venueIds = venues.map((v) => v.id);
      let courts: Record<string, unknown>[] = [];
      const { data: courtsData, error: courtsError } = await supabase
        .from('courts')
        .select('*, venues(*)')
        .in('venue_id', venueIds)
        .in('status', ['active', 'approved']);
      console.log('Fetched Courts (nearby, status filter):', courtsData);

      if (courtsError) {
        console.warn('Nearby courts fetch with status filter failed, retrying without status/join:', courtsError);
        const { data: courtsDataFallback, error: courtsErrorFallback } = await supabase
          .from('courts')
          .select('*')
          .in('venue_id', venueIds);
        if (courtsErrorFallback) {
          console.error('Nearby courts fetch error (fallback):', courtsErrorFallback);
          courts = [];
        } else {
          courts = (courtsDataFallback || []) as Record<string, unknown>[];
        }
      } else {
        courts = (courtsData || []) as Record<string, unknown>[];
      }

      const courtMap = new Map<string, Court[]>();
      for (const c of courts) {
        const venueId = String(c.venue_id);
        if (!courtMap.has(venueId)) courtMap.set(venueId, []);
        courtMap.get(venueId)!.push(mapSupabaseCourt(c, venueId));
      }

      const results: { venue: Venue; court: Court; courts: Court[] }[] = [];
      for (const venue of venues) {
        const venueCourts = courtMap.get(venue.id) || [];
        if (venueCourts.length > 0) {
          // Find representative court (lowest price)
          const bestCourt = venueCourts.reduce((prev, curr) => 
            prev.hourlyRate < curr.hourlyRate ? prev : curr
          );
          results.push({ venue, court: bestCourt, courts: venueCourts });
        }
      }

      setNearbyResults(results);
    } catch (err) {
      console.error(err);
      toast.error('Could not load nearby courts. Try again or search by area.');
      setIsNearbyMode(false);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const handleFindNearMe = async () => {
    try {
      const { latitude, longitude } = await getUserLocation();
      await fetchNearbyCourts(latitude, longitude);
    } catch (err: unknown) {
      const geoErr = err as { code?: number; message?: string };
      if (geoErr?.code === 1) {
        toast.error('Please enable location to find nearby courts or search by area.');
      } else if (err instanceof Error && err.message === 'Geolocation is not supported') {
        toast.error('Location is not supported by your browser.');
      } else {
        toast.error('Could not get your location. Try again or search by area.');
      }
    }
  };

  // When no category selected (All), show all; otherwise match venue category (from any court in DB)
  const displayVenues = (isNearbyMode ? nearbyResults : venues)?.filter((item) => {
    const { venue, courts } = item;
    if (selectedCategory && selectedCategory !== 'All') {
      // Case-insensitive, trimmed sport match across all courts for this venue
      const target = selectedCategory.toString().trim().toLowerCase();
      const hasSport = courts?.some((c) =>
        (c.sport ?? '').toString().trim().toLowerCase() === target
      );
      if (!hasSport) return false;
    }
    if (selectedArea !== 'all' && venue.area !== selectedArea) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        venue.name.toLowerCase().includes(q) ||
        venue.location.toLowerCase().includes(q) ||
        venue.description.toLowerCase().includes(q)
      );
    }
    return true;
  }) ?? [];

  const showClearButton =
    (selectedCategory !== 'All' || selectedArea !== 'all' || searchQuery) && !isNearbyMode;

  const areaOptions = [
    { value: 'all', label: 'All Areas' },
    ...Object.entries(AREA_INFO).map(([key, value]) => ({
      value: key,
      label: value.label,
    })),
  ];

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-8 bg-gradient-to-b from-apricot-light to-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
              Find Your Perfect Court
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore sports courts across Klang Valley. Filter by sport type and location 
              to find the perfect venue for your next game.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search venues by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-14 py-4 rounded-2xl bg-white
                  shadow-[4px_4px_12px_rgba(0,0,0,0.08),-3px_-3px_10px_rgba(255,255,255,0.9)]
                  border border-gray-100 text-gray-800 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-vista-blue/30"
              />
              <button
                type="button"
                onClick={handleFindNearMe}
                disabled={isLoadingNearby}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-tomato hover:bg-tomato/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Find courts near me"
              >
                <Locate className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters Row */}
          <Card3D variant="clay" padding="md" className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium">Filters:</span>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2 lg:hidden">Sport Type:</p>
                <SportFilter
                  selectedSport={selectedCategory === 'All' ? 'all' : (selectedCategory as SportType)}
                  onSelectSport={(s) => {
                    if (s === 'all') {
                      setSelectedCategory('All');
                      setSelectedArea('all');
                      setSearchQuery('');
                      setIsNearbyMode(false);
                    } else {
                      setSelectedCategory(s);
                    }
                  }}
                />
              </div>

              <div className="w-full lg:w-64">
                <p className="text-sm text-gray-500 mb-2 lg:hidden">Location:</p>
                <Select3D
                  icon={<MapPin className="w-5 h-5" />}
                  options={areaOptions}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value as KlangValleyArea | 'all')}
                  className="w-full min-h-[48px] md:min-h-0"
                />
              </div>
            </div>
          </Card3D>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {isLoadingNearby ? (
                'Finding courts near you...'
              ) : isLoadingList ? (
                'Loading courts...'
              ) : (
                <>
                  <span className="font-semibold text-gray-800">{displayVenues.length}</span> venues found
                </>
              )}
            </p>
            {(showClearButton || isNearbyMode) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedArea('all');
                  setSearchQuery('');
                  setIsNearbyMode(false);
                }}
                className="text-sm text-tomato hover:text-tomato-dark font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Venues Grid */}
          {isLoadingNearby ? (
            <Card3D variant="clay" padding="lg" className="text-center">
              <div className="py-12">
                <p className="text-xl font-semibold text-gray-800 mb-2">Finding courts near you...</p>
                <p className="text-gray-500">Please wait while we fetch nearby venues.</p>
              </div>
            </Card3D>
          ) : isLoadingList ? (
            <Card3D variant="clay" padding="lg" className="text-center">
              <div className="py-12">
                <p className="text-xl font-semibold text-gray-800 mb-2">Loading courts...</p>
                <p className="text-gray-500">Fetching venues and courts from the database.</p>
              </div>
            </Card3D>
          ) : displayVenues.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {displayVenues.map(({ venue, court }) => (
                <VenueCard key={`${venue.id}-${court.id}`} venue={venue} court={court} />
              ))}
            </div>
          ) : (
            <Card3D variant="clay" padding="lg" className="text-center">
              <div className="py-12">
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  No venues found
                </p>
                <p className="text-gray-500">
                  {isNearbyMode
                    ? 'No courts found within 10km. Try searching by area.'
                    : 'Try adjusting your filters or search query.'}
                </p>
              </div>
            </Card3D>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
