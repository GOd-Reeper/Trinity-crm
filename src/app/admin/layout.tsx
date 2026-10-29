'use client';

import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen pb-16">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
