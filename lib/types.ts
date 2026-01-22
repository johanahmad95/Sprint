// ============================================
// SPRINT - TYPE DEFINITIONS
// ============================================

export type SportType = 
  | 'pickleball' 
  | 'padel' 
  | 'tennis' 
  | 'badminton' 
  | 'futsal' 
  | 'basketball' 
  | 'squash'
  | 'football';

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'completed';

export type KlangValleyArea = 
  | 'kuala-lumpur'
  | 'petaling-jaya'
  | 'damansara'
  | 'mont-kiara'
  | 'bangsar'
  | 'subang'
  | 'shah-alam'
  | 'puchong';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  area: KlangValleyArea;
  location: string; // Sub-location like "KLCC", "SS2"
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  operatingHours: {
    open: string;
    close: string;
    days: string;
  };
  createdAt: string;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sport: SportType;
  description?: string;
  image?: string;
  hourlyRate: number; // in RM
  peakRate: number; // in RM
  isIndoor: boolean;
  displayOrder: number;
}

export interface TimeSlot {
  id: string;
  courtId: string;
  startTime: string; // HH:mm format
  endTime: string;
  isPeak: boolean;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  court?: Court;
  venue?: Venue;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  duration: number; // in hours
  playerCount: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

// Hero Section Types
export interface HeroCourt {
  id: string;
  label: string;
  sport: SportType;
  image: string;
}

// Pricing Tier Types
export interface PricingTier {
  id: string;
  name: string;
  price: number; // Monthly price in RM
  yearlyPrice: number;
  description: string;
  features: string[];
  isRecommended: boolean;
  ctaText: string;
}

// Filter Types
export interface VenueFilters {
  sport?: SportType;
  area?: KlangValleyArea;
  priceRange?: [number, number];
  isIndoor?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Form Types
export interface BookingFormData {
  location: KlangValleyArea | '';
  sport: SportType | '';
  date: string;
  time: string;
  duration: number;
  playerCount: number;
}

// Sport display info
export const SPORT_INFO: Record<SportType, { label: string; icon: string; color: string }> = {
  pickleball: { label: 'Pickleball', icon: 'racquet', color: '#4CAF50' },
  padel: { label: 'Padel', icon: 'racquet', color: '#2196F3' },
  tennis: { label: 'Tennis', icon: 'tennis-ball', color: '#8BC34A' },
  badminton: { label: 'Badminton', icon: 'shuttlecock', color: '#9C27B0' },
  futsal: { label: 'Futsal', icon: 'football', color: '#FF9800' },
  basketball: { label: 'Basketball', icon: 'basketball', color: '#F44336' },
  squash: { label: 'Squash', icon: 'racquet', color: '#607D8B' },
  football: { label: 'Football', icon: 'football', color: '#4CAF50' },
};

// Area display info
export const AREA_INFO: Record<KlangValleyArea, { label: string; subLocations: string[] }> = {
  'kuala-lumpur': { 
    label: 'Kuala Lumpur', 
    subLocations: ['KLCC', 'Bukit Bintang', 'Cheras', 'Ampang'] 
  },
  'petaling-jaya': { 
    label: 'Petaling Jaya', 
    subLocations: ['SS2', 'Damansara Utama', 'Kelana Jaya'] 
  },
  'damansara': { 
    label: 'Damansara', 
    subLocations: ['Damansara Heights', 'Mutiara Damansara', 'Kota Damansara'] 
  },
  'mont-kiara': { 
    label: 'Mont Kiara', 
    subLocations: ['Sri Hartamas', 'Desa ParkCity'] 
  },
  'bangsar': { 
    label: 'Bangsar', 
    subLocations: ['Bangsar South', 'Mid Valley'] 
  },
  'subang': { 
    label: 'Subang', 
    subLocations: ['Subang Jaya', 'USJ', 'Sunway'] 
  },
  'shah-alam': { 
    label: 'Shah Alam', 
    subLocations: ['Setia Alam', 'Seksyen 7'] 
  },
  'puchong': { 
    label: 'Puchong', 
    subLocations: ['Bandar Puteri', 'IOI Mall'] 
  },
};

// Currency formatter for RM
export const formatPrice = (price: number): string => {
  return `RM ${price.toFixed(2)}`;
};
