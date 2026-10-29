'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  MapPin, 
  CalendarClock, 
  Ruler, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, role, setUserDirect } = useAuth();

  const handleQuickDemoLogin = (roleType: 'admin' | 'employee', name: string, code: string, pin: string, id: string) => {
    setUserDirect({
      id,
      role: roleType,
      employee_code: code,
      full_name: name,
      phone: roleType === 'admin' ? '9876543210' : '9876543211',
      pin_hash: pin,
      shift_start_time: '09:00:00',
      shift_end_time: '18:00:00',
      is_flexible_shift: roleType === 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (roleType === 'admin') {
      router.push('/admin');
    } else {
      router.push('/employee');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Decorative teal ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-teal-500/25">
            <Dumbbell className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block">TRINITY FITNESS</span>
            <span className="text-[10px] text-teal-400 font-semibold tracking-widest uppercase">CRM & Session Engine</span>
          </div>
        </div>

        {user && (
          <Link
            href={role === 'admin' ? '/admin' : '/employee'}
            className="text-xs font-bold text-teal-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <span>Resume as {user.full_name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-xl mx-auto text-center my-auto py-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-800/40 text-teal-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete Operations & Attendance Suite</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Next-Gen Fitness <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">
            Client & Staff CRM
          </span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Manage 1-hour client sessions, automated GPS punch-in & PIN punch-out, Saturday measurement logs, and real-time travel mode verification.
        </p>

        {/* Portals Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
          {/* Admin Card */}
          <Link
            href="/login/admin"
            className="group p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-teal-500/50 hover:bg-zinc-900 transition-all shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">Admin Portal</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Full control: Clients, employee profiles, shift hours, leave approvals with mandatory reason, and GPS attendance.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Admin Login</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Employee Card */}
          <Link
            href="/login/employee"
            className="group p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-teal-500/50 hover:bg-zinc-900 transition-all shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white group-hover:text-teal-300 transition-colors">Trainer / Staff App</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Mobile-first: Locked class gatekeeper, selfie & travel proof (Rapido/Uber), PIN punch-out, and weekly metrics.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Trainer Quick PIN</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="pt-6 border-t border-zinc-800/80">
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            Quick 1-Click Demo Accounts (Pre-configured)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin', 'Trinity Administrator', 'ADMIN', '1234', '11111111-1111-1111-1111-111111111111')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-teal-300"
            >
              👑 Login as Admin (PIN: 1234)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('employee', 'Akash Sharma', 'TRN-001', '1111', '22222222-2222-2222-2222-222222222222')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200"
            >
              🏋️ Login as Akash (Trainer)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('employee', 'Nitin Verma', 'TRN-002', '2222', '33333333-3333-3333-3333-333333333333')}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200"
            >
              🥊 Login as Nitin (Trainer)
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-zinc-500 py-4 border-t border-zinc-900">
        Trinity Fitness CRM © 2026 • Secure Realtime Supabase Backend
      </footer>
    </main>
  );
}
