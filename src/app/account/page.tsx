'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Invoice } from '@/types/invoice';

function AccountContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser({ email: user.email || '' });
    };

    const fetchStats = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('invoices')
          .select('total_amount, invoice_date');

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setInvoices(data as any[]); 
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    fetchStats();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* Analytics Calculations */
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  
  const currentMonthRevenue = invoices.reduce((sum, i) => {
    const invoiceDate = new Date(i.invoice_date);
    const now = new Date();
    if (invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()) {
      return sum + (i.total_amount || 0);
    }
    return sum;
  }, 0);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '6rem' }}>
      {/* Header */}
      <header className="header">
        <h1>Account & Stats</h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
           <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : (
      <div className="p-4 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Admin User</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Financial Insights */}
        <div className="mb-6 animate-fadeIn">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Money Generated</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Total Revenue */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="text-4xl">💰</span>
              </div>
              <div className="text-sm text-slate-500 font-medium mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-slate-800">
                ₹{(totalRevenue / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">
                All time earnings
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="text-4xl">📈</span>
              </div>
              <div className="text-sm text-slate-500 font-medium mb-1">{currentMonthName}</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{(currentMonthRevenue / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                {invoices.filter(i => new Date(i.invoice_date).getMonth() === new Date().getMonth()).length} trips this month
              </div>
            </div>
          </div>
        </div>

        {/* Settings / Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-white text-red-500 p-4 rounded-2xl shadow-sm border border-slate-100 font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <span>🚪</span> Logout
          </button>
        </div>
        
        <div className="text-center mt-8 text-xs text-slate-400">
          Global Invoice System v1.2.0
        </div>
      </div>
      )}
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountContent />
    </Suspense>
  );
}
