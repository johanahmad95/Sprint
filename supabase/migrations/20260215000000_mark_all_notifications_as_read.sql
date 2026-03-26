-- RPC: mark all notifications as read for the current vendor (auth.uid())
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notifications
  SET is_read = true
  WHERE vendor_id = auth.uid() AND is_read = false;
$$;
