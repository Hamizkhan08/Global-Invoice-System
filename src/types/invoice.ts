export interface Invoice {
  id?: string;
  invoice_number?: number;
  invoice_date: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  destination: string;
  journey_date: string;
  journey_type: 'one-way' | 'two-way';
  cab_number: string;
  cab_type: string;
  driver_name: string;
  driver_phone: string;
  fare_amount: number;
  toll_amount: number;
  total_amount: number;
  payment_mode: 'cash' | 'upi' | 'bank';
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceFormData extends Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'> {}
