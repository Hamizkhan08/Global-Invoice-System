'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '6rem', background: '#f8fafc' }}>
      {/* Header */}
      <header className="header">
        <h1>Global Tours & Travels</h1>
        <p>Invoice Manager</p>
      </header>

      <div className="p-6 flex flex-col gap-6 mt-4">
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-2">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome! 👋</h2>
          <p className="text-slate-500 text-sm">What would you like to do today?</p>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => router.push('/create')}
          className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 text-left transition-all active:scale-[0.98] flex items-center justify-between group hover:bg-blue-700 hover:shadow-xl"
        >
          <div>
             <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-2xl bg-white/20 text-white backdrop-blur-sm">
               ➕
             </div>
             <h3 className="text-xl font-bold">Create New Invoice</h3>
             <p className="text-blue-100 text-sm mt-1">Generate professional PDF invoice</p>
          </div>
          <span className="text-2xl text-blue-200 group-hover:text-white group-hover:translate-x-2 transition-all">→</span>
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-600 border-y border-r border-slate-200 text-left transition-all active:scale-[0.98] flex items-center justify-between group hover:shadow-md hover:border-r-blue-200"
        >
          <div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-2xl bg-blue-50 text-blue-600">
               📋
             </div>
             <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">Track History</h3>
             <p className="text-slate-500 text-sm mt-1">View, search, or update past invoices</p>
          </div>
          <span className="text-2xl text-slate-300 group-hover:text-blue-500 group-hover:translate-x-2 transition-all">→</span>
        </button>
      </div>
    </main>
  );
}
