-- View for vendor dashboard: bookings with venue/court names, vendor_id and customer_name for filtering.
-- RLS on underlying tables applies (security_invoker = true).
-- Customer name comes from public.profiles (joined on user_id).
CREATE OR REPLACE VIEW public.vendor_bookings_view
WITH (security_invoker = true)
AS
SELECT
  b.id AS booking_id,
  b.user_id,
  b.court_id,
  b.venue_id,
  b.booking_date,
  b.start_time::TEXT AS start_time,
  b.end_time::TEXT AS end_time,
  b.total_price,
  b.status,
  COALESCE(b.vendor_id, c.vendor_id) AS vendor_id,
  v.name AS venue_name,
  c.name AS court_name,
  p.full_name AS customer_name
FROM public.bookings b
LEFT JOIN public.courts c ON c.id = b.court_id
LEFT JOIN public.venues v ON v.id = COALESCE(b.venue_id, c.venue_id)
LEFT JOIN public.profiles p ON p.id = b.user_id;

GRANT SELECT ON public.vendor_bookings_view TO authenticated;
