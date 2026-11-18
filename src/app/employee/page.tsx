'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarClock, 
  Sparkles, 
  CalendarDays,
  Calendar,
  Clock,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession } from '@/lib/types';
import ClassCard from '@/components/ClassCard';
import { useAuth } from '@/lib/auth-context';
import { getTodayIST, formatDateIST } from '@/lib/time-utils';

function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

interface DayOption {
  dateStr: string;
  label: string;
  subLabel: string;
  isToday: boolean;
}

export default function EmployeeClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);

  useEffect(() => {
    const todayStr = getTodayIST();
    const options: DayOption[] = [];

    for (let i = 0; i < 5; i++) {
      const dStr = addDaysToDateStr(todayStr, i);
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else {
        label = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(dateObj);
      }

      const subLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(dateObj);

      options.push({
        dateStr: dStr,
        label,
        subLabel,
        isToday: i === 0,
      });
    }

    setDayOptions(options);
  }, []);

  const fetchClasses = async (employeeId?: string) => {
    setIsLoading(true);
    const targetEmpId = employeeId || user?.id;
    const todayStr = getTodayIST();
    const maxDateStr = addDaysToDateStr(todayStr, 4); // Around 4 upcoming days

    if (targetEmpId) {
      const { data } = await supabase
        .from('classes')
        .select('*, client:clients(*), employee:profiles(*)')
        .eq('employee_id', targetEmpId)
        .gte('class_date', todayStr)
        .lte('class_date', maxDateStr)
        .order('class_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (data) setClasses(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchClasses(user.id);
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

  // Filtered classes based on active tab
  const todayStr = getTodayIST();
  const visibleClasses = selectedDateFilter === 'all'
    ? classes
    : classes.filter((c) => c.class_date === selectedDateFilter);

  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const inProgressCount = classes.filter((c) => c.status === 'in_progress').length;
  const upcomingCount = classes.filter((c) => c.status === 'scheduled').length;
  const todayClassesCount = classes.filter((c) => c.class_date === todayStr).length;

  // Group classes by date for "all" view
  const groupedClasses: { [date: string]: ClassSession[] } = {};
  if (selectedDateFilter === 'all') {
    classes.forEach((cls) => {
      if (!groupedClasses[cls.class_date]) {
        groupedClasses[cls.class_date] = [];
      }
      groupedClasses[cls.class_date].push(cls);
    });
  }

  return (
    <div className="space-y-4">
      {/* 4-Day Schedule Summary Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 text-white shadow-md relative overflow-hidden border border-zinc-800">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                Schedule Overview • Next 4 Days
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5">
                {classes.length} Sessions Scheduled
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-teal-400">{todayClassesCount}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Today</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-amber-400">{upcomingCount}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Upcoming</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-base font-black text-emerald-400">{completedCount}</p>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation Slide Bar (Today + Next 4 Upcoming Days) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600">
            Select Day View
          </span>
          <button
            onClick={() => fetchClasses(user?.id)}
            className="text-[11px] text-teal-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDateFilter('all')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedDateFilter === 'all'
                ? 'bg-zinc-950 text-white shadow-md'
                : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <span>All 4 Days</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-600">
              {classes.length}
            </span>
          </button>

          {dayOptions.map((opt) => {
            const count = classes.filter((c) => c.class_date === opt.dateStr).length;
            const isSelected = selectedDateFilter === opt.dateStr;

            return (
              <button
                key={opt.dateStr}
                onClick={() => setSelectedDateFilter(opt.dateStr)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold shrink-0 flex flex-col items-center min-w-[72px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className={`text-[11px] ${isSelected ? 'text-teal-300' : 'text-zinc-500'}`}>
                  {opt.label}
                </span>
                <span className="text-xs font-black leading-tight mt-0.5">
                  {opt.subLabel}
                </span>
                {count > 0 && (
                  <span className={`mt-1 text-[9px] px-1.5 rounded-full font-bold ${
                    isSelected ? 'bg-teal-400 text-zinc-950' : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}>
                    {count} {count === 1 ? 'class' : 'classes'}
                  </span>
                )}
              </button>
            );
          })}
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
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading your schedule...</div>
        ) : visibleClasses.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs space-y-2">
            <CalendarDays className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-zinc-800">No classes found</p>
            <p className="text-[11px] text-zinc-400">
              {selectedDateFilter === 'all'
                ? 'No classes scheduled for the upcoming 4 days.'
                : `No sessions scheduled for ${formatDateIST(selectedDateFilter)}.`}
            </p>
          </div>
        ) : selectedDateFilter === 'all' ? (
          // Grouped by Date View
          Object.keys(groupedClasses).map((dateKey) => {
            const dateClasses = groupedClasses[dateKey];
            const isToday = dateKey === todayStr;

            return (
              <div key={dateKey} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-xs font-black text-zinc-900">
                      {isToday ? 'Today' : formatDateIST(dateKey)}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-zinc-950 uppercase">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {dateClasses.length} {dateClasses.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="space-y-3">
                  {dateClasses.map((cls) => (
                    <ClassCard
                      key={cls.id}
                      session={cls}
                      onRefresh={() => fetchClasses(user?.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Single Date View
          visibleClasses.map((cls) => (
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
