-- Link courts and bookings directly to vendors

-- 1) Add vendor_id to courts and backfill from venues.owner_id
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.courts AS c
SET vendor_id = v.owner_id
FROM public.venues AS v
WHERE c.venue_id = v.id
  AND c.vendor_id IS NULL
  AND v.owner_id IS NOT NULL;

-- Maintain vendor_id on courts when inserting
CREATE OR REPLACE FUNCTION public.set_court_vendor_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vendor_id IS NULL AND NEW.venue_id IS NOT NULL THEN
    SELECT owner_id INTO NEW.vendor_id
    FROM public.venues
    WHERE id = NEW.venue_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_court_vendor_id ON public.courts;
CREATE TRIGGER trg_set_court_vendor_id
BEFORE INSERT ON public.courts
FOR EACH ROW
EXECUTE FUNCTION public.set_court_vendor_id();

-- 2) Add vendor_id to bookings and backfill from courts.vendor_id
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.bookings AS b
SET vendor_id = c.vendor_id
FROM public.courts AS c
WHERE b.court_id = c.id
  AND b.vendor_id IS NULL
  AND c.vendor_id IS NOT NULL;

-- Maintain vendor_id on bookings when inserting
CREATE OR REPLACE FUNCTION public.set_booking_vendor_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vendor_id IS NULL AND NEW.court_id IS NOT NULL THEN
    SELECT vendor_id INTO NEW.vendor_id
    FROM public.courts
    WHERE id = NEW.court_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_vendor_id ON public.bookings;
CREATE TRIGGER trg_set_booking_vendor_id
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_vendor_id();

-- Optional, simpler RLS policy for bookings using vendor_id (select only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    BEGIN
      ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;

    DROP POLICY IF EXISTS "Vendors can view bookings by vendor_id" ON public.bookings;
    CREATE POLICY "Vendors can view bookings by vendor_id" ON public.bookings
      FOR SELECT
      USING (vendor_id = auth.uid());
  END IF;
END $$;

