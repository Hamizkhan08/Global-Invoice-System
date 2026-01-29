'use client';

import { Invoice } from '@/types/invoice';
import { forwardRef } from 'react';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice }, ref) => {
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    const formatLocation = (area: string, city?: string) => {
      if (!area) return '';
      if (city && !area.toLowerCase().includes(city.toLowerCase())) {
        return `${area}, ${city}`;
      }
      return area;
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return (
      <div 
        ref={ref} 
        id="invoice-template"
        className="bg-slate-50 text-slate-800 font-sans leading-relaxed"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          margin: '0 auto',
          position: 'relative',
          boxSizing: 'border-box',
          padding: 0 // Full bleed for header
        }}
      >
        {/* === HEADER SECTION (High Contrast) === */}
        <div className="bg-[#0f172a] text-white px-12 py-10 relative overflow-hidden">
          {/* Decorative Pattern Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="flex justify-between items-center relative z-10">
            {/* BRANDING */}
            <div className="flex items-center gap-4">
               {/* SVG Logo - Car/Tourist Permit Icon */}
               <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/50">
                  {/* Sedan Car Icon */}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
               </div>
               <div>
                 <h1 className="text-3xl font-black tracking-tight leading-none text-white">
                   GLOBAL
                 </h1>
                 <p className="text-xs font-bold text-blue-400 tracking-[0.3em] uppercase mt-1">
                   TOURS & TRAVELS
                 </p>
               </div>
            </div>

            {/* COMPANY CONTACT (Right Aligned in Header) */}
            <div className="text-right text-sm text-slate-300 font-medium">
               <p className="flex items-center justify-end gap-2">
                 <span className="text-xs leading-tight w-64 text-right">
                   Aman Paradise Appt, Wadala Rd, Opp. JMCT College,<br/>
                   Al Madina Colony, Nashik, Maharashtra 422006
                 </span> 
                 <span className="text-blue-500 mt-0.5">📍</span>
               </p>
               <p className="flex items-center justify-end gap-2 mt-2">
                 <span>+91 98815 98109</span> 
                 <span className="text-blue-500">📞</span>
               </p>
               <p className="flex items-center justify-end gap-2 mt-1">
                 <span>afzalkhan0404@gmail.com</span> 
                 <span className="text-blue-500">✉️</span>
               </p>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT BODY === */}
        <div className="px-12 py-8">
          
          {/* TITLE & METADATA ROW */}
          <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
             <div>
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Prepared For</h2>
               <div className="text-2xl font-bold text-[#0f172a]">{invoice.customer_name}</div>
               <div className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                 <span>📱 {invoice.customer_phone}</span>
               </div>
             </div>
             
             <div className="text-right">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Details</div>
                <div className="bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <div className="text-[10px] text-slate-400 uppercase font-bold">Number</div>
                         <div className="text-lg font-mono font-bold text-[#0f172a]">#{invoice.invoice_number?.toString().padStart(4, '0')}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="text-right">
                         <div className="text-[10px] text-slate-400 uppercase font-bold">Date</div>
                         <div className="text-lg font-bold text-[#0f172a]">{formatDate(invoice.invoice_date)}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* TWO COLUMN GRID: TRIP & ROUTE */}
          <div className="grid grid-cols-12 gap-8 mb-10">
             
             {/* LEFT: TRIP INFO (4 Columns) */}
             <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>🚙</span> Trip Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Journey Date</div>
                    <div className="font-semibold text-slate-700">{formatDate(invoice.journey_date)}</div>
                  </div>
                  
                  {invoice.return_date && (
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Return Date</div>
                      <div className="font-semibold text-slate-700">{formatDate(invoice.return_date)}</div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Vehicle</div>
                    <div className="font-semibold text-slate-700 capitalize text-lg">
                      {invoice.cab_type || 'Cab'}
                      {invoice.vehicle_model && <span className="text-slate-500 text-sm ml-2">({invoice.vehicle_model})</span>}
                    </div>
                    <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded inline-block mt-1 text-slate-600">{invoice.cab_number}</div>
                  </div>

                  <div>
                     <div className="text-[10px] text-slate-400 uppercase font-bold">Driver</div>
                     <div className="font-semibold text-slate-700">{invoice.driver_name}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                     <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Start KM</div>
                        <div className="font-mono font-semibold text-slate-700 text-sm">
                           {invoice.starting_km ? invoice.starting_km : '-'}
                        </div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">End KM</div>
                        <div className="font-mono font-semibold text-slate-700 text-sm">
                           {invoice.closing_km ? invoice.closing_km : '-'}
                        </div>
                     </div>
                  </div>
                </div>
             </div>

             {/* RIGHT: ROUTE / USAGE VISUALIZATION (8 Columns) */}
             <div className="col-span-8 h-full">
                
                {/* CASE A: LOCAL TRIP - SHOW USAGE STATS */}
                {invoice.trip_type === 'local' ? (
                  <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 h-full relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-orange-900">
                       {/* Clock/Speedometer Icon */}
                       <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    </div>
                    
                    <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                      <span>⏱️</span> Local Package Details
                    </h3>

                    <div className="grid grid-cols-2 gap-8 relative z-10">
                       <div className="text-center bg-white/60 rounded-xl p-4 border border-orange-100/50 backdrop-blur-sm">
                          <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Total Limit</div>
                          <div className="text-4xl font-black text-slate-800">{invoice.total_hours || 0}<span className="text-lg text-slate-400 font-medium ml-1">Hrs</span></div>
                       </div>
                       <div className="text-center bg-white/60 rounded-xl p-4 border border-orange-100/50 backdrop-blur-sm">
                          <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Distance</div>
                          <div className="text-4xl font-black text-slate-800">{invoice.total_km || 0}<span className="text-lg text-slate-400 font-medium ml-1">Km</span></div>
                       </div>
                    </div>
                    
                    <div className="mt-8 text-center relative z-10">
                       <div className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-4 py-2 rounded-full border border-orange-200 uppercase tracking-wide">
                          📍 Local City Usage: {invoice.pickup_city || 'City'}
                       </div>
                    </div>
                  </div>
                ) : (
                  
                  /* CASE B: OUTSTATION (One Way / Round Trip) - SHOW MAP */
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-blue-900">
                       <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <span>🗺️</span> Travel Route
                      </h3>
                      {invoice.trip_type === 'roundtrip' && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                           Round Trip 🔄
                        </span>
                      )}
                    </div>

                    <div className="relative pl-2 py-2">
                       {/* Connecting Line */}
                       <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                       <div className="space-y-6 relative z-10">
                          {/* START */}
                          <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                             </div>
                             <div className="pt-1">
                                <div className="text-[10px] font-bold text-green-600 uppercase">Pickup Location</div>
                                <div className="text-lg font-semibold text-slate-800 leading-tight">
                                   {formatLocation(invoice.pickup_location, invoice.pickup_city)}
                                </div>
                             </div>
                          </div>

                          {/* STOPS */}
                          {invoice.stops && invoice.stops.map((stop, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-10 h-10 rounded-full bg-white border-4 border-white flex items-center justify-center shrink-0 z-10">
                                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                               </div>
                               <div className="pt-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Via</div>
                                  <div className="text-base font-medium text-slate-600">
                                     {formatLocation(stop.location, stop.city)}
                                  </div>
                               </div>
                            </div>
                          ))}

                  {(invoice.driver_allowance && invoice.driver_allowance > 0) && (
                    <tr>
                      <td className="py-4 px-6 text-slate-500">Driver Allowance</td>
                      <td className="py-4 px-6 text-right text-slate-600">{formatCurrency(invoice.driver_allowance)}</td>
                    </tr>
                  )}

                          {/* END */}
                          <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-red-50 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                             </div>
                             <div className="pt-1">
                                <div className="text-[10px] font-bold text-red-600 uppercase">Drop Location</div>
                                <div className="text-lg font-semibold text-slate-800 leading-tight">
                                   {formatLocation(invoice.destination, invoice.drop_city)}
                                </div>
                             </div>
                          </div>
                          
                          {/* Return Arrow for Round Trip */}
                          {invoice.trip_type === 'roundtrip' && (
                             <div className="flex gap-4 opacity-50">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                   <div className="text-slate-300 text-lg">⤴️</div>
                                </div>
                                <div className="pt-2">
                                   <div className="text-[10px] font-bold text-slate-400 uppercase italic">Return to Origin</div>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* BILLING TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
             <table className="w-full text-sm">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                 <tr>
                   <th className="py-4 px-6 text-left font-bold uppercase tracking-wider text-xs">Description</th>
                   <th className="py-4 px-6 text-right font-bold uppercase tracking-wider text-xs w-48">Amount (INR)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 <tr>
                   <td className="py-4 px-6 font-medium text-slate-700">Base Fare Charges</td>
                   <td className="py-4 px-6 text-right font-bold text-slate-700">{formatCurrency(invoice.fare_amount)}</td>
                 </tr>
                 
                 {invoice.additional_charges?.map((charge, i) => (
                   <tr key={i}>
                     <td className="py-4 px-6 text-slate-500">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold mr-2 uppercase tracking-wide">ADD-ON</span>
                        {charge.type}
                     </td>
                     <td className="py-4 px-6 text-right text-slate-600">{formatCurrency(charge.amount)}</td>
                   </tr>
                 ))}

                 {invoice.toll_amount > 0 && (
                   <tr>
                     <td className="py-4 px-6 text-slate-500">Toll / Parking / State Tax</td>
                     <td className="py-4 px-6 text-right text-slate-600">{formatCurrency(invoice.toll_amount)}</td>
                   </tr>
                 )}
               </tbody>
               
               {/* TOTAL ROW - DARK CONTRAST */}
               <tfoot className="bg-[#0f172a] text-white">
                 <tr>
                    <td className="py-6 px-6">
                       <div className="flex flex-col">
                          <span className="text-xs text-slate-400 uppercase font-medium">Total Amount Payable</span>
                          <span className="text-[10px] text-slate-500 uppercase mt-1">Payment Mode: {invoice.payment_mode}</span>
                       </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                       <span className="text-3xl font-bold tracking-tight">{formatCurrency(invoice.total_amount)}</span>
                    </td>
                 </tr>
               </tfoot>
             </table>
          </div>

          {/* FOOTER AREA */}
          <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-200">
             <div className="text-xs text-slate-500 max-w-sm italic">
                <p className="font-bold text-blue-600 mb-2 uppercase not-italic">Customer Note</p>
                <p className="leading-relaxed">
                   &quot;We hope you had a wonderful journey with us! Your comfort and safety are our top priority. We look forward to serving you again on your next adventure.&quot;
                </p>
             </div>
             
             <div className="text-center">
                {/* Digital Stamp Simulation */}
                {/* Digital Stamp Image */}
                <div className="mb-2 inline-block relative">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src="/signature.png" 
                     alt="Authorized Signature" 
                     className="w-32 h-auto" 
                   />
                </div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-widest">Authorized Signatory</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Global Tours & Travels</div>
             </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="bg-[#0f172a] text-slate-400 text-[10px] text-center py-3 uppercase tracking-widest mt-auto">
           Thank you for choosing Global Tours & Travels • Safe Journey
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
