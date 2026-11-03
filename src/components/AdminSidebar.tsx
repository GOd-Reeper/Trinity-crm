'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CalendarDays, 
  MapPin, 
  CalendarOff, 
  AlertCircle, 
  LogOut, 
  Menu, 
  X, 
  Dumbbell,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Clients & Tracking', href: '/admin/clients', icon: Users },
  { name: 'Employees & Shifts', href: '/admin/employees', icon: UserCheck },
  { name: 'Classes & Timetable', href: '/admin/classes', icon: CalendarDays },
  { name: 'Attendance & GPS', href: '/admin/attendance', icon: MapPin },
  { name: 'Leave Requests', href: '/admin/leaves', icon: CalendarOff },
  { name: 'Issue Escalations', href: '/admin/issues', icon: AlertCircle },
];

const mobileBottomTabs = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Clients', href: '/admin/clients', icon: Users, exact: false },
  { name: 'Classes', href: '/admin/classes', icon: CalendarDays, exact: false },
  { name: 'Attendance', href: '/admin/attendance', icon: MapPin, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/a-login');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-zinc-950 text-white border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-zinc-950 font-bold">
            <Dumbbell className="w-4 h-4 text-zinc-950" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">TRINITY FITNESS</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          aria-label="Toggle Navigation Drawer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-200 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 shadow-md shadow-teal-500/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-zinc-950 font-black" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">TRINITY CRM</span>
              <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" /> Admin Control
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold flex items-center justify-center text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'System Admin'}</p>
            <p className="text-[10px] text-zinc-400 truncate">{user?.phone || 'admin@trinity.com'}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-teal-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />}
              </Link>
            );
          })}
        </nav>

        {/* Switch to Employee Mode & Logout */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          <Link
            href="/employee"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-teal-400 bg-teal-950/40 border border-teal-800/40 rounded-xl hover:bg-teal-900/40 transition-colors"
          >
            <span>Preview Employee View</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Quick-Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/90 py-1.5 px-2 flex items-center justify-around shadow-2xl">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-teal-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-teal-500/10' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-zinc-400 hover:text-white"
        >
          <div className="p-1 rounded-lg">
            <MoreHorizontal className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
}
