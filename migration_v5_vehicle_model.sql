-- Add Vehicle Model column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS vehicle_model TEXT default NULL;
