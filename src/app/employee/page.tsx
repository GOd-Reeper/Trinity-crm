'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarClock, 
  Sparkles, 
  CalendarDays,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession } from '@/lib/types';
import ClassCard from '@/components/ClassCard';
import { useAuth } from '@/lib/auth-context';
import { getTodayIST } from '@/lib/time-utils';

export default function EmployeeClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDateLabel, setCurrentDateLabel] = useState('');

  const fetchClasses = async (employeeId?: string, dateStr?: string) => {
    setIsLoading(true);
    const targetEmpId = employeeId || user?.id;
    const curDate = dateStr || getTodayIST();

    if (targetEmpId) {
      const { data } = await supabase
        .from('classes')
        .select('*, client:clients(*), employee:profiles(*)')
        .eq('employee_id', targetEmpId)
        .eq('class_date', curDate)
        .order('start_time', { ascending: true });

      if (data) setClasses(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const todayStr = getTodayIST();
    const now = new Date();
    setCurrentDateLabel(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now)
    );
    if (user?.id) {
      fetchClasses(user.id, todayStr);
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
        <p className="text-xs font-bold text-zinc-800">Please sign in to view your classes</p>
        <Link
          href="/login/employee"
          className="inline-block px-4 py-2 rounded-xl bg-teal-500 text-zinc-950 font-bold text-xs hover:bg-teal-400 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const inProgressCount = classes.filter((c) => c.status === 'in_progress').length;
  const upcomingCount = classes.filter((c) => c.status === 'scheduled').length;

  return (
    <div className="space-y-4">
      {/* Date Banner & Daily Summary Stats */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                Today&apos;s Class Schedule
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                {currentDateLabel || 'Today'}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-white">{classes.length}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Assigned</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-teal-400">{completedCount}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Completed</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-amber-400">{upcomingCount}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Verification Rule Reminder Card */}
      <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wide text-teal-800">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Class Start Rules</span>
        </div>
        <p className="text-[11px] text-teal-900 leading-relaxed">
          • Class button unlocks at scheduled start time.<br />
          • Upload selfie &amp; specify travel mode (Rapido/Uber screenshot or drop name).<br />
          • <strong>⚠️ Starting &gt;10 min late marks a Half-Day penalty automatically!</strong>
        </p>
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider px-1">
          Your Sessions ({classes.length})
        </h3>

        {classes.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs space-y-2">
            <CalendarDays className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-zinc-800">No classes assigned for today</p>
            <p className="text-[11px] text-zinc-400">
              Check back later or contact admin to schedule monthly client batches.
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <ClassCard
              key={cls.id}
              session={cls}
              onRefresh={() => fetchClasses(user?.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
