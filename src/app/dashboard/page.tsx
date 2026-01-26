'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { generatePDF } from '@/lib/pdf';
import { Invoice } from '@/types/invoice';

function DashboardContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
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
    
    setUser({ email: user.email || '' });
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

  const handleDownload = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDownloading(true);
    
    // Wait for template to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await generatePDF(invoice);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    } finally {
      setIsDownloading(false);
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem' }}>Dashboard</h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card text-center">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
              {invoices.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total Invoices
            </div>
          </div>
          <div className="card text-center">
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
              ₹{invoices.reduce((sum, i) => sum + i.total_amount, 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Total Revenue
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="form-group">
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search by invoice #, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create New Button */}
        <a href="/" className="btn btn-primary btn-block mb-4">
          ➕ Create New Invoice
        </a>

        {/* Invoice List */}
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto', borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="card text-center" style={{ color: 'var(--text-muted)' }}>
            {searchQuery ? 'No invoices found' : 'No invoices yet'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    #{invoice.invoice_number?.toString().padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {formatDate(invoice.invoice_date)}
                  </span>
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600 }}>{invoice.customer_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    📞 {invoice.customer_phone}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  📍 {invoice.pickup_location} → {invoice.destination}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)' }}>
                    ₹{invoice.total_amount.toLocaleString('en-IN')}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleDownload(invoice)}
                      className="btn btn-secondary"
                      style={{ minHeight: '2.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      disabled={isDownloading}
                    >
                      📥
                    </button>
                    <button
                      onClick={() => handleDelete(invoice)}
                      className="btn btn-danger"
                      style={{ minHeight: '2.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
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

      {/* Hidden Invoice Template for PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 48, height: 48 }}></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
