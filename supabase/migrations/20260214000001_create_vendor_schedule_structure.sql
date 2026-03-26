-- Create a view to simplify fetching vendor schedule structure (venues and courts)
CREATE OR REPLACE VIEW vendor_schedule_structure WITH (security_invoker = true) AS
SELECT 
  v.id as venue_id,
  v.name as venue_name,
  c.id as court_id,
  c.name as court_name,
  -- Use venues.owner_id as the source of truth for vendor ownership
  v.owner_id as vendor_id
FROM public.venues v
JOIN public.courts c ON c.venue_id = v.id;

-- Grant access to authenticated users (so vendors can query it)
GRANT SELECT ON vendor_schedule_structure TO authenticated;
