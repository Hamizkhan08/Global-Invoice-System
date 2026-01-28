// Define Stop interface
export interface Stop {
  id: string; // Unique ID for React keys
  location: string;
  city: string;
}

export interface Invoice {
  id?: string;
  invoice_number?: number;
  invoice_date: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  pickup_city?: string;
  destination: string; // Keeps backward compat (acts as Drop Area)
  drop_city?: string;
  journey_date: string;
  return_date?: string;
  journey_type: 'one-way' | 'two-way';
  cab_number: string;
  cab_type: string;
  driver_name: string;
  driver_phone: string;
  fare_amount: number; // Base Fare
  toll_amount: number; // Kept for backward compatibility, but UI will prefer additional_charges
  total_amount: number;
  // Trip Type Fields
  trip_type?: 'oneway' | 'roundtrip' | 'local';
  total_km?: number;
  total_hours?: number;
  stops?: Stop[]; // Array of intermediate stops structured as objects
  additional_charges?: { type: string; amount: number }[]; // Array of extra charges
  payment_mode: 'cash' | 'upi' | 'bank';
  created_at?: string;
  updated_at?: string;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>;
