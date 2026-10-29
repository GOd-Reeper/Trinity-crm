'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Loader2,
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function DedicatedAdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const [identifier, setIdentifier] = useState('ADMIN');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await loginAdmin(identifier.trim(), pin.trim());
    setLoading(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setErrorMsg(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">Admin Login</h1>
            <p className="text-xs text-zinc-400">Trinity Fitness Master Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Admin Code or Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. ADMIN or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="Enter 4-digit PIN (Default: 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}

