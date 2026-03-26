-- Ensure new venues automatically link to the logged-in vendor via owner_id

CREATE OR REPLACE FUNCTION public.set_venue_owner_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_venue_owner_id ON public.venues;
CREATE TRIGGER trg_set_venue_owner_id
BEFORE INSERT ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.set_venue_owner_id();

