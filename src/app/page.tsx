'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { createClient } from '@/lib/supabase/client';
import { generatePDF } from '@/lib/pdf';
import { Invoice, InvoiceFormData } from '@/types/invoice';

export default function HomePage() {
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(1);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);

  const fetchNextInvoiceNumber = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      const lastNumber = data?.[0]?.invoice_number || 0;
      setNextInvoiceNumber(lastNumber + 1);
    } catch (error) {
      console.error('Error fetching invoice number:', error);
      // Start from 1 if error
      setNextInvoiceNumber(1);
    }
  };

  const handleSubmit = async (formData: InvoiceFormData): Promise<Invoice> => {
    const supabase = createClient();

    // Insert invoice into Supabase
    const { data, error } = await supabase
      .from('invoices')
      .insert([formData])
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }

    const invoice = data as Invoice;
    setCreatedInvoice(invoice);

    // Wait a bit for the template to render
    setTimeout(async () => {
      setIsGeneratingPDF(true);
      try {
        await generatePDF(invoice);
        // Clear draft after successful submission
        localStorage.removeItem('invoice_draft');
        // Redirect to success page
        router.push(`/success?id=${invoice.id}&number=${invoice.invoice_number}`);
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        // Still redirect even if PDF fails
        router.push(`/success?id=${invoice.id}&number=${invoice.invoice_number}`);
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 500);

    return invoice;
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      {/* Header */}
      <header className="header">
        <h1>Global Tours & Travels</h1>
        <p>Create Professional Invoice</p>
      </header>

      {/* Form */}
      <InvoiceForm onSubmit={handleSubmit} nextInvoiceNumber={nextInvoiceNumber} />

      {/* Hidden Invoice Template for PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {createdInvoice && <InvoiceTemplate invoice={createdInvoice} />}
      </div>

      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: 'white',
          }}
        >
          <div className="spinner" style={{ width: 48, height: 48, marginBottom: '1rem' }}></div>
          <p style={{ fontSize: '1.125rem' }}>Generating Invoice PDF...</p>
        </div>
      )}

      {/* Dashboard Link */}
      <div className="text-center" style={{ marginTop: '1rem' }}>
        <a 
          href="/login" 
          style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem',
            textDecoration: 'underline'
          }}
        >
          Admin Dashboard →
        </a>
      </div>
    </main>
  );
}
