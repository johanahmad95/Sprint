'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SportFilter, Button3D } from '@/components/ui';
import VenueCard from '@/components/ui/VenueCard';
import { SportType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type CourtRow = {
  id: string;
  venue_id?: string | null;
  name: string;
  venue_name?: string | null;
  sport?: string | null;
  sport_type?: string | null;
  hourly_rate?: number | null;
  peak_rate?: number | null;
  image?: string[] | null;
  image_url?: string[] | null;
  description?: string | null;
  address?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  amenities?: string[] | null;
};

const mapCourtToCard = (c: CourtRow, venueName?: string, venueAddr?: string, venueSlug?: string) => {
  const sport = (c.sport ?? c.sport_type ?? '').toString().toLowerCase() as SportType;
  const placeholder = 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&q=80&w=800';
  const imageUrls = c.image_url ?? c.image ?? [];
  const images = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : [placeholder];
  const locationFallback = venueAddr ?? c.address ?? 'Location TBD';
  return {
    venue: {
      id: c.venue_id ?? c.id,
      name: venueName ?? c.venue_name ?? c.name,
      slug: venueSlug ?? '',
      description: c.description ?? '',
      address: locationFallback,
      area: 'kuala-lumpur' as const,
      location: locationFallback,
      images,
      amenities: c.amenities ?? [],
      rating: 0,
      reviewCount: 0,
      operatingHours: { open: '7:00 AM', close: '11:00 PM', days: 'Daily' },
      createdAt: '',
    },
    court: {
      id: c.id,
      venueId: c.venue_id ?? '',
      name: c.name,
      sport,
      image_url: Array.isArray(imageUrls) ? imageUrls : null,
      hourlyRate: Number(c.hourly_rate) ?? 0,
      peakRate: Number(c.peak_rate) ?? Number(c.hourly_rate) ?? 0,
      isIndoor: false,
      displayOrder: 0,
      amenities: c.amenities ?? [],
    },
  };
};

type VenueRow = { id: string; name?: string; slug?: string; address?: string; description?: string };

const FeaturedCourts = () => {
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenuesAndCourts = async () => {
      try {
        const supabase = createClient();
        // 1) Fetch venues first
        const { data: venuesData } = await supabase.from('venues').select('id, name, slug, address, description').or('is_active.eq.true,is_active.is.null');
        console.log('Fetched Venues:', venuesData);
        const vens = (venuesData ?? []) as (VenueRow & { slug?: string })[];
        setVenues(vens);
        if (vens.length === 0) {
          setCourts([]);
          return;
        }
        const venueIds = vens.map((v) => v.id);
        // 2) Fetch courts by venue_id; no is_active filter so all venue courts are included
        const { data, error: courtsError } = await supabase
          .from('courts')
          .select('*')
          .in('venue_id', venueIds)
          .limit(50)
          .order('created_at', { ascending: false });
        console.log('Fetched Courts:', data);
        if (courtsError) console.error('Courts fetch error:', courtsError);
        setCourts((data ?? []) as CourtRow[]);
      } catch (e) {
        console.error('Featured courts fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVenuesAndCourts();
  }, []);

  // Group courts by venue_id so we show only one card per venue
  const courtsByVenue = new Map<string, CourtRow[]>();
  courts.forEach(c => {
    const vid = c.venue_id || c.id;
    if (!courtsByVenue.has(vid)) courtsByVenue.set(vid, []);
    courtsByVenue.get(vid)!.push(c);
  });

  const venueGroups: CourtRow[] = [];
  courtsByVenue.forEach((group) => {
    // Pick representative court (e.g. lowest price)
    const best = group.reduce((prev, curr) => 
      (Number(prev.hourly_rate) || 0) < (Number(curr.hourly_rate) || 0) ? prev : curr
    );
    venueGroups.push(best);
  });

  const filtered = selectedSport === 'all'
    ? venueGroups
    : venueGroups.filter((c) => {
        const vid = c.venue_id || c.id;
        const group = courtsByVenue.get(vid) || [];
        return group.some(gc => {
          const courtSport = (gc.sport ?? gc.sport_type ?? '').toString().toLowerCase();
          return courtSport === (selectedSport ?? '').toLowerCase();
        });
      });
      
  const venueById = new Map(venues.map((v) => [v.id, v]));
  const cardData = filtered.slice(0, 6).map((c) => {
    const v = c.venue_id ? venueById.get(c.venue_id) : undefined;
    return mapCourtToCard(c, v?.name, v?.address, v?.slug);
  });

  return (
    <section className="pt-12 pb-20 bg-cream" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          {/* Main heading */}
          <h2
            className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-gray-900 mb-3 leading-tight"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Book Klang Valley&apos;s
            <span className="block bg-gradient-to-r from-tomato via-vista-blue to-teal-dark bg-clip-text text-transparent">
              top-rated courts in seconds
            </span>
          </h2>

          {/* Subheading */}
          <p
            className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
          >
            Curated venues with great lighting, pro-grade surfaces, and easy parking —
            so you can focus on the game, not the logistics.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 w-full">
          <SportFilter
            selectedSport={selectedSport}
            onSelectSport={setSelectedSport}
          />
        </div>

        {/* Venue Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading courts...</div>
        ) : cardData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No courts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardData.map(({ venue, court }) => (
              <VenueCard 
                key={venue.id} 
                venue={venue} 
                court={court}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/venues">
            <Button3D variant="outline" size="lg">
              View All Courts
            </Button3D>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourts;
