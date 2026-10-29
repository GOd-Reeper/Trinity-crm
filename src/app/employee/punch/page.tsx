'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  History
} from 'lucide-react';
import PunchClock from '@/components/PunchClock';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { EmployeeAttendance } from '@/lib/types';

export default function EmployeePunchPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<EmployeeAttendance[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('employee_id', user.id)
      .order('attendance_date', { ascending: false })
      .limit(7);

    if (data) setHistory(data);
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200">
        <p className="text-xs font-bold text-zinc-800">Please log in as an employee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Punch Clock Component */}
      <PunchClock
        employee={user}
        onAttendanceUpdated={fetchHistory}
      />

      {/* Office Timing Rule Reminder */}
      <div className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-2xs space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-zinc-950">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>Office Attendance Policy</span>
        </div>
        <p className="text-zinc-600 text-[11px] leading-relaxed">
          • Punch in daily from your mobile device when you arrive at your scheduled location.<br />
          • GPS coordinates are automatically recorded to prevent proxy attendance.<br />
          • <strong>Punch out requires your 4-digit PIN confirmation</strong> to calculate total shift hours.
        </p>
      </div>

      {/* Recent 7 Days Punch History */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <History className="w-4 h-4 text-zinc-500" />
          <span>Past 7 Days History</span>
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center bg-white rounded-2xl border border-zinc-100">
            No past attendance logs yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950">{log.attendance_date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      log.status === 'half_day'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {log.status === 'half_day' ? 'Half Day' : 'Present'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    In: {log.punch_in_time ? new Date(log.punch_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} • Out: {log.punch_out_time ? new Date(log.punch_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-zinc-950">{log.total_hours || '0'} hrs</p>
                  <p className="text-[10px] text-teal-600 font-semibold">
                    {log.is_verified_by_pin ? 'PIN Verified' : 'Logged'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

