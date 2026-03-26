-- Allow users to update their own bookings (e.g. set status to 'cancelled').
-- Replaces the restrictive "Users can update own pending bookings" so confirmed bookings can be cancelled.
DROP POLICY IF EXISTS "Users can update own pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
