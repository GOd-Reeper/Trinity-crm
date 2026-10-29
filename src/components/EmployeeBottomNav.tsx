'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  CalendarClock, 
  MapPin, 
  Ruler, 
  CalendarOff, 
  AlertCircle, 
  LogOut,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const employeeTabs = [
  { name: 'Classes', href: '/employee', icon: CalendarClock },
  { name: 'Punch In/Out', href: '/employee/punch', icon: MapPin },
  { name: 'Measure', href: '/employee/measurements', icon: Ruler },
  { name: 'Leaves', href: '/employee/leaves', icon: CalendarOff },
  { name: 'Issues', href: '/employee/issues', icon: AlertCircle },
];

export default function EmployeeBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login/employee');
  };

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950 text-white border-b border-zinc-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-zinc-950 font-bold">
            <Dumbbell className="w-4 h-4 text-zinc-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">TRINITY</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase mt-0.5">Trainer Portal</p>
          </div>
        </div>

        {/* User Pill & Switch / Logout */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-100 leading-none">{user?.full_name || 'Trainer'}</p>
            <p className="text-[9px] text-zinc-400 mt-0.5">{user?.employee_code || 'TRN-001'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1.5 safe-area-pb shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {employeeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 relative min-w-[58px] ${
                  isActive
                    ? 'text-teal-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-teal-500/10 scale-105' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400 stroke-[2.2]' : 'text-zinc-400'}`} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-teal-300' : 'font-medium'}`}>
                  {tab.name}
                </span>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 bg-teal-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

