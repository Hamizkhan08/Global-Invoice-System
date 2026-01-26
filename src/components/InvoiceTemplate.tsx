'use client';

import { Invoice } from '@/types/invoice';
import { forwardRef } from 'react';

interface InvoiceTemplateProps {
  invoice: Invoice;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
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
        className="bg-white text-gray-900 font-sans"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          padding: '15mm',
          margin: '0 auto',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-blue-800 pb-6 mb-8">
          {/* Logo / Company Name */}
          <div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight leading-none">
                GLOBAL
              </h1>
              <h2 className="text-xl font-bold text-blue-600 tracking-wider">
                TOURS & TRAVELS
              </h2>
            </div>
            <div className="mt-4 text-sm text-gray-600 leading-relaxed">
              <p>📍 Sainath Nagar, Nashik - 422001</p>
              <p>📞 +91 98815 98109</p>
              <p>📧 globaltours@example.com</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="text-right">
            <h3 className="text-4xl font-light text-gray-300 mb-2">INVOICE</h3>
            <div className="text-sm">
              <p className="font-bold text-gray-700">Invoice #</p>
              <p className="text-xl font-mono text-blue-900 mb-2">
                #{invoice.invoice_number?.toString().padStart(4, '0')}
              </p>
              <p className="font-bold text-gray-700">Date</p>
              <p>{formatDate(invoice.invoice_date)}</p>
            </div>
          </div>
        </div>

        {/* CUSTOMER & JOURNEY INFO - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Customer */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billed To</h4>
            <p className="text-lg font-bold text-gray-900">{invoice.customer_name}</p>
            <p className="text-gray-600 mt-1">📞 {invoice.customer_phone}</p>
          </div>

          {/* Journey Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Journey Details</h4>
             <div className="flex justify-between mb-1">
               <span className="text-gray-600">Date:</span>
               <span className="font-medium">{formatDate(invoice.journey_date)}</span>
             </div>
             <div className="flex justify-between mb-1">
                <span className="text-gray-600">Type:</span>
                <span className="capitalize">{invoice.journey_type}</span>
             </div>
             {invoice.cab_type && (
               <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-medium capitalize">{invoice.cab_type}</span>
               </div>
             )}
             {invoice.cab_number && (
               <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Cab No:</span>
                  <span className="font-medium uppercase">{invoice.cab_number}</span>
               </div>
             )}
             {invoice.driver_name && (
               <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-medium">{invoice.driver_name}</span>
               </div>
             )}
          </div>
        </div>

        {/* ROUTE DETAILS */}
        <div className="mb-8">
           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Route</h4>
           <div className="flex items-center flex-wrap gap-2 text-sm">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">🟢 {invoice.pickup_location}</span>
              
              {invoice.stops && invoice.stops.map((stop, i) => (
                 <>
                   <span className="text-gray-400">➝</span>
                   <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{stop}</span>
                 </>
              ))}

              <span className="text-gray-400">➝</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">🔴 {invoice.destination}</span>
           </div>
        </div>

        {/* CHARGES TABLE */}
        <div className="mb-12">
          <table className="w-full text-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="py-2 px-4 text-left rounded-tl-lg">Description</th>
                <th className="py-2 px-4 text-right rounded-tr-lg w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Base Fare */}
              <tr>
                <td className="py-3 px-4 font-medium">Base Fare</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(invoice.fare_amount)}</td>
              </tr>
              
              {/* Additional Charges */}
              {invoice.additional_charges?.map((charge, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 text-gray-600">{charge.type}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(charge.amount)}</td>
                </tr>
              ))}

              {/* Legacy Toll */}
              {invoice.toll_amount > 0 && (
                 <tr>
                   <td className="py-3 px-4 text-gray-600">Toll / Parking</td>
                   <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(invoice.toll_amount)}</td>
                 </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="py-3 px-4 font-bold text-right text-gray-800 border-t-2 border-gray-300">Total Amount</td>
                <td className="py-3 px-4 text-right font-bold text-2xl text-blue-900 border-t-2 border-gray-300">
                  {formatCurrency(invoice.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="text-right mt-2 text-xs text-gray-500 uppercase font-semibold tracking-wide">
            Payment Mode: {invoice.payment_mode}
          </div>
        </div>


        {/* FOOTER & SIGNATURE */}
        <div className="mt-auto">
          <div className="flex justify-end items-end pb-8">
            {/* Signature Block - Centered relative to right side roughly */}
            <div className="text-center relative w-1/2">
              <p className="font-bold text-sm text-gray-800 mb-12">For Global Tours & Travels</p>
              
              {/* Stamp Overlay */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                 <img 
                   src="/stamp.png" 
                   alt="Stamp" 
                   style={{ width: '100px', opacity: 0.9, transform: 'rotate(-10deg)' }} 
                 />
              </div>

              <div className="border-t border-gray-400 w-48 mx-auto pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t-2 border-blue-900 pt-4 text-center">
            <p className="text-blue-900 font-bold text-sm">Thank you for travelling with us!</p>
            <p className="text-gray-500 text-xs mt-1">We wish you a safe and pleasant journey.</p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
