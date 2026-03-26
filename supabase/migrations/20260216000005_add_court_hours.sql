-- Add opening_hour and closing_hour to courts table
-- Default to 07:00 and 23:00 as requested
ALTER TABLE public.courts
ADD COLUMN opening_hour TIME DEFAULT '07:00:00',
ADD COLUMN closing_hour TIME DEFAULT '23:00:00';
