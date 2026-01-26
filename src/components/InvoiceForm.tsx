'use client';

import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceFormData } from '@/types/invoice';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<Invoice>;
  nextInvoiceNumber: number;
}

export default function InvoiceForm({ onSubmit, nextInvoiceNumber }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fareAmount, setFareAmount] = useState<string>('');
  const [tollAmount, setTollAmount] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const totalAmount = (parseFloat(fareAmount) || 0) + (parseFloat(tollAmount) || 0);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const data: InvoiceFormData = {
      invoice_date: formData.get('invoice_date') as string,
      customer_name: formData.get('customer_name') as string,
      customer_phone: formData.get('customer_phone') as string,
      pickup_location: formData.get('pickup_location') as string,
      destination: formData.get('destination') as string,
      journey_date: formData.get('journey_date') as string,
      journey_type: formData.get('journey_type') as 'one-way' | 'two-way',
      cab_number: formData.get('cab_number') as string,
      cab_type: formData.get('cab_type') as string,
      driver_name: formData.get('driver_name') as string,
      driver_phone: formData.get('driver_phone') as string,
      fare_amount: parseFloat(fareAmount) || 0,
      toll_amount: parseFloat(tollAmount) || 0,
      total_amount: totalAmount,
      payment_mode: formData.get('payment_mode') as 'cash' | 'upi' | 'bank',
    };

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save draft to localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('invoice_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (formRef.current) {
          Object.entries(draft).forEach(([key, value]) => {
            const input = formRef.current?.elements.namedItem(key) as HTMLInputElement;
            if (input && value) {
              input.value = value as string;
              if (key === 'fare_amount') setFareAmount(value as string);
              if (key === 'toll_amount') setTollAmount(value as string);
            }
          });
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  const saveDraft = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const draft: Record<string, string> = {};
      formData.forEach((value, key) => {
        draft[key] = value as string;
      });
      localStorage.setItem('invoice_draft', JSON.stringify(draft));
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={saveDraft} className="p-4">
      {/* Invoice Info */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Invoice #</label>
            <input
              type="text"
              className="form-input"
              value={`#${nextInvoiceNumber.toString().padStart(4, '0')}`}
              disabled
              style={{ background: '#f1f5f9', fontWeight: 600 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="invoice_date"
              className="form-input"
              defaultValue={getTodayDate()}
              required
            />
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
          👤 Customer Details
        </h3>
        <div className="form-group">
          <label className="form-label">Customer Name *</label>
          <input
            type="text"
            name="customer_name"
            className="form-input"
            placeholder="Enter customer name"
            required
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            name="customer_phone"
            className="form-input"
            placeholder="Enter phone number"
            pattern="[0-9]{10}"
            required
            autoComplete="off"
          />
        </div>
      </div>

      {/* Journey Details */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
          🚗 Journey Details
        </h3>
        <div className="form-group">
          <label className="form-label">Pickup Location *</label>
          <input
            type="text"
            name="pickup_location"
            className="form-input"
            placeholder="Enter pickup location"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Destination *</label>
          <input
            type="text"
            name="destination"
            className="form-input"
            placeholder="Enter destination"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Journey Date *</label>
            <input
              type="date"
              name="journey_date"
              className="form-input"
              defaultValue={getTodayDate()}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Journey Type *</label>
            <select name="journey_type" className="form-input form-select" required>
              <option value="one-way">One Way</option>
              <option value="two-way">Two Way</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cab & Driver Details */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
          🚕 Cab & Driver Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Cab Number</label>
            <input
              type="text"
              name="cab_number"
              className="form-input"
              placeholder="MH 15 XX 1234"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cab Type</label>
            <select name="cab_type" className="form-input form-select">
              <option value="">Select</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="hatchback">Hatchback</option>
              <option value="innova">Innova</option>
              <option value="crysta">Crysta</option>
              <option value="tempo">Tempo Traveller</option>
              <option value="bus">Mini Bus</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Driver Name</label>
          <input
            type="text"
            name="driver_name"
            className="form-input"
            placeholder="Enter driver name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Driver Phone</label>
          <input
            type="tel"
            name="driver_phone"
            className="form-input"
            placeholder="Enter driver phone"
            pattern="[0-9]{10}"
          />
        </div>
      </div>

      {/* Fare Details */}
      <div className="card mb-4">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
          💰 Fare Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Fare Amount (₹) *</label>
            <input
              type="number"
              name="fare_amount"
              className="form-input"
              placeholder="0"
              value={fareAmount}
              onChange={(e) => setFareAmount(e.target.value)}
              min="0"
              step="1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Toll Amount (₹)</label>
            <input
              type="number"
              name="toll_amount"
              className="form-input"
              placeholder="0"
              value={tollAmount}
              onChange={(e) => setTollAmount(e.target.value)}
              min="0"
              step="1"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Total Amount</label>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            ₹ {totalAmount.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Payment Mode *</label>
          <div className="grid grid-cols-3 gap-3">
            {['cash', 'upi', 'bank'].map((mode) => (
              <label
                key={mode}
                className="form-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="payment_mode"
                  value={mode}
                  required
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
                {mode}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={isSubmitting}
        style={{ marginBottom: '2rem' }}
      >
        {isSubmitting ? (
          <>
            <span className="spinner"></span>
            Creating Invoice...
          </>
        ) : (
          <>
            📄 Create Invoice
          </>
        )}
      </button>
    </form>
  );
}
