-- Notifications table for vendor booking alerts and trigger from bookings

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view their notifications" ON public.notifications;
CREATE POLICY "Vendors can view their notifications" ON public.notifications
  FOR SELECT
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can update their notifications" ON public.notifications;
CREATE POLICY "Vendors can update their notifications" ON public.notifications
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Trigger function to create notifications on new bookings
CREATE OR REPLACE FUNCTION public.handle_new_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  court_name TEXT;
  customer_name TEXT;
  display_name TEXT;
  booking_date_text TEXT;
  booking_time_text TEXT;
BEGIN
  -- Only create a notification when we have a vendor_id
  IF NEW.vendor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO court_name
  FROM public.courts
  WHERE id = NEW.court_id;

  SELECT COALESCE(full_name, email) INTO customer_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  display_name := COALESCE(customer_name, 'A customer');
  booking_date_text := to_char(NEW.booking_date, 'YYYY-MM-DD');
  booking_time_text := COALESCE(NEW.start_time, '');

  INSERT INTO public.notifications (vendor_id, booking_id, message)
  VALUES (
    NEW.vendor_id,
    NEW.id,
    display_name || ' has booked ' ||
      COALESCE(court_name, 'a court') ||
      ' for ' || booking_date_text ||
      CASE
        WHEN booking_time_text <> '' THEN ' at ' || booking_time_text
        ELSE ''
      END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_booking_notification ON public.bookings;
CREATE TRIGGER trg_handle_new_booking_notification
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_booking_notification();

