'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InvoiceForm from '@/components/InvoiceForm';
import { Invoice, InvoiceFormData } from '@/types/invoice';

function EditInvoiceContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async (invoiceId: string) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();
  
          if (error) throw error;
          setInvoice(data);
        } catch (error) {
          console.error('Error fetching invoice:', error);
          alert('Error loading invoice');
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
      };

      fetchInvoice(id);
    }
  }, [id, router]);

  const handleUpdate = async (data: InvoiceFormData) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b px-4 py-3 mb-6 sticky top-0 z-10 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          ←
        </button>
        <h1 className="font-bold text-lg">Edit Invoice #{invoice.invoice_number?.toString().padStart(4, '0')}</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4">
        {/* Pass initialData to pre-fill form */}
        <InvoiceForm 
          onSubmit={async (data) => {
            await handleUpdate(data);
            return invoice; // Return updated invoice to satisfy type
          }} 
          nextInvoiceNumber={invoice.invoice_number || 0}
          initialData={invoice}
        />
      </div>
    </div>
  );
}

export default function EditInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditInvoiceContent />
    </Suspense>
  );
}
