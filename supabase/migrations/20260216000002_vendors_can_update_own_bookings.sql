-- Allow vendors to update their bookings (e.g. set status to 'cancelled')
CREATE POLICY "Vendors can update their bookings"
  ON public.bookings
  FOR UPDATE
  USING (vendor_id = auth.uid());
