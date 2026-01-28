-- Run this in Supabase SQL Editor to update your existing table

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS pickup_city TEXT,
ADD COLUMN IF NOT EXISTS drop_location TEXT,
ADD COLUMN IF NOT EXISTS drop_city TEXT,
ADD COLUMN IF NOT EXISTS return_date DATE;

-- Rename 'destination' to 'drop_location' if you prefer, or just add the new ones.
-- For now, let's keep 'destination' as legacy or alias it.
-- Actually, to avoid data loss, let's just add the new columns and we can map 'destination' to 'drop_city' in the UI if needed, 
-- but better to have explicit columns.

-- Let's stick to the plan:
-- We will use 'pickup_location' for "Pickup Area"
-- We added 'pickup_city'
-- We added 'drop_location' for "Drop Area"
-- We added 'drop_city'
-- We added 'return_date'
