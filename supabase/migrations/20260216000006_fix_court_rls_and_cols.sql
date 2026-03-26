-- Ensure opening_hour and closing_hour exist (idempotent check not strictly needed if previous migration ran, but good for safety)
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS opening_hour TIME DEFAULT '07:00:00',
  ADD COLUMN IF NOT EXISTS closing_hour TIME DEFAULT '23:00:00';

-- RLS Policies for Vendors to Manage Their Own Courts

-- 1. Enable RLS (already enabled in schema, but good to ensure)
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- 2. INSERT Policy
DROP POLICY IF EXISTS "Vendors can insert courts" ON public.courts;
CREATE POLICY "Vendors can insert courts" ON public.courts
  FOR INSERT
  WITH CHECK (
    auth.uid() = vendor_id
  );

-- 3. UPDATE Policy
DROP POLICY IF EXISTS "Vendors can update own courts" ON public.courts;
CREATE POLICY "Vendors can update own courts" ON public.courts
  FOR UPDATE
  USING (
    auth.uid() = vendor_id
  );

-- 4. DELETE Policy
DROP POLICY IF EXISTS "Vendors can delete own courts" ON public.courts;
CREATE POLICY "Vendors can delete own courts" ON public.courts
  FOR DELETE
  USING (
    auth.uid() = vendor_id
  );
