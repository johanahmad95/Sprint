-- Add latitude and longitude to venues for nearby courts feature
ALTER TABLE public.venues 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- RPC: get_nearby_courts using Haversine formula (distance in meters)
CREATE OR REPLACE FUNCTION public.get_nearby_courts(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  distance_meters INTEGER DEFAULT 10000
)
RETURNS SETOF public.venues
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT v.* FROM public.venues v
  WHERE v.latitude IS NOT NULL AND v.longitude IS NOT NULL
  AND v.is_active = true
  AND (
    6371000 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(user_lat)) * cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(v.latitude))
      ))
    )
  ) <= distance_meters
  ORDER BY (
    6371000 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(user_lat)) * cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(v.latitude))
      ))
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_courts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_courts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;
