-- Migration 2: vendor_settings table and RLS
CREATE TABLE IF NOT EXISTS public.vendor_settings (
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  whatsapp_alerts_enabled BOOLEAN DEFAULT false
);

ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor can manage own settings" ON public.vendor_settings;
CREATE POLICY "Vendor can manage own settings" ON public.vendor_settings
  FOR ALL USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());
