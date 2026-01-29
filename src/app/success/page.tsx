'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { createClient } from '@/lib/supabase/client';
import { generatePDF, sharePDFOnWhatsApp } from '@/lib/pdf';
import { Invoice } from '@/types/invoice';

function SuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const invoiceNumber = searchParams.get('number');
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('invoices')
              .select('*')
              .eq('id', invoiceId)
              .single();
      
            if (error) throw error;
            setInvoice(data as Invoice);
          } catch (error) {
            console.error('Error fetching invoice:', error);
          } finally {
            setIsLoading(false);
          }
      };
      
      fetchInvoice();
    }
  }, [invoiceId]);



  const handleDownload = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    try {
      // Small delay to ensure template is rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      await generatePDF(invoice);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!invoice) return;
    
    setIsSharing(true);
    try {
      // Wait for template to render
      await new Promise(resolve => setTimeout(resolve, 300));
      const directShare = await sharePDFOnWhatsApp(invoice);
      
      if (!directShare) {
        // On desktop: PDF downloaded and WhatsApp opened - user needs to attach file
        alert(`✅ PDF downloaded!\n\nWhatsApp is opening with ${invoice.customer_name}'s chat.\n\nPlease click the 📎 attach button in WhatsApp and select the downloaded PDF.`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error sharing. Please try downloading the PDF and sharing manually.');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderColor: 'var(--primary)', borderTopColor: 'var(--secondary)' }}></div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="container">
        {/* Success Icon */}
        <div className="success-icon">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        {/* Success Message */}
        <div className="text-center mb-6">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--success)' }}>
            Invoice Created! 🎉
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Invoice #{invoiceNumber?.padStart(4, '0')} has been saved successfully
          </p>
        </div>

        {/* Invoice Summary Card */}
        {invoice && (
          <div className="card mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>Customer</span>
              <span>{invoice.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>Route</span>
              <span style={{ textAlign: 'right' }}>{invoice.pickup_location} → {invoice.destination}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0' }}>
              <span style={{ fontWeight: 600 }}>Total Amount</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>
                ₹{invoice.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button 
            onClick={handleDownload} 
            className="btn btn-primary btn-block"
            disabled={isDownloading || !invoice}
          >
            {isDownloading ? (
              <>
                <span className="spinner"></span>
                Downloading...
              </>
            ) : (
              <>
                📥 Download Invoice PDF
              </>
            )}
          </button>

          <button 
            onClick={handleWhatsAppShare} 
            className="btn btn-whatsapp btn-block"
            disabled={!invoice || isSharing}
          >
            {isSharing ? (
              <>
                <span className="spinner"></span>
                Preparing PDF...
              </>
            ) : (
              <>
                📱 Share PDF on WhatsApp
              </>
            )}
          </button>

          <Link href="/" className="btn btn-secondary btn-block">
            ➕ Create New Invoice
          </Link>
        </div>

        {/* Dashboard Link */}
        <div className="text-center">
          <Link 
            href="/dashboard" 
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.875rem',
              textDecoration: 'underline'
            }}
          >
            View All Invoices →
          </Link>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF - Positioned to ensure html2canvas can capture it */}
      <div id="invoice-template-container" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        width: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        zIndex: -1000,
        visibility: 'hidden', // Hide from user but keep in DOM
        pointerEvents: 'none'
      }}>
        {invoice && <InvoiceTemplate invoice={invoice} />}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 48, height: 48 }}></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
