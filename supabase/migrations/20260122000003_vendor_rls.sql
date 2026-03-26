-- Migration 3: RLS for vendor dashboard
DROP POLICY IF EXISTS "Vendors can view owned venues" ON public.venues;
CREATE POLICY "Vendors can view owned venues" ON public.venues
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can view bookings for owned venues" ON public.bookings;
CREATE POLICY "Vendors can view bookings for owned venues" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courts c
      JOIN public.venues v ON v.id = c.venue_id
      WHERE c.id = bookings.court_id AND v.owner_id = auth.uid()
    )
  );
