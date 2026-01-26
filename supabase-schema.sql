-- =============================================
-- Global Tours & Travels - Invoice Database Schema
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number SERIAL UNIQUE,
  invoice_date DATE DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  journey_date DATE NOT NULL,
  journey_type TEXT CHECK (journey_type IN ('one-way', 'two-way')),
  cab_number TEXT,
  cab_type TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  fare_amount DECIMAL(10,2) NOT NULL,
  toll_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  stops JSONB DEFAULT '[]'::jsonb, -- Array of intermediate stops
  additional_charges JSONB DEFAULT '[]'::jsonb, -- Array of {type, amount}
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all invoices
CREATE POLICY "Authenticated users can view invoices" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert invoices
CREATE POLICY "Authenticated users can create invoices" ON invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update invoices
CREATE POLICY "Authenticated users can update invoices" ON invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete invoices
CREATE POLICY "Authenticated users can delete invoices" ON invoices
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_phone ON invoices(customer_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- =============================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://app.supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor (left sidebar)
-- 4. Paste this entire SQL and click "Run"
-- 5. Go to Authentication > Users to create an admin user
-- =============================================
