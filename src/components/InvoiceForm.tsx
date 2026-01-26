'use client';

import { useState, useEffect, useRef } from 'react';
import { Invoice, InvoiceFormData } from '@/types/invoice';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<Invoice>;
  nextInvoiceNumber: number;
  initialData?: Invoice; // For Editing
}

export default function InvoiceForm({ onSubmit, nextInvoiceNumber, initialData }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Dynamic Fields - Initialize from initialData if present
  const [stops, setStops] = useState<string[]>(initialData?.stops || []);
  const [additionalCharges, setAdditionalCharges] = useState<{ type: string; amount: number }[]>(
    initialData?.additional_charges || []
  );
  
  // Base Amounts - Initialize from initialData
  const [baseFare, setBaseFare] = useState<number>(initialData?.fare_amount || 0);
  
  // Calculate Total
  const totalAmount = baseFare + additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

  // Draft Loading (Only if NOT editing)
  useEffect(() => {
    if (initialData) return; // Skip draft loading if we are editing an existing invoice

    const savedDraft = localStorage.getItem('invoice_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Load simple fields via ref
        if (formRef.current) {
          Object.entries(draft).forEach(([key, value]) => {
            const input = formRef.current?.elements.namedItem(key) as HTMLInputElement;
            if (input && typeof value === 'string') {
              input.value = value;
            }
          });
        }
        // Load complex state
        if (draft.stops) setStops(draft.stops);
        if (draft.additionalCharges) setAdditionalCharges(draft.additionalCharges);
        if (draft.baseFare) setBaseFare(draft.baseFare);
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Save Draft
  const saveDraft = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const draft: any = {};
      formData.forEach((value, key) => {
        draft[key] = value as string;
      });
      // Save complex state
      draft.stops = stops;
      draft.additionalCharges = additionalCharges;
      draft.baseFare = baseFare;
      localStorage.setItem('invoice_draft', JSON.stringify(draft));
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const loadPresetCharges = (type: string) => {
    if (type === 'toll') {
      const newCharges = [...additionalCharges];
      if (!newCharges.find(c => c.type === 'Toll')) {
        newCharges.push({ type: 'Toll', amount: 0 });
        setAdditionalCharges(newCharges);
        saveDraft();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Filter out empty stops and zero charges for cleaner data
    const finalStops = stops.filter(s => s.trim() !== '');
    const finalCharges = additionalCharges.filter(c => c.amount > 0);

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
      
      fare_amount: baseFare,
      toll_amount: 0, // Deprecated in favor of additional_charges
      total_amount: totalAmount,
      
      stops: finalStops,
      additional_charges: finalCharges,
      
      payment_mode: formData.get('payment_mode') as 'cash' | 'upi' | 'bank',
    };

    try {
      await onSubmit(data);
      // Clear draft on success
      localStorage.removeItem('invoice_draft');
    } catch (error) {
      console.error('Error submitting invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={saveDraft} className="p-4">
      {/* 1. Header Info */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Invoice #</label>
            <input
              type="text"
              className="form-input bg-slate-100 font-bold"
              value={`#${nextInvoiceNumber.toString().padStart(4, '0')}`}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="invoice_date"
              className="form-input"
              defaultValue={initialData?.invoice_date || getTodayDate()}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Customer Details */}
      <div className="card mb-4">
        <h3 className="section-title">👤 Customer Details</h3>
        <div className="form-group">
          <label className="form-label">Customer Name *</label>
          <input 
            type="text" 
            name="customer_name" 
            className="form-input" 
            required 
            placeholder="Full Name" 
            defaultValue={initialData?.customer_name}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input 
            type="tel" 
            name="customer_phone" 
            className="form-input" 
            required 
            placeholder="10-digit mobile" 
            pattern="[0-9]{10}" 
            defaultValue={initialData?.customer_phone}
          />
        </div>
      </div>

      {/* 3. Journey Details with STOPS */}
      <div className="card mb-4">
        <h3 className="section-title">🚗 Journey Details</h3>
        
        {/* Pickup */}
        <div className="form-group">
          <label className="form-label text-green-600">🟢 Pickup Location *</label>
          <input 
            type="text" 
            name="pickup_location" 
            className="form-input" 
            required 
            placeholder="Start Point" 
            defaultValue={initialData?.pickup_location}
          />
        </div>

        {/* Dynamic Stops */}
        {stops.map((stop, index) => (
          <div key={index} className="form-group relative">
            <label className="form-label text-blue-600">Search Stop {index + 1}</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={stop}
                onChange={(e) => {
                  const newStops = [...stops];
                  newStops[index] = e.target.value;
                  setStops(newStops);
                  saveDraft();
                }}
                className="form-input" 
                placeholder={`Intermediate Stop ${index + 1}`}
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => {
                  const newStops = stops.filter((_, i) => i !== index);
                  setStops(newStops);
                  saveDraft();
                }}
                className="px-3 text-red-500 bg-red-50 rounded border border-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={() => {
            setStops([...stops, '']);
            saveDraft();
          }}
          className="text-sm text-blue-600 font-medium mb-4 flex items-center hover:bg-blue-50 p-2 rounded w-full justify-center border border-dashed border-blue-200"
        >
          + Add Intermediate Stop
        </button>

        {/* Destination */}
        <div className="form-group">
          <label className="form-label text-red-600">🔴 Destination *</label>
          <input 
            type="text" 
            name="destination" 
            className="form-input" 
            required 
            placeholder="End Point" 
            defaultValue={initialData?.destination}
          />
        </div>

        {/* Journey Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Journey Date *</label>
            <input 
              type="date" 
              name="journey_date" 
              className="form-input" 
              defaultValue={initialData?.journey_date || getTodayDate()} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select 
              name="journey_type" 
              className="form-input form-select" 
              required
              defaultValue={initialData?.journey_type}
            >
              <option value="one-way">One Way</option>
              <option value="two-way">Two Way</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cab #</label>
            <input 
              type="text" 
              name="cab_number" 
              className="form-input" 
              placeholder="MH 12 AB 1234" 
              defaultValue={initialData?.cab_number}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cab Type</label>
            <select 
              name="cab_type" 
              className="form-input form-select"
              defaultValue={initialData?.cab_type}
            >
              <optgroup label="Select Type">
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="innova">Innova</option>
                <option value="crysta">Crysta</option>
                <option value="tempo">Traveller</option>
              </optgroup>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Driver Name</label>
            <input 
              type="text" 
              name="driver_name" 
              className="form-input" 
              placeholder="Enter driver name" 
              defaultValue={initialData?.driver_name}
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
              defaultValue={initialData?.driver_phone}
            />
          </div>
        </div>
      </div>

      {/* 4. Payment & BREAKDOWN */}
      <div className="card mb-4 border-2 border-primary/10">
        <h3 className="section-title">💰 Fare Breakdown</h3>
        
        {/* Base Fare */}
        <div className="form-group bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-1">
            <label className="form-label mb-0">Base Fare (₹) *</label>
          </div>
           <input
            type="number"
            className="form-input text-lg font-bold text-gray-800"
            value={baseFare || ''}
            onChange={(e) => {
              setBaseFare(parseFloat(e.target.value) || 0);
              saveDraft();
            }}
            placeholder="0"
            min="0"
            required
          />
        </div>

        {/* Dynamic Additional Charges */}
        <div className="space-y-3 mb-4">
          <label className="form-label block text-sm font-medium text-gray-500 uppercase tracking-wide">Additional Charges</label>
          
          {additionalCharges.map((charge, index) => (
            <div key={index} className="flex gap-2 items-center animate-fadeIn">
              <select
                value={charge.type}
                onChange={(e) => {
                  const newCharges = [...additionalCharges];
                  newCharges[index].type = e.target.value;
                  setAdditionalCharges(newCharges);
                  saveDraft();
                }}
                className="form-input w-1/2 text-sm"
              >
                <option value="Waiting Charge">Waiting Charge</option>
                <option value="Food Cost">Food Cost</option>
                <option value="Toll">Toll</option>
                <option value="Parking">Parking</option>
                <option value="Night Charge">Night Charge</option>
                <option value="Extra KM">Extra KM</option>
                <option value="Other">Other</option>
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={charge.amount || ''}
                  onChange={(e) => {
                    const newCharges = [...additionalCharges];
                    newCharges[index].amount = parseFloat(e.target.value) || 0;
                    setAdditionalCharges(newCharges);
                    saveDraft();
                  }}
                  className="form-input pl-6"
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newCharges = additionalCharges.filter((_, i) => i !== index);
                  setAdditionalCharges(newCharges);
                  saveDraft();
                }}
                 className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: '+ Waiting', type: 'Waiting Charge' },
              { label: '+ Food', type: 'Food Cost' },
              { label: '+ Toll', type: 'Toll' },
              { label: '+ Other', type: 'Other' }
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => {
                  setAdditionalCharges([...additionalCharges, { type: btn.type, amount: 0 }]);
                  saveDraft();
                }}
                className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total Display */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg mt-6">
           <div className="flex justify-between items-center mb-2 text-slate-400 text-sm">
             <span>Base Fare</span>
             <span>₹ {baseFare.toLocaleString()}</span>
           </div>
           {additionalCharges.length > 0 && (
             <div className="flex justify-between items-center mb-2 text-slate-400 text-sm border-b border-slate-700 pb-2">
               <span>Extras</span>
               <span>+ ₹ {additionalCharges.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString()}</span>
             </div>
           )}
           <div className="flex justify-between items-end">
             <span className="text-lg font-medium">Total Amount</span>
             <span className="text-3xl font-bold tracking-tight">₹ {totalAmount.toLocaleString('en-IN')}</span>
           </div>
        </div>
      </div>

       {/* Payment Mode */}
       <div className="card mb-6">
        <label className="form-label">Payment Mode</label>
        <div className="grid grid-cols-3 gap-3">
          {['cash', 'upi', 'bank'].map((mode) => (
            <label key={mode} className="cursor-pointer">
              <input 
                type="radio" 
                name="payment_mode" 
                value={mode} 
                className="peer sr-only" 
                required 
                defaultChecked={initialData?.payment_mode === mode}
              />
              <div className="text-center py-2 rounded-md border text-sm font-semibold uppercase text-slate-600 bg-white border-slate-200 hover:bg-slate-50 peer-checked:bg-slate-800 peer-checked:text-white peer-checked:border-slate-800 transition-all">
                {mode}
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <span className="animate-pulse">{initialData ? 'Updating...' : 'Creating...'}</span>
        ) : (
          <>
            <span>{initialData ? '💾 Update Invoice' : '📄 Generate Invoice'}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">₹ {totalAmount.toLocaleString()}</span>
          </>
        )}
      </button>
    </form>
  );
}
