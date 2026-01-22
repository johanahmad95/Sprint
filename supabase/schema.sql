-- ============================================
-- SPRINT - SUPABASE DATABASE SCHEMA
-- Sports Court Booking Platform for Klang Valley
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Sport types (priority order: Pickleball, Padel first)
CREATE TYPE sport_type AS ENUM (
  'pickleball',
  'padel', 
  'tennis',
  'badminton',
  'futsal',
  'basketball',
  'squash',
  'football'
);

-- Klang Valley areas
CREATE TYPE klang_valley_area AS ENUM (
  'kuala-lumpur',
  'petaling-jaya',
  'damansara',
  'mont-kiara',
  'bangsar',
  'subang',
  'shah-alam',
  'puchong'
);

-- Booking status
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE public.venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  area klang_valley_area NOT NULL,
  location TEXT NOT NULL, -- Sub-location like "KLCC", "SS2"
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  operating_hours JSONB DEFAULT '{"open": "06:00", "close": "22:00", "days": "Open daily"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courts table
CREATE TABLE public.courts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sport sport_type NOT NULL,
  description TEXT,
  image TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL, -- in RM
  peak_rate DECIMAL(10,2) NOT NULL,   -- in RM
  is_indoor BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time slots table (defines available slots for each court)
CREATE TABLE public.court_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_peak BOOLEAN DEFAULT false,
  day_of_week INTEGER, -- 0-6 for specific days, NULL for all days
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration DECIMAL(3,1) NOT NULL, -- in hours
  player_count INTEGER DEFAULT 2,
  total_price DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_venues_area ON public.venues(area);
CREATE INDEX idx_venues_slug ON public.venues(slug);
CREATE INDEX idx_courts_venue ON public.courts(venue_id);
CREATE INDEX idx_courts_sport ON public.courts(sport);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_court ON public.bookings(court_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Venues policies (public read)
CREATE POLICY "Venues are viewable by everyone" ON public.venues
  FOR SELECT USING (is_active = true);

-- Courts policies (public read)
CREATE POLICY "Courts are viewable by everyone" ON public.courts
  FOR SELECT USING (is_active = true);

-- Court slots policies (public read)
CREATE POLICY "Court slots are viewable by everyone" ON public.court_slots
  FOR SELECT USING (true);

-- Bookings policies
-- Allow everyone to view bookings for availability checking (to prevent double booking)
CREATE POLICY "Bookings are viewable by everyone for availability" ON public.bookings
  FOR SELECT USING (true);

-- Users can view own bookings (redundant but kept for clarity)
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courts_updated_at
  BEFORE UPDATE ON public.courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update venue rating
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.venues
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE venue_id = NEW.venue_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE venue_id = NEW.venue_id)
  WHERE id = NEW.venue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_venue_rating();

-- ============================================
-- SAMPLE DATA - Klang Valley Venues
-- ============================================

-- Insert sample venues
INSERT INTO public.venues (name, slug, description, address, area, location, images, amenities, rating, review_count, operating_hours) VALUES
('Ace Padel Club', 'ace-padel-club', 'Premium padel and pickleball facility with professional-grade courts, event hosting capabilities, and a vibrant community atmosphere.', '12, Jalan Kiara 5, Mont Kiara', 'mont-kiara', 'Mont Kiara', ARRAY['/courts/padel.jpg'], ARRAY['Parking', 'Showers', 'Pro Shop', 'Cafe', 'Coaching'], 4.8, 124, '{"open": "06:00", "close": "23:00", "days": "Open daily"}'),
('The Picklers KL', 'the-picklers-kl', 'Klang Valley''s first dedicated pickleball club featuring 8 courts, coaching programs, and regular tournaments for all skill levels.', '45, Jalan Batai, Damansara Heights', 'damansara', 'Damansara Heights', ARRAY['/courts/pickleball.jpg'], ARRAY['Parking', 'Showers', 'Equipment Rental', 'Coaching', 'Cafe'], 4.9, 89, '{"open": "07:00", "close": "22:00", "days": "Open daily"}'),
('Grand Slam Arena', 'grand-slam-arena', 'Professional-grade tennis courts with advanced lighting, comfortable seating, and locker rooms. Perfect for serious players.', '88, Persiaran KLCC', 'kuala-lumpur', 'KLCC', ARRAY['/courts/tennis.jpg'], ARRAY['Parking', 'Showers', 'Lockers', 'Pro Shop', 'Coaching'], 4.7, 256, '{"open": "06:00", "close": "22:00", "days": "Open 7 days"}'),
('Smash Central', 'smash-central', 'Modern badminton facility with 12 courts, air-conditioned hall, and professional coaching available for all ages.', '23, Jalan Kerinchi, Bangsar South', 'bangsar', 'Bangsar South', ARRAY['/courts/badminton.jpg'], ARRAY['Parking', 'Air-Con', 'Showers', 'Equipment Rental', 'Canteen'], 4.6, 312, '{"open": "07:00", "close": "23:00", "days": "Open daily"}'),
('Goal Factory', 'goal-factory', 'Premium indoor futsal complex with FIFA-approved turf, professional lighting, and tournament-ready facilities.', '15, Jalan Setia Prima, Setia Alam', 'shah-alam', 'Setia Alam', ARRAY['/courts/futsal.jpg'], ARRAY['Parking', 'Showers', 'Lockers', 'Spectator Area', 'Canteen'], 4.5, 178, '{"open": "08:00", "close": "00:00", "days": "Open daily"}'),
('Sunway Padel Hub', 'sunway-padel-hub', 'State-of-the-art padel facility in Sunway with panoramic glass courts, coaching academy, and social events.', '3, Jalan PJS 11/15, Sunway', 'subang', 'Sunway', ARRAY['/courts/padel.jpg'], ARRAY['Parking', 'Showers', 'Pro Shop', 'Cafe', 'Coaching Academy'], 4.7, 67, '{"open": "06:00", "close": "22:00", "days": "Open daily"}');

-- Insert sample courts
INSERT INTO public.courts (venue_id, name, sport, description, hourly_rate, peak_rate, is_indoor, display_order) VALUES
((SELECT id FROM public.venues WHERE slug = 'ace-padel-club'), 'Padel Court 1', 'padel', 'Premium glass-enclosed padel court', 100.00, 140.00, true, 1),
((SELECT id FROM public.venues WHERE slug = 'ace-padel-club'), 'Pickleball Court A', 'pickleball', 'Professional pickleball court', 60.00, 80.00, true, 2),
((SELECT id FROM public.venues WHERE slug = 'the-picklers-kl'), 'Court 1 - Main', 'pickleball', 'Tournament-ready pickleball court', 55.00, 75.00, true, 1),
((SELECT id FROM public.venues WHERE slug = 'grand-slam-arena'), 'Centre Court', 'tennis', 'Professional hard court tennis', 70.00, 100.00, false, 1),
((SELECT id FROM public.venues WHERE slug = 'smash-central'), 'Court 1', 'badminton', 'Air-conditioned badminton court', 40.00, 55.00, true, 1),
((SELECT id FROM public.venues WHERE slug = 'goal-factory'), 'Pitch A', 'futsal', 'FIFA-approved artificial turf', 120.00, 160.00, true, 1),
((SELECT id FROM public.venues WHERE slug = 'sunway-padel-hub'), 'Glass Court 1', 'padel', 'Panoramic glass padel court', 90.00, 120.00, true, 1);

-- Insert sample time slots (for each court, 6am to 10pm)
DO $$
DECLARE
  court_record RECORD;
  slot_hour INTEGER;
BEGIN
  FOR court_record IN SELECT id FROM public.courts LOOP
    FOR slot_hour IN 6..22 LOOP
      INSERT INTO public.court_slots (court_id, start_time, end_time, is_peak)
      VALUES (
        court_record.id,
        (slot_hour || ':00')::TIME,
        ((slot_hour + 1) || ':00')::TIME,
        slot_hour >= 18 AND slot_hour <= 21 -- Peak hours: 6pm-9pm
      );
    END LOOP;
  END LOOP;
END $$;
