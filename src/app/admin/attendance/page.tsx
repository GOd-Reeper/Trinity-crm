'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  KeyRound,
  Filter,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmployeeAttendance, Profile } from '@/lib/types';
import { getTodayIST, formatDateIST, formatTimeOnlyIST } from '@/lib/time-utils';

export default function AdminAttendancePage() {
  const [attendanceLogs, setAttendanceLogs] = useState<EmployeeAttendance[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedDate(getTodayIST());
  }, []);

  const fetchAttendance = async () => {
    setIsLoading(true);
    const { data: empsData } = await supabase.from('profiles').select('*').eq('role', 'employee');
    if (empsData) setEmployees(empsData);

    let query = supabase
      .from('employee_attendance')
      .select('*, employee:profiles(*)')
      .order('attendance_date', { ascending: false });

    if (selectedDate) {
      query = query.eq('attendance_date', selectedDate);
    }
    if (selectedEmpId !== 'all') {
      query = query.eq('employee_id', selectedEmpId);
    }

    const { data } = await query;
    if (data) setAttendanceLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedEmpId]);

  const toggleHalfDay = async (logId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'half_day' ? 'present' : 'half_day';
    try {
      const { error } = await supabase
        .from('employee_attendance')
        .update({ status: newStatus })
        .eq('id', logId);

      if (error) throw error;
      fetchAttendance();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Staff Attendance & GPS Logs</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Realtime daily punch-ins with GPS coordinates, PIN-verified punch-outs, and shift hour calculations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter:</span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50"
          />

          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50"
          >
            <option value="all">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setSelectedDate(''); setSelectedEmpId('all'); }}
          className="text-xs text-zinc-500 hover:text-zinc-800 underline font-medium"
        >
          Reset Filters
        </button>
      </div>

      {/* Attendance Cards / Table */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {attendanceLogs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-zinc-700">No punch records found</p>
            <p className="text-xs text-zinc-400 mt-1">Staff punch-ins will automatically appear here with GPS data.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {attendanceLogs.map((log) => {
              const googleMapsUrl = log.punch_in_latitude && log.punch_in_longitude
                ? `https://www.google.com/maps?q=${log.punch_in_latitude},${log.punch_in_longitude}`
                : null;

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Status Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                      log.status === 'half_day'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                    }`}>
                      <span className="text-[10px] font-black uppercase">
                        {log.total_hours ? `${log.total_hours}h` : 'LIVE'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-zinc-950">{log.employee?.full_name}</h3>
                        <span className="text-xs text-teal-600 font-bold uppercase tracking-wide">
                          ({log.employee?.employee_code})
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-600 font-medium">Date: {formatDateIST(log.attendance_date)}</span>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          Punch In:{' '}
                          <strong className="text-zinc-900 font-bold">
                            {formatTimeOnlyIST(log.punch_in_time)}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          Punch Out:{' '}
                          <strong className="text-zinc-900 font-bold">
                            {log.punch_out_time ? formatTimeOnlyIST(log.punch_out_time) : 'Still on shift'}
                          </strong>
                        </span>

                        {log.is_verified_by_pin && (
                          <span className="flex items-center gap-1 text-teal-700 font-bold text-[10px] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            <KeyRound className="w-3 h-3" /> PIN Verified
                          </span>
                        )}
                      </div>

                      {/* GPS Location & Map Link */}
                      {log.punch_in_latitude && log.punch_in_longitude && (
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate max-w-xs">{log.punch_in_location_name || `${log.punch_in_latitude.toFixed(4)}, ${log.punch_in_longitude.toFixed(4)}`}</span>
                          {googleMapsUrl && (
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 hover:text-teal-700 font-bold inline-flex items-center gap-0.5"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleHalfDay(log.id, log.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        log.status === 'half_day'
                          ? 'bg-red-500 text-white border-red-500 shadow-sm'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      {log.status === 'half_day' ? 'Half-Day Flagged' : 'Mark Half-Day'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
