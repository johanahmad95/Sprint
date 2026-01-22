import { Venue, Court, SportType } from './types';

// Mock Venues - Klang Valley focused, Pickleball & Padel priority
export const MOCK_VENUES: Venue[] = [
  {
    id: '1',
    name: 'Ace Padel Club',
    slug: 'ace-padel-club',
    description: 'Premium padel and pickleball facility with professional-grade courts, event hosting capabilities, and a vibrant community atmosphere.',
    address: '12, Jalan Kiara 5, Mont Kiara',
    area: 'mont-kiara',
    location: 'Mont Kiara',
    images: ['/courts/padel.jpg'],
    amenities: ['Parking', 'Showers', 'Pro Shop', 'Cafe', 'Coaching'],
    rating: 4.8,
    reviewCount: 124,
    operatingHours: {
      open: '06:00',
      close: '23:00',
      days: 'Open daily',
    },
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'The Picklers KL',
    slug: 'the-picklers-kl',
    description: 'Klang Valley\'s first dedicated pickleball club featuring 8 courts, coaching programs, and regular tournaments for all skill levels.',
    address: '45, Jalan Batai, Damansara Heights',
    area: 'damansara',
    location: 'Damansara Heights',
    images: ['/courts/pickleball.jpg'],
    amenities: ['Parking', 'Showers', 'Equipment Rental', 'Coaching', 'Cafe'],
    rating: 4.9,
    reviewCount: 89,
    operatingHours: {
      open: '07:00',
      close: '22:00',
      days: 'Open daily',
    },
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'Grand Slam Arena',
    slug: 'grand-slam-arena',
    description: 'Professional-grade tennis courts with advanced lighting, comfortable seating, and locker rooms. Perfect for serious players.',
    address: '88, Persiaran KLCC',
    area: 'kuala-lumpur',
    location: 'KLCC',
    images: ['/courts/tennis.jpg'],
    amenities: ['Parking', 'Showers', 'Lockers', 'Pro Shop', 'Coaching'],
    rating: 4.7,
    reviewCount: 256,
    operatingHours: {
      open: '06:00',
      close: '22:00',
      days: 'Open 7 days',
    },
    createdAt: '2023-06-01',
  },
  {
    id: '4',
    name: 'Smash Central',
    slug: 'smash-central',
    description: 'Modern badminton facility with 12 courts, air-conditioned hall, and professional coaching available for all ages.',
    address: '23, Jalan Kerinchi, Bangsar South',
    area: 'bangsar',
    location: 'Bangsar South',
    images: ['/courts/badminton.jpg'],
    amenities: ['Parking', 'Air-Con', 'Showers', 'Equipment Rental', 'Canteen'],
    rating: 4.6,
    reviewCount: 312,
    operatingHours: {
      open: '07:00',
      close: '23:00',
      days: 'Open daily',
    },
    createdAt: '2023-03-15',
  },
  {
    id: '5',
    name: 'Goal Factory',
    slug: 'goal-factory',
    description: 'Premium indoor futsal complex with FIFA-approved turf, professional lighting, and tournament-ready facilities.',
    address: '15, Jalan Setia Prima, Setia Alam',
    area: 'shah-alam',
    location: 'Setia Alam',
    images: ['/courts/futsal.jpg'],
    amenities: ['Parking', 'Showers', 'Lockers', 'Spectator Area', 'Canteen'],
    rating: 4.5,
    reviewCount: 178,
    operatingHours: {
      open: '08:00',
      close: '00:00',
      days: 'Open daily',
    },
    createdAt: '2023-08-20',
  },
  {
    id: '6',
    name: 'Sunway Padel Hub',
    slug: 'sunway-padel-hub',
    description: 'State-of-the-art padel facility in Sunway with panoramic glass courts, coaching academy, and social events.',
    address: '3, Jalan PJS 11/15, Sunway',
    area: 'subang',
    location: 'Sunway',
    images: ['/courts/padel.jpg'],
    amenities: ['Parking', 'Showers', 'Pro Shop', 'Cafe', 'Coaching Academy'],
    rating: 4.7,
    reviewCount: 67,
    operatingHours: {
      open: '06:00',
      close: '22:00',
      days: 'Open daily',
    },
    createdAt: '2024-03-01',
  },
];

// Mock Courts
export const MOCK_COURTS: Court[] = [
  // Ace Padel Club
  {
    id: 'c1',
    venueId: '1',
    name: 'Padel Court 1',
    sport: 'padel',
    description: 'Premium glass-enclosed padel court',
    hourlyRate: 100,
    peakRate: 140,
    isIndoor: true,
    displayOrder: 1,
  },
  {
    id: 'c2',
    venueId: '1',
    name: 'Pickleball Court A',
    sport: 'pickleball',
    description: 'Professional pickleball court',
    hourlyRate: 60,
    peakRate: 80,
    isIndoor: true,
    displayOrder: 2,
  },
  // The Picklers KL
  {
    id: 'c3',
    venueId: '2',
    name: 'Court 1 - Main',
    sport: 'pickleball',
    description: 'Tournament-ready pickleball court',
    hourlyRate: 55,
    peakRate: 75,
    isIndoor: true,
    displayOrder: 1,
  },
  // Grand Slam Arena
  {
    id: 'c4',
    venueId: '3',
    name: 'Centre Court',
    sport: 'tennis',
    description: 'Professional hard court tennis',
    hourlyRate: 70,
    peakRate: 100,
    isIndoor: false,
    displayOrder: 1,
  },
  // Smash Central
  {
    id: 'c5',
    venueId: '4',
    name: 'Court 1',
    sport: 'badminton',
    description: 'Air-conditioned badminton court',
    hourlyRate: 40,
    peakRate: 55,
    isIndoor: true,
    displayOrder: 1,
  },
  // Goal Factory
  {
    id: 'c6',
    venueId: '5',
    name: 'Pitch A',
    sport: 'futsal',
    description: 'FIFA-approved artificial turf',
    hourlyRate: 120,
    peakRate: 160,
    isIndoor: true,
    displayOrder: 1,
  },
  // Sunway Padel Hub
  {
    id: 'c7',
    venueId: '6',
    name: 'Glass Court 1',
    sport: 'padel',
    description: 'Panoramic glass padel court',
    hourlyRate: 90,
    peakRate: 120,
    isIndoor: true,
    displayOrder: 1,
  },
];

// Helper function to get court with venue
export function getVenueWithCourt(venueId: string) {
  const venue = MOCK_VENUES.find(v => v.id === venueId);
  const court = MOCK_COURTS.find(c => c.venueId === venueId);
  return { venue, court };
}

// Get featured venues (prioritize Pickleball and Padel)
export function getFeaturedVenues() {
  const prioritySports: SportType[] = ['pickleball', 'padel'];
  
  return MOCK_VENUES
    .map(venue => {
      const court = MOCK_COURTS.find(c => c.venueId === venue.id);
      return { venue, court };
    })
    .filter(({ court }) => court !== undefined)
    .sort((a, b) => {
      const aIsPriority = prioritySports.includes(a.court!.sport);
      const bIsPriority = prioritySports.includes(b.court!.sport);
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return b.venue.rating - a.venue.rating;
    });
}

// Filter venues by sport
export function getVenuesBySport(sport: SportType | 'all') {
  if (sport === 'all') {
    return getFeaturedVenues();
  }
  
  return MOCK_VENUES
    .map(venue => {
      const court = MOCK_COURTS.find(c => c.venueId === venue.id && c.sport === sport);
      return { venue, court };
    })
    .filter(({ court }) => court !== undefined);
}
