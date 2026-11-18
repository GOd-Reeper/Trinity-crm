'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DedicatedAdminLoginPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading, loginAdminWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in within 24 hours
  useEffect(() => {
    if (!authLoading && user && role === 'admin') {
      router.replace('/admin');
    }
  }, [user, role, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter admin PIN');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const res = await loginAdminWithPin(pin.trim());
    setLoading(false);

    if (res.success) {
      router.replace('/admin');
    } else {
      setErrorMsg(res.error || 'Incorrect Admin PIN');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 relative selection:bg-teal-500 selection:text-white">
      <div className="absolute top-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
              <ShieldCheck className="w-7 h-7 text-teal-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Admin Login</h1>
            <p className="text-xs text-zinc-400">Trinity Fitness Master Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Admin Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  autoFocus
                  maxLength={8}
                  placeholder="Enter Admin PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 tracking-widest focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs text-center font-medium animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Admin Console</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-zinc-500">
              Admin session is active for 24 hours on this device
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
