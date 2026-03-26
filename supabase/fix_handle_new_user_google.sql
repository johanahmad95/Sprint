-- ============================================
-- FIX: handle_new_user for Google OAuth & Database Audit
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================

-- ============================================
-- TASK 1: Replace handle_new_user with Safe Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name   TEXT;
  v_avatar_url  TEXT;
  v_role        public.user_role := 'user'::public.user_role;
BEGIN
  -- Gracefully extract full_name from Google / OAuth metadata
  -- Google uses: full_name, name; some providers use fullName
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'fullName'), ''),
    NULLIF(TRIM(NEW.email), ''),
    'User'
  );

  -- Gracefully extract avatar_url from OAuth metadata
  -- Google uses: avatar_url, picture
  v_avatar_url := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- Resolve role from metadata; default to 'user'
  IF NEW.raw_user_meta_data->>'role' = 'vendor' THEN
    v_role := 'vendor'::public.user_role;
  ELSIF NEW.raw_user_meta_data->>'role' = 'both' THEN
    v_role := 'both'::public.user_role;
  ELSE
    v_role := 'user'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    v_full_name,
    NULLIF(v_avatar_url, ''),  -- Store NULL if empty string
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- TASK 2: Database Audit – Make Non-Essential Columns Nullable
-- ============================================

-- Make full_name nullable (trigger now always provides a value, but belt-and-suspenders)
-- Skip if you want to keep NOT NULL for data integrity; the trigger guarantees a value.
-- ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;  -- Optional

-- Make username nullable if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;
  END IF;
END $$;

-- Make phone nullable (only if currently NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

-- Make avatar_url nullable (only if currently NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN avatar_url DROP NOT NULL;
  END IF;
END $$;


-- ============================================
-- TASK 2 (cont.): Grant Permissions for supabase_auth_admin
-- ============================================

-- Allow supabase_auth_admin to execute the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Allow supabase_auth_admin to use public schema and insert into profiles
-- (Required when the trigger runs in some edge cases; SECURITY DEFINER usually suffices)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;

-- Ensure the function owner (postgres) retains full access
GRANT ALL ON public.profiles TO postgres;


-- ============================================
-- VERIFICATION (optional – run separately to check)
-- ============================================
-- SELECT proname, prosecdef, proconfig 
--   FROM pg_proc 
--   WHERE proname = 'handle_new_user';
-- Expected: prosecdef = true, proconfig includes search_path=''
