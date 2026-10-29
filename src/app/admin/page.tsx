'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarDays,
  MapPin,
  CalendarOff,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Dumbbell
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession, LeaveApplication, IssueEscalation } from '@/lib/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    activeClients: 0,
    todayClasses: 0,
    classesCompleted: 0,
    halfDaysFlagged: 0,
    pendingLeaves: 0,
    openIssues: 0,
    employeesOnShift: 0,
  });
  const [todayClassesList, setTodayClassesList] = useState<ClassSession[]>([]);
  const [pendingLeavesList, setPendingLeavesList] = useState<LeaveApplication[]>([]);
  const [openIssuesList, setOpenIssuesList] = useState<IssueEscalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [todayStr, setTodayStr] = useState('');

  const fetchDashboardData = async (dateStr: string) => {
    setIsLoading(true);

    try {
      // 1. Clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 2. Today's Classes
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          *,
          client:clients(*),
          employee:profiles(*)
        `)
        .eq('class_date', dateStr)
        .order('start_time', { ascending: true });

      const todayClasses = classesData || [];
      const completedClasses = todayClasses.filter((c) => c.status === 'completed').length;
      const lateHalfDays = todayClasses.filter((c) => c.is_half_day_penalty).length;

      // 3. Attendance
      const { data: attendanceData } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('attendance_date', dateStr);

      const onShift = (attendanceData || []).filter((a) => a.punch_in_time && !a.punch_out_time).length;
      const attendanceHalfDays = (attendanceData || []).filter((a) => a.status === 'half_day').length;

      // 4. Pending leaves
      const { data: leavesData } = await supabase
        .from('leave_applications')
        .select(`*, employee:profiles(*)`)
        .eq('status', 'pending');

      // 5. Open issues
      const { data: issuesData } = await supabase
        .from('issues_escalations')
        .select(`*, employee:profiles(*)`)
        .eq('status', 'open');

      setStats({
        activeClients: clientsCount || 0,
        todayClasses: todayClasses.length,
        classesCompleted: completedClasses,
        halfDaysFlagged: lateHalfDays + attendanceHalfDays,
        pendingLeaves: (leavesData || []).length,
        openIssues: (issuesData || []).length,
        employeesOnShift: onShift,
      });

      setTodayClassesList(todayClasses);
      setPendingLeavesList(leavesData || []);
      setOpenIssuesList(issuesData || []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const curDate = new Date().toISOString().split('T')[0];
    setTodayStr(curDate);
    fetchDashboardData(curDate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Realtime session monitoring, trainer attendance, and operational alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/classes"
            className="px-3.5 py-2 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </Link>
          <Link
            href="/admin/clients"
            className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>New Client</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Clients */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Clients</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-950">{stats.activeClients}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">1-hr daily package enrolled</p>
          </div>
        </div>

        {/* Today's Classes */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today&apos;s Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-950">{stats.todayClasses}</p>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
              {stats.classesCompleted} completed • {stats.todayClasses - stats.classesCompleted} remaining
            </p>
          </div>
        </div>

        {/* Half-Day Penalty Flags */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Half-Days Flagged</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-red-600">{stats.halfDaysFlagged}</p>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">&gt;10 min late or shift threshold</p>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Leaves / Issues</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarOff className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-zinc-950">
              {stats.pendingLeaves} <span className="text-xs font-normal text-zinc-400">/ {stats.openIssues} issues</span>
            </p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Requires admin action</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Classes + Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Class Schedule (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Today&apos;s Class Timetable</span>
            </h2>
            <Link href="/admin/classes" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              <span>View all schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayClassesList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200/80">
              <CalendarDays className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-700">No classes scheduled for today</p>
              <p className="text-[11px] text-zinc-400 mt-1">Assign classes from the Classes & Timetable tab.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayClassesList.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex flex-col items-center justify-center text-[10px] leading-tight shrink-0">
                      <span>{session.start_time?.slice(0, 5)}</span>
                      <span className="text-[9px] text-teal-500">1 HR</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-zinc-950">{session.client?.full_name || 'Client'}</h3>
                        {session.is_half_day_penalty && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">
                            Half Day Penalty
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Trainer: <strong className="text-zinc-800">{session.employee?.full_name || 'Unassigned'}</strong>
                        {session.travel_mode && ` • Via ${session.travel_mode}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${session.status === 'completed'
                        ? 'bg-zinc-100 text-zinc-700'
                        : session.status === 'in_progress'
                          ? 'bg-teal-500 text-zinc-950'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pending Approvals & Open Issues */}
        <div className="space-y-6">
          {/* Pending Leaves Queue */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarOff className="w-4 h-4 text-teal-600" />
                <span>Pending Leave Requests</span>
              </h3>
              <Link href="/admin/leaves" className="text-[11px] font-bold text-teal-600 hover:underline">
                Review ({pendingLeavesList.length})
              </Link>
            </div>

            {pendingLeavesList.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No pending leave applications.</p>
            ) : (
              <div className="space-y-2">
                {pendingLeavesList.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">{leave.employee?.full_name}</span>
                      <span className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {leave.leave_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      {leave.from_date} to {leave.to_date}
                    </p>
                    <p className="text-[11px] text-zinc-600 italic line-clamp-1">&quot;{leave.description}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Issues Queue */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Reported Issues</span>
              </h3>
              <Link href="/admin/issues" className="text-[11px] font-bold text-teal-600 hover:underline">
                Resolve ({openIssuesList.length})
              </Link>
            </div>

            {openIssuesList.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">No open incident reports.</p>
            ) : (
              <div className="space-y-2">
                {openIssuesList.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 line-clamp-1">{issue.title}</span>
                      <span className="text-[9px] uppercase font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      By {issue.employee?.full_name} • {issue.category}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
