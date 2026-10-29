'use client';

import React from 'react';
import EmployeeBottomNav from '@/components/EmployeeBottomNav';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md mx-auto bg-zinc-50 min-h-screen flex flex-col shadow-2xl pb-24 border-x border-zinc-200/80">
        <EmployeeBottomNav />
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
