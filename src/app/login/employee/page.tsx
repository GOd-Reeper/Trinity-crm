'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UserCheck, 
  Lock, 
  User, 
  ArrowLeft, 
  Loader2, 
  Dumbbell 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { loginEmployee } = useAuth();
  const [identifier, setIdentifier] = useState('TRN-001');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await loginEmployee(identifier.trim(), pin.trim());
    setLoading(false);

    if (res.success) {
      router.push('/employee');
    } else {
      setErrorMsg(res.error || 'Invalid employee code or PIN');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-sm space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">Trainer Quick PIN Login</h1>
            <p className="text-xs text-zinc-400">Trinity Fitness Employee Mobile Hub</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Trainer Code or Phone
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. TRN-001 or 9876543211"
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
                  placeholder="Enter 4-digit PIN (Akash: 1111)"
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
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Access Trainer App</span>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="pt-2 text-center border-t border-zinc-800 space-y-2">
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Quick Fill Preset</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => { setIdentifier('TRN-001'); setPin('1111'); }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                Akash (1111)
              </button>
              <button
                type="button"
                onClick={() => { setIdentifier('TRN-002'); setPin('2222'); }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
              >
                Nitin (2222)
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1">
              Admin access?{' '}
              <Link href="/login/admin" className="text-teal-400 font-semibold hover:underline">
                Go to Admin Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

