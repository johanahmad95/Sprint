-- Add venue_id to bookings for direct join to venues (fixes Live Booking tracker "Unknown Venue")
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

UPDATE public.bookings AS b
SET venue_id = c.venue_id
FROM public.courts AS c
WHERE b.court_id = c.id
  AND (b.venue_id IS NULL OR b.venue_id != c.venue_id)
  AND c.venue_id IS NOT NULL;

-- Keep venue_id in sync when court_id is set
CREATE OR REPLACE FUNCTION public.set_booking_venue_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.court_id IS NOT NULL THEN
    SELECT venue_id INTO NEW.venue_id
    FROM public.courts
    WHERE id = NEW.court_id;
  ELSE
    NEW.venue_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_venue_id ON public.bookings;
CREATE TRIGGER trg_set_booking_venue_id
BEFORE INSERT OR UPDATE OF court_id ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_venue_id();
