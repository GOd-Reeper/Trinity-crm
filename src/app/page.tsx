'use client';

import React from 'react';
import Link from 'next/link';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, role } = useAuth();

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between items-center p-6 relative selection:bg-teal-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top minimal bar */}
      <header className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-zinc-950 font-black">
            <Dumbbell className="w-4 h-4 text-zinc-950" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">TRINITY CRM</span>
        </div>

        {user && (
          <Link
            href={role === 'admin' ? '/admin' : '/employee'}
            className="text-[11px] font-semibold text-teal-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
          >
            Dashboard →
          </Link>
        )}
      </header>

      {/* Center Minimal Content */}
      <div className="w-full max-w-sm text-center space-y-6 my-auto">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/10">
          <Dumbbell className="w-8 h-8 text-teal-400" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trinity CRM
          </h1>
          <p className="text-xs text-zinc-400">
            Fitness Operations &amp; Session Management
          </p>
        </div>

        {/* Simple Login CTA */}
        <div className="pt-2">
          <Link
            href="/login/employee"
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <span>Login to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-sm text-center text-[11px] text-zinc-600 pb-2">
        Trinity Fitness CRM © 2026
      </footer>
    </main>
  );
}
