-- Allow public (anon) and authenticated users to view venues and courts on the main website.
-- Without these, the home and venues pages return no rows for unauthenticated users.

-- Venues: public can see active venues (is_active = true or null so new venues appear)
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
CREATE POLICY "Venues are viewable by everyone" ON public.venues
  FOR SELECT USING (is_active = true OR is_active IS NULL);

-- Courts: public can see all courts (including newly added with is_active = false so they appear after add)
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON public.courts;
CREATE POLICY "Courts are viewable by everyone" ON public.courts
  FOR SELECT USING (true);
