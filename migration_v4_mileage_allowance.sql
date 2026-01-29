-- Add Mileage and Allowance columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS starting_km NUMERIC default NULL,
ADD COLUMN IF NOT EXISTS closing_km NUMERIC default NULL,
ADD COLUMN IF NOT EXISTS driver_allowance NUMERIC default 0;
