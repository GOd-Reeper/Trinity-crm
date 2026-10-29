'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarClock, 
  Dumbbell, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  MapPin, 
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession, Profile } from '@/lib/types';
import ClassCard from '@/components/ClassCard';
import { useAuth } from '@/lib/auth-context';

export default function EmployeeClassesPage() {
  const { user, setUserDirect } = useAuth();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [allEmployees, setAllEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDateLabel, setCurrentDateLabel] = useState('');

  const fetchClasses = async (employeeId?: string, dateStr?: string) => {
    setIsLoading(true);

    const targetEmpId = employeeId || user?.id;
    const curDate = dateStr || new Date().toISOString().split('T')[0];

    // Fetch all employees in case user wants to switch trainer view
    const { data: emps } = await supabase.from('profiles').select('*').eq('role', 'employee');
    if (emps) setAllEmployees(emps);

    if (targetEmpId) {
      const { data } = await supabase
        .from('classes')
        .select('*, client:clients(*), employee:profiles(*)')
        .eq('employee_id', targetEmpId)
        .eq('class_date', curDate)
        .order('start_time', { ascending: true });

      if (data) setClasses(data);
    } else {
      // If no trainer logged in yet, default to first employee
      if (emps && emps.length > 0) {
        setUserDirect(emps[0]);
        const { data } = await supabase
          .from('classes')
          .select('*, client:clients(*), employee:profiles(*)')
          .eq('employee_id', emps[0].id)
          .eq('class_date', curDate)
          .order('start_time', { ascending: true });

        if (data) setClasses(data);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const now = new Date();
    setCurrentDateLabel(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    fetchClasses(user?.id, now.toISOString().split('T')[0]);
  }, [user?.id]);

  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const inProgressCount = classes.filter((c) => c.status === 'in_progress').length;
  const upcomingCount = classes.filter((c) => c.status === 'scheduled').length;

  return (
    <div className="space-y-4">
      {/* Trainer Switcher Pill for Testing */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 text-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px]">
            🏋️
          </div>
          <div>
            <p className="font-bold text-zinc-100">{user?.full_name || 'Akash Sharma'}</p>
            <p className="text-[10px] text-zinc-400">PIN: {user?.pin_hash || '1111'}</p>
          </div>
        </div>

        {allEmployees.length > 1 && (
          <select
            value={user?.id || ''}
            onChange={(e) => {
              const selected = allEmployees.find((emp) => emp.id === e.target.value);
              if (selected) {
                setUserDirect(selected);
                fetchClasses(selected.id);
              }
            }}
            className="bg-zinc-900 border border-zinc-800 text-teal-300 rounded-lg px-2 py-1 text-[11px] font-semibold"
          >
            {allEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        )}
      </div>

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
          • Upload selfie & specify travel mode (Rapido/Uber screenshot or drop name).<br />
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
