-- Fix data inconsistency: Backfill court.venue_id from venue_name if missing
UPDATE public.courts c
SET venue_id = v.id
FROM public.venues v
WHERE c.venue_id IS NULL
  AND c.venue_name = v.name;

-- Backfill bookings.venue_id from courts.venue_id
UPDATE public.bookings b
SET venue_id = c.venue_id
FROM public.courts c
WHERE b.court_id = c.id
  AND (b.venue_id IS NULL OR b.venue_id != c.venue_id)
  AND c.venue_id IS NOT NULL;
