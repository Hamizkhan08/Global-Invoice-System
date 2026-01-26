'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { Invoice } from '@/types/invoice';

function PrintContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoice = async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
      
      // Auto-print when loaded
      if (data) {
        setTimeout(() => {
          window.print();
        }, 800);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading invoice for printing...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center text-red-500">Invoice not found</div>;
  }

  return (
    <div className="print-page bg-white min-h-screen">
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center sticky top-0 z-50">
        <div className="font-bold text-gray-700">Print Preview</div>
        <div className="space-x-4">
          <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            🖨️ Print / Save as PDF
          </button>
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-0 m-0">
        <InvoiceTemplate invoice={invoice} />
      </div>
    </div>
  );
}

export default function PrintInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}
