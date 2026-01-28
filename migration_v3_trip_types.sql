-- Add Trip Type and Usage Columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS trip_type text DEFAULT 'oneway', -- 'oneway', 'roundtrip', 'local'
ADD COLUMN IF NOT EXISTS total_km numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours numeric DEFAULT 0;

-- Optional: Add check constraint for trip_type validation
ALTER TABLE invoices 
ADD CONSTRAINT check_trip_type CHECK (trip_type IN ('oneway', 'roundtrip', 'local'));
