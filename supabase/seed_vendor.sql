-- Seed: set a user as vendor and assign a venue to them.
-- Replace YOUR_USER_ID with the profiles.id (UUID) of the user to make vendor.
-- Replace YOUR_VENUE_ID with the venues.id (UUID) to assign.

-- Example (run after replacing IDs):
-- UPDATE public.profiles SET role = 'vendor' WHERE id = 'YOUR_USER_ID';
-- UPDATE public.venues SET owner_id = 'YOUR_USER_ID' WHERE id = 'YOUR_VENUE_ID';

-- Optional: use first profile + first venue ( deterministic )
-- UPDATE public.profiles SET role = 'vendor' WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
-- UPDATE public.venues SET owner_id = (SELECT id FROM public.profiles WHERE role = 'vendor' LIMIT 1) WHERE id = (SELECT id FROM public.venues ORDER BY name LIMIT 1);
