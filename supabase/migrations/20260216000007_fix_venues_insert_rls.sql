-- Allow vendors to create their own venues
-- Ensures inserts into public.venues succeed when called from the vendor dashboard

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Vendors (authenticated users) can insert venues where they are the owner
DROP POLICY IF EXISTS "Vendors can insert owned venues" ON public.venues;
CREATE POLICY "Vendors can insert owned venues" ON public.venues
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());


