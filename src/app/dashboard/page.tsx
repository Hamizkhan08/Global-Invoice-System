'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { generatePDF, sharePDFOnWhatsApp } from '@/lib/pdf';
import { Invoice } from '@/types/invoice';

function HistoryContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(
        (invoice) =>
          invoice.invoice_number?.toString().includes(query) ||
          invoice.customer_name.toLowerCase().includes(query) ||
          invoice.customer_phone.includes(query)
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
  };

  const fetchInvoices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data as Invoice[]);
      setFilteredInvoices(data as Invoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* 
   * SIMPLIFIED: Using Native Browser Print
   * Open dedicated print page in new window to guarantee PDF generation works 
   */
  const handlePrint = (invoice: Invoice) => {
    // Open the dedicated print page in a new window/tab
    const width = 800;
    const height = 1000;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      `/print-invoice?id=${invoice.id}`, 
      '_blank', // Open in new tab (users often block popups, new tab is safer)
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleShare = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsSharing(true);
    
    // Wait for template to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const directShare = await sharePDFOnWhatsApp(invoice);
      if (!directShare) {
        alert(`✅ PDF downloaded!\n\nAttach file in WhatsApp.`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Error sharing.');
    } finally {
      setIsSharing(false);
      setSelectedInvoice(null);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Delete invoice #${invoice.invoice_number}?`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;
      
      setInvoices(invoices.filter((i) => i.id !== invoice.id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '6rem' }}>
      {/* Header */}
      <header className="header">
        <h1 style={{ fontSize: '1.25rem' }}>Invoice History</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Search */}
        <div className="form-group sticky top-[72px] z-10 bg-[#f8fafc] pb-2">
          <input
            type="search"
            className="form-input shadow-sm"
            placeholder="🔍 Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto', borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 'No invoices found' : 'No history yet'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="card !p-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">
                    #{invoice.invoice_number?.toString().padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {formatDate(invoice.invoice_date)}
                  </span>
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{invoice.customer_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    📍 {invoice.pickup_location} → {invoice.destination}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--success)' }}>
                    ₹{invoice.total_amount.toLocaleString('en-IN')}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* EDIT */}
                    <button
                      onClick={() => router.push(`/edit/${invoice.id}`)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {/* PDF */}
                    <button
                      onClick={() => handlePrint(invoice)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 border border-slate-200"
                      title="Print"
                    >
                      🖨️
                    </button>
                    {/* WhatsApp */}
                    <button
                      onClick={() => handleShare(invoice)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200"
                      title="Share"
                    >
                      📱
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(invoice)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden Invoice Template */}
      <div id="invoice-template-container" style={{ 
        position: 'fixed', top: 0, left: 0, width: '210mm', minHeight: '297mm', zIndex: -1000, visibility: 'hidden', pointerEvents: 'none'
      }}>
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
