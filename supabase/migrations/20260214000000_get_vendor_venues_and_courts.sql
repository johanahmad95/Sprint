CREATE OR REPLACE FUNCTION get_vendor_venues_and_courts(p_vendor_id UUID)
RETURNS TABLE (
  venue_id UUID,
  venue_name TEXT,
  court_id UUID,
  court_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    v.id as venue_id,
    v.name as venue_name,
    c.id as court_id,
    c.name as court_name
  FROM public.venues v
  JOIN public.courts c ON c.venue_id = v.id
  WHERE v.owner_id = p_vendor_id
  ORDER BY v.name, c.name;
$$;
