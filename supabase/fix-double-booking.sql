-- ============================================
-- FIX: Allow Everyone to View Bookings for Availability
-- This prevents double booking by allowing all users (including unauthenticated)
-- to see which time slots are already booked
-- ============================================

-- Add policy to allow everyone to view bookings for availability checking
-- This will allow all users (authenticated and unauthenticated) to see
-- which time slots are booked, preventing double bookings
CREATE POLICY "Bookings are viewable by everyone for availability" ON public.bookings
  FOR SELECT USING (true);

-- Note: The existing policy "Users can view own bookings" can remain
-- as it's redundant but doesn't cause conflicts. Both policies allow
-- the SELECT operation, and Supabase will grant access if any policy allows it.

-- ============================================
-- Verification Query (Optional - run this to verify it works)
-- ============================================
-- SELECT * FROM public.bookings LIMIT 5;
