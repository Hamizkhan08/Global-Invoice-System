'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start pt-0">
       {/* Header */}
      <header className="w-full bg-blue-700 text-white shadow-md py-8 flex flex-col items-center justify-center mb-10 rounded-b-[2rem]">
        <h1 className="text-3xl font-bold tracking-wide">
          Global Tours & Travels
        </h1>
        <p className="text-blue-100 font-medium mt-1 uppercase tracking-wider text-sm">Admin Login</p>
      </header>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 text-white font-bold py-3.5 rounded-xl hover:bg-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Checking...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-400 text-sm hover:text-blue-600 transition-colors font-medium">
            ← Back to Invoice Form
          </Link>
        </div>
      </div>
    </div>
  );
}
