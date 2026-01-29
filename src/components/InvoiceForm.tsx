'use client';

import { useRef, useState, useEffect } from 'react';
import { Invoice, InvoiceFormData, Stop } from '@/types/invoice';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<Invoice>;
  nextInvoiceNumber: number;
  initialData?: Invoice; // For Editing
}

const defaultStop: Stop = {
  id: '',
  location: '',
  city: ''
};

export default function InvoiceForm({ onSubmit, nextInvoiceNumber, initialData }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Dynamic Fields - Initialize from initialData if present
  // Normalize stops to ensure they are objects (backward compatibility for draft/old data)
  const initialStops = initialData?.stops?.map(s => {
    if (typeof s === 'string') return { id: crypto.randomUUID(), location: s, city: '' };
    return s;
  }) || [];

  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [additionalCharges, setAdditionalCharges] = useState<{ type: string; amount: number }[]>(
    initialData?.additional_charges || []
  );
  
  // Trip Type State
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'local'>((initialData?.trip_type as 'oneway' | 'roundtrip' | 'local') || 'oneway');

  // Base Amounts - Initialize from initialData
  const [baseFare, setBaseFare] = useState<number>(initialData?.fare_amount || 0);
  
  // Local Trip Fields
  const [totalKm, setTotalKm] = useState<number>(initialData?.total_km || 0);
  const [totalHours, setTotalHours] = useState<number>(initialData?.total_hours || 0);

  // New Fields
  const [vehicleModel, setVehicleModel] = useState<string>(initialData?.vehicle_model || '');
  const [startingKm, setStartingKm] = useState<number>(initialData?.starting_km || 0);
  const [closingKm, setClosingKm] = useState<number>(initialData?.closing_km || 0);
  const [driverAllowance, setDriverAllowance] = useState<number>(initialData?.driver_allowance || 0);

  // Calculate Total
  const totalAmount = baseFare + additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0) + driverAllowance;

  // Draft Loading (Only if NOT editing)
  useEffect(() => {
    if (initialData) return; // Editing existing invoice

    const savedDraft = localStorage.getItem('invoice_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (formRef.current) {
          Object.entries(draft).forEach(([key, value]) => {
             // Skip if value is not string (like tripType state stored in draft)
             if (typeof value !== 'string') return;
             const input = formRef.current?.elements.namedItem(key) as HTMLInputElement;
             if (input) input.value = value;
          });
        }
        // Load complex state
        if (draft.stops) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedStops = draft.stops.map((s: any) => {
            if (typeof s === 'string') return { id: crypto.randomUUID(), location: s, city: '' };
            return s;
          });
          setStops(loadedStops);
        }
        if (draft.additionalCharges) setAdditionalCharges(draft.additionalCharges);
        if (draft.baseFare) setBaseFare(draft.baseFare);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (draft.tripType) setTripType(draft.tripType as any);
        if (draft.totalKm) setTotalKm(draft.totalKm);
        if (draft.totalHours) setTotalHours(draft.totalHours);
        if (draft.vehicleModel) setVehicleModel(draft.vehicleModel);
        if (draft.startingKm) setStartingKm(draft.startingKm);
        if (draft.closingKm) setClosingKm(draft.closingKm);
        if (draft.driverAllowance) setDriverAllowance(draft.driverAllowance);

      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, [initialData]);

  // Save Draft
  const saveDraft = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draft: any = {};
      formData.forEach((value, key) => {
        draft[key] = value as string;
      });
      // Save complex state
      draft.stops = stops;
      draft.additionalCharges = additionalCharges;
      draft.baseFare = baseFare;
      draft.vehicleModel = vehicleModel;
      draft.startingKm = startingKm;
      draft.closingKm = closingKm;
      draft.driverAllowance = driverAllowance;
      localStorage.setItem('invoice_draft', JSON.stringify(draft));
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Filter out empty stops
    const finalStops = stops.filter(s => s.location.trim() !== '');
    const finalCharges = additionalCharges.filter(c => c.amount > 0);

    const data: InvoiceFormData = {
      invoice_date: formData.get('invoice_date') as string,
      customer_name: formData.get('customer_name') as string,
      customer_phone: formData.get('customer_phone') as string,
      
      // Combine for backward compatibility if needed, or just store main
      pickup_location: formData.get('pickup_location') as string,
      pickup_city: formData.get('pickup_city') as string,
      
      destination: formData.get('destination') as string, // Drop Area
      drop_city: formData.get('drop_city') as string,
      
      journey_date: formData.get('journey_date') as string,
      return_date: formData.get('return_date') as string,
      
      journey_type: formData.get('journey_type') as 'one-way' | 'two-way',
      cab_number: formData.get('cab_number') as string,
      cab_type: formData.get('cab_type') as string,
      driver_name: formData.get('driver_name') as string,
      driver_phone: formData.get('driver_phone') as string,
      
      fare_amount: baseFare,
      toll_amount: 0, 
      total_amount: totalAmount,
      
      stops: finalStops,
      additional_charges: finalCharges,
      
      payment_mode: formData.get('payment_mode') as 'cash' | 'upi' | 'bank',
      
      // Trip Types Support
      trip_type: tripType,
      total_km: tripType === 'local' ? totalKm : undefined,
      total_hours: tripType === 'local' ? totalHours : undefined,
      starting_km: startingKm || undefined,
      closing_km: closingKm || undefined,
      driver_allowance: driverAllowance || undefined,
      vehicle_model: vehicleModel || undefined
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

  // Helper: Prevent negative inputs
  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Helper: Format Vehicle Number (XX 00 XX 0000)
  const formatVehicleNumber = (value: string) => {
    // Remove all non-alphanumeric chars
    const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Insert spaces at specific positions
    // Standard format: MH 12 AB 1234
    
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.slice(0, 2) + ' ' + raw.slice(2);
    }
    if (raw.length > 4) {
      formatted = formatted.slice(0, 5) + ' ' + raw.slice(4);
    }
    if (raw.length > 6) {
       formatted = formatted.slice(0, 8) + ' ' + raw.slice(6);
    }
    
    return formatted.slice(0, 13); // Max length with spaces
  };

  // Helper for phone validation
  const validatePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    e.target.value = val;
    saveDraft();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={saveDraft} className="p-4">
      
      {/* 1. Header Info (Sticky & Modern) */}
      <header className="sticky top-0 z-20 bg-blue-700 text-white shadow-md transition-colors -mx-4 -mt-4 px-6 py-6 mb-6 flex flex-col items-center justify-center rounded-b-3xl">
        <h1 className="text-2xl font-bold tracking-wide">
          Global Tours & Travels
        </h1>
        <p className="text-sm text-blue-100 font-medium mt-1">Create Professional Invoice</p>
      </header>

      {/* Invoice Meta */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group mb-0">
            <label className="form-label">Invoice #</label>
            <input
              type="text"
              className="form-input bg-slate-100 font-bold"
              value={`#${nextInvoiceNumber.toString().padStart(4, '0')}`}
              disabled
            />
          </div>
          <div className="form-group mb-0">
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
        <h3 className="section-title text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">👤 Customer Details</h3>
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
            maxLength={10}
            onChange={validatePhone}
            defaultValue={initialData?.customer_phone}
          />
        </div>
      </div>

      {/* 3. Journey Details */}
      <div className="card mb-4">
        <h3 className="section-title text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">🚗 Journey Details</h3>
        
        {/* Trip Type Selector (Dropdown) */}
        <div className="form-group mb-6">
          <label className="form-label text-slate-500 uppercase tracking-wider text-xs font-bold mb-2">Trip Type</label>
          <div className="relative">
            <select
              value={tripType}
              onChange={(e) => {
                setTripType(e.target.value as 'oneway' | 'roundtrip' | 'local');
                saveDraft();
              }}
              className="form-input appearance-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 py-3 rounded-xl"
            >
              <option value="oneway">One Way</option>
              <option value="roundtrip">Two Way</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {/* Pickup - Always Visible */}
        <div className="form-group mb-4">
          <label className="form-label text-slate-700 font-bold">Pickup Details *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input 
              type="text" 
              name="pickup_location" 
              className="form-input" 
              required 
              placeholder="Area (e.g. Airport)" 
              defaultValue={initialData?.pickup_location}
            />
            <input 
              type="text" 
              name="pickup_city" 
              className="form-input" 
              placeholder="City (e.g. Mumbai)" 
              defaultValue={initialData?.pickup_city}
            />
          </div>
        </div>

        {/* Dynamic Stops (Only for Outstation) */}
        {tripType !== 'local' && (
          <>
            {stops.map((stop, index) => (
              <div key={stop.id} className="form-group relative mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="form-label text-slate-600 flex justify-between">
                  <span>Intermediate Stop {index + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newStops = stops.filter((_, i) => i !== index);
                      setStops(newStops);
                      saveDraft();
                    }}
                    className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
                  >
                    ✕ Remove
                  </button>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={stop.location}
                    onChange={(e) => {
                      const newStops = [...stops];
                      newStops[index].location = e.target.value;
                      setStops(newStops);
                      saveDraft();
                    }}
                    className="form-input text-sm" 
                    placeholder="Area (e.g. Lonavala)"
                  />
                  <input 
                    type="text" 
                    value={stop.city}
                    onChange={(e) => {
                      const newStops = [...stops];
                      newStops[index].city = e.target.value;
                      setStops(newStops);
                      saveDraft();
                    }}
                    className="form-input text-sm" 
                    placeholder="City (Optional)"
                  />
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => {
                setStops([...stops, { id: crypto.randomUUID(), location: '', city: '' }]);
                saveDraft();
              }}
              className="text-sm text-blue-600 font-medium mb-4 flex items-center hover:bg-blue-50 p-2 rounded w-full justify-center border border-dashed border-blue-200 transition-colors"
            >
              + Add Intermediate Stop
            </button>
          </>
        )}

        {/* Destination - Always Visible (Requested Update) */}
        <div className="form-group mb-4">
          <label className="form-label text-slate-700 font-bold">Drop Details *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input 
              type="text" 
              name="destination" 
              className="form-input" 
              required 
              placeholder="Area" 
              defaultValue={initialData?.destination}
            />
            <input 
              type="text" 
              name="drop_city" 
              className="form-input" 
              placeholder="City" 
              defaultValue={initialData?.drop_city}
            />
          </div>
        </div>

        {/* CONDITION: Local Usage Details (Hours/Km) */}
        {tripType === 'local' && (
          <div className="card bg-slate-50 p-3 mb-4 border border-slate-200">
             <h4 className="text-sm font-bold text-slate-600 uppercase mb-3">Local Usage Details</h4>
             <div className="grid grid-cols-2 gap-3">
               <div className="form-group">
                 <label className="form-label text-xs">Total Hours</label>
                 <input 
                   type="number"
                   name="total_hours"
                   className="form-input"
                   placeholder="8"
                   min="0"
                   onKeyDown={blockInvalidChar}
                   value={totalHours || ''}
                   onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTotalHours(val < 0 ? 0 : val); // Double safety
                      saveDraft();
                   }}
                 />
               </div>
               <div className="form-group">
                 <label className="form-label text-xs">Total Km</label>
                 <input 
                   type="number" 
                   name="total_km"
                   className="form-input"
                   placeholder="80"
                   min="0"
                   onKeyDown={blockInvalidChar}
                   value={totalKm || ''}
                   onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTotalKm(val < 0 ? 0 : val);
                      saveDraft();
                   }}
                 />
               </div>
             </div>
          </div>
        )}

        {/* Journey Meta */}
        <div className="card bg-slate-50 dark:bg-slate-800/50 p-3 mb-4 rounded-lg border border-slate-200 dark:border-slate-700">
           <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Dates & Vehicle</h4>
           
           {/* Pickup Date & Day */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
             <div className="form-group">
                <label className="form-label text-xs">Pickup Date</label>
                <input 
                  type="date" 
                  name="journey_date" 
                  className="form-input text-sm" 
                  defaultValue={initialData?.journey_date || getTodayDate()} 
                  required 
                  onChange={(e) => {
                     const date = new Date(e.target.value);
                     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                     const dayName = days[date.getDay()];
                     const daySelect = document.querySelector('select[name="journey_day"]') as HTMLSelectElement;
                     if (daySelect) daySelect.value = dayName;
                  }}
                />
             </div>
             <div className="form-group">
                <label className="form-label text-xs">Pickup Day</label>
                 <select name="journey_day" className="form-input form-select text-sm">
                   {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                     <option key={d} value={d}>{d}</option>
                   ))}
                 </select>
             </div>
           </div>

           {/* Return Date & Day - Required for ALL Trip Types */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
             <div className="form-group">
                <label className="form-label text-xs">Return Date *</label>
                <input 
                  type="date" 
                  name="return_date" 
                  className="form-input text-sm" 
                  defaultValue={initialData?.return_date}
                  required 
                  title="Return Date is required for all trip types"
                  onChange={(e) => {
                     const val = e.target.value;
                     if (!val) return;
                     const date = new Date(val);
                     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                     const dayName = days[date.getDay()];
                     const daySelect = document.querySelector('select[name="return_day"]') as HTMLSelectElement;
                     if (daySelect) daySelect.value = dayName;
                  }}
                />
             </div>
             <div className="form-group">
                <label className="form-label text-xs">Return Day *</label>
                 <select 
                   name="return_day" 
                   className="form-input form-select text-sm" 
                   required
                   title="Return Day is required for all trip types"
                 >
                   <option value="">- Select Day -</option>
                   {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                     <option key={d} value={d}>{d}</option>
                   ))}
                 </select>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
             <div className="form-group">
               <label className="form-label text-xs">Vehicle Type</label>
               <select 
                 name="cab_type" 
                 className="form-input form-select text-sm"
                 defaultValue={initialData?.cab_type}
               >
                 <option value="sedan">Sedan</option>
                 <option value="suv">SUV</option>
                 <option value="innova">Innova</option>
                 <option value="crysta">Crysta</option>
                 <option value="tempo">Traveller</option>
               </select>
             </div>
             <div className="form-group">
               <label className="form-label text-xs">Vehicle Model (Optional)</label>
               <input 
                 type="text" 
                 className="form-input text-sm"
                 placeholder="e.g. Ertiga, Aura"
                 value={vehicleModel}
                 onChange={(e) => {
                   setVehicleModel(e.target.value);
                   saveDraft();
                 }}
               />
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="form-group">
                 <label className="form-label text-xs">Vehicle Number</label>
                 <input 
                   type="text" 
                   name="cab_number" 
                   className="form-input text-sm uppercase font-mono tracking-wider" 
                   placeholder="MH 12 AB 1234" 
                   maxLength={13} // With spaces
                   pattern="[A-Z]{2}\s[0-9]{2}\s[A-Z]{2}\s[0-9]{4}"
                   title="Format: MH 12 AB 1234"
                   onChange={(e) => {
                      e.target.value = formatVehicleNumber(e.target.value);
                      saveDraft();
                   }}
                   defaultValue={initialData?.cab_number}
                 />
              </div>
              <div className="form-group">
                 <label className="form-label text-xs">Driver Name</label>
                 <input 
                   type="text" 
                   name="driver_name" 
                   className="form-input text-sm"
                   placeholder="Driver Name"
                   defaultValue={initialData?.driver_name}
                   onChange={saveDraft}
                 />
              </div>
           </div>
           
           <div className="form-group mt-3">
              <label className="form-label text-xs">Driver Phone</label>
              <input 
                type="tel" 
                name="driver_phone" 
                className="form-input text-sm" 
                placeholder="10-digit mobile" 
                maxLength={10}
                pattern="[0-9]{10}"
                onChange={validatePhone}
                defaultValue={initialData?.driver_phone}
              />
           </div>
        </div>
      </div>

      {/* 4. Fare Breakdown */}
      <div className="card mb-4 border-2 border-primary/10 dark:border-blue-500/20">
        <h3 className="section-title text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">💰 Fare Breakdown</h3>
        
        {/* Base Fare */}
        <div className="form-group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <label className="form-label mb-0">Base Fare (₹) *</label>
          </div>
           <input
            type="number"
            className="form-input text-lg font-bold text-gray-800 dark:text-gray-100"
            value={baseFare || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setBaseFare(val < 0 ? 0 : val || 0);
              saveDraft();
            }}
            onKeyDown={blockInvalidChar}
            placeholder="0"
            min="0"
            required
          />
        </div>

        {/* Driver Allowance */}
        <div className="form-group bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
          <div className="flex justify-between items-center mb-1">
             <label className="form-label mb-0">Driver Allowance (₹)</label>
          </div>
           <input
            type="number"
            className="form-input text-lg font-bold text-gray-800 dark:text-gray-100"
            value={driverAllowance || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDriverAllowance(val < 0 ? 0 : val || 0);
              saveDraft();
            }}
            onKeyDown={blockInvalidChar}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Mileage Details - Optional */}
        <div className="grid grid-cols-2 gap-3 mb-4">
           <div className="form-group">
              <label className="form-label text-xs">Starting Km</label>
              <input 
                type="number" 
                className="form-input text-sm"
                value={startingKm || ''}
                onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setStartingKm(val < 0 ? 0 : val || 0);
                   saveDraft();
                }}
                onKeyDown={blockInvalidChar}
                placeholder="Optional"
              />
           </div>
           <div className="form-group">
              <label className="form-label text-xs">Closing Km</label>
              <input 
                type="number" 
                className="form-input text-sm"
                value={closingKm || ''}
                onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   setClosingKm(val < 0 ? 0 : val || 0);
                   saveDraft();
                }}
                onKeyDown={blockInvalidChar}
                placeholder="Optional"
              />
           </div>
        </div>

        {/* Dynamic Additional Charges */}
        <div className="space-y-3 mb-4">
          <label className="form-label block text-sm font-medium text-gray-500 uppercase tracking-wide">Additional Charges</label>
          
          {additionalCharges.map((charge, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center animate-fadeIn bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700 sm:border-0 sm:p-0 sm:bg-transparent">
              <select
                value={charge.type}
                onChange={(e) => {
                  const newCharges = [...additionalCharges];
                  newCharges[index].type = e.target.value;
                  setAdditionalCharges(newCharges);
                  saveDraft();
                }}
                className="form-input w-full sm:w-1/2 text-sm"
              >
                <option value="Waiting Charge">Waiting Charge</option>
                <option value="Food Cost">Food Cost</option>
                <option value="Toll">Toll</option>
                <option value="Parking">Parking</option>
                <option value="Night Charge">Night Charge</option>
                <option value="Extra KM">Extra KM</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={charge.amount || ''}
                    onChange={(e) => {
                      const newCharges = [...additionalCharges];
                      const val = parseFloat(e.target.value);
                      newCharges[index].amount = val < 0 ? 0 : val || 0;
                      setAdditionalCharges(newCharges);
                      saveDraft();
                    }}
                    onKeyDown={blockInvalidChar}
                    className="form-input pl-6 w-full"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newCharges = additionalCharges.filter((_, i) => i !== index);
                    setAdditionalCharges(newCharges);
                    saveDraft();
                  }}
                   className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0 border border-red-100 dark:border-red-900/30 sm:border-0"
                >
                  ✕
                </button>
              </div>
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
                className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 5. Total Display */}
      <div className="container mx-auto p-4 pb-0 max-w-2xl px-0">
        <div className="card border-t-4 border-t-blue-600 dark:border-t-blue-500 mt-4 rounded-2xl shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20">
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
           {driverAllowance > 0 && (
             <div className="flex justify-between items-center mb-2 text-slate-400 text-sm border-b border-slate-700 pb-2">
               <span>Driver Allowance</span>
               <span>+ ₹ {driverAllowance.toLocaleString()}</span>
             </div>
           )}
           <div className="flex justify-between items-end">
             <span className="text-lg font-medium">Total Amount</span>
             <span className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">₹ {totalAmount.toLocaleString('en-IN')}</span>
           </div>
        </div>
      </div>

      {/* 6. Payment Mode */}
      <div className="card mb-6 mt-4">
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
              <div className="text-center py-2 rounded-md border text-sm font-semibold uppercase text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 peer-checked:bg-slate-800 dark:peer-checked:bg-slate-600 peer-checked:text-white peer-checked:border-slate-800 dark:peer-checked:border-slate-600 transition-all">
                {mode}
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-24"
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
