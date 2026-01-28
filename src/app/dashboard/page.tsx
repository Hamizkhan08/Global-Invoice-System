'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import InvoiceTemplate from '@/components/InvoiceTemplate';
// import ThemeToggle from '@/components/ThemeToggle';
import { generatePDF, sharePDFOnWhatsApp } from '@/lib/pdf';
import { Invoice } from '@/types/invoice';

function HistoryContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const router = useRouter();

  // Analytics State
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTrips: 0,
    topRoute: '-'
  });

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

  const calculateStats = (data: Invoice[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalRev = 0;
    let monthRev = 0;
    const routeCounts: Record<string, number> = {};

    data.forEach(inv => {
      // Revenue
      totalRev += inv.total_amount || 0;

      // Monthly Revenue
      const invDate = new Date(inv.invoice_date);
      if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
        monthRev += inv.total_amount || 0;
      }

      // Route Popularity
      const route = `${inv.pickup_city || inv.pickup_location} → ${inv.drop_city || inv.destination}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    // Find Top Route
    let topRoute = '-';
    let maxCount = 0;
    Object.entries(routeCounts).forEach(([route, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topRoute = route;
      }
    });

    setStats({
      totalRevenue: totalRev,
      monthlyRevenue: monthRev,
      totalTrips: data.length,
      topRoute: topRoute.split('→')[1]?.trim() || topRoute // Just show destination if too long
    });
  };

  const fetchInvoices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invoiceData = data as Invoice[];
      setInvoices(invoiceData);
      setFilteredInvoices(invoiceData);
      calculateStats(invoiceData);
      
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
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;
      
      // Update local state immediately
      const newInvoices = invoices.filter((i) => i.id !== invoice.id);
      setInvoices(newInvoices);
      setFilteredInvoices(prev => prev.filter((i) => i.id !== invoice.id));
      calculateStats(newInvoices); // Recalculate stats
      
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(`Error deleting invoice: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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
    <main style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '6rem' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="flex items-center gap-3">
               <div className="text-xs text-slate-500 font-medium hidden sm:block">
                 {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
               </div>
            </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        
        {/* === ANALYTICS CARDS === */}
        {!isLoading && invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {/* Monthly Revenue */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.35 0 .81.65 1.39 2.67 1.91s4.18 1.65 4.18 3.85c-.01 1.73-1.44 2.83-3.12 3.21z"/></svg>
               </div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">This Month</div>
               <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.monthlyRevenue)}</div>
               <div className="text-[10px] text-green-600 font-bold mt-1">
                 Total: {formatCurrency(stats.totalRevenue)}
               </div>
            </div>

            {/* Trips & Route */}
            <div className="space-y-3">
               <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trips Done</div>
                  <div className="text-xl font-bold text-blue-600">{stats.totalTrips}</div>
               </div>
               <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Dest.</div>
                  <div className="text-sm font-bold text-purple-600 truncate">{stats.topRoute}</div>
               </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="form-group sticky top-[72px] z-10 pb-2">
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
              <div key={invoice.id} className="card !p-4 transition-all hover:shadow-md">
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
                    {formatCurrency(invoice.total_amount)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.8rem', position: 'relative', zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
                    {/* EDIT */}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/create?edit=${invoice.id}`); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200 active:scale-95 transition-transform shadow-sm cursor-pointer hover:bg-blue-100"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {/* PDF */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePrint(invoice); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 active:scale-95 transition-transform shadow-sm cursor-pointer hover:bg-slate-100"
                      title="Print"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                    {/* WhatsApp */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(invoice); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200 active:scale-95 transition-transform shadow-sm cursor-pointer hover:bg-blue-100"
                      title="Share on WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(invoice); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-200 active:scale-95 transition-transform shadow-sm cursor-pointer hover:bg-slate-100 hover:text-red-500 hover:border-red-200"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
