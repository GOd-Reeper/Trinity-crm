'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  KeyRound, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { getCurrentCoordinates, GeoLocationResult } from '@/lib/geo';
import { EmployeeAttendance, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getTodayIST, formatTimeOnlyIST, formatTimeRange12Hour } from '@/lib/time-utils';

interface PunchClockProps {
  employee: Profile;
  onAttendanceUpdated?: () => void;
}

export default function PunchClock({ employee, onAttendanceUpdated }: PunchClockProps) {
  const [todayAttendance, setTodayAttendance] = useState<EmployeeAttendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [isPunchingOut, setIsPunchingOut] = useState(false);
  const [locationResult, setLocationResult] = useState<GeoLocationResult | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [todayDateStr, setTodayDateStr] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  // Live digital clock in IST
  useEffect(() => {
    const todayStr = getTodayIST();
    setTodayDateStr(todayStr);

    const now = new Date();
    setCurrentDateFormatted(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now)
    );

    const updateTime = () => {
      setCurrentTime(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date())
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance record
  const fetchAttendance = async (dateStr?: string) => {
    setIsLoading(true);
    const dStr = dateStr || todayDateStr || getTodayIST();
    const { data, error } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('attendance_date', dStr)
      .maybeSingle();

    if (!error && data) {
      setTodayAttendance(data);
    } else {
      setTodayAttendance(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const curDate = getTodayIST();
    fetchAttendance(curDate);
  }, [employee.id]);

  // Handle Punch In (Auto GPS)
  const handlePunchIn = async () => {
    setIsPunchingIn(true);
    try {
      const geo = await getCurrentCoordinates();
      setLocationResult(geo);

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('employee_attendance')
        .upsert(
          {
            employee_id: employee.id,
            attendance_date: todayDateStr,
            punch_in_time: nowIso,
            punch_in_latitude: geo.latitude,
            punch_in_longitude: geo.longitude,
            punch_in_location_name: geo.formattedAddress,
            status: 'present',
          },
          { onConflict: 'employee_id,attendance_date' }
        )
        .select()
        .single();

      if (error) throw error;
      setTodayAttendance(data);
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err: any) {
      alert(`Location / Punch In Error: ${err.message || 'Could not acquire GPS position'}`);
    } finally {
      setIsPunchingIn(false);
    }
  };

  // Open Punch Out modal requiring PIN confirmation
  const initiatePunchOut = () => {
    setEnteredPin('');
    setPinError('');
    setShowPinModal(true);
  };

  // Confirm Punch Out with PIN
  const handleConfirmPunchOut = async () => {
    setPinError('');
    if (enteredPin !== employee.pin_hash) {
      setPinError('Invalid PIN! Please enter your correct security PIN.');
      return;
    }

    setIsPunchingOut(true);
    try {
      let geo: GeoLocationResult | null = null;
      try {
        geo = await getCurrentCoordinates();
      } catch {
        // Continue even if GPS timeout on punch out
      }

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('employee_attendance')
        .update({
          punch_out_time: nowIso,
          punch_out_latitude: geo?.latitude || null,
          punch_out_longitude: geo?.longitude || null,
          is_verified_by_pin: true,
        })
        .eq('employee_id', employee.id)
        .eq('attendance_date', todayDateStr)
        .select()
        .single();

      if (error) throw error;
      setTodayAttendance(data);
      setShowPinModal(false);
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err: any) {
      setPinError(err.message || 'Failed to punch out.');
    } finally {
      setIsPunchingOut(false);
    }
  };

  const hasPunchedIn = !!todayAttendance?.punch_in_time;
  const hasPunchedOut = !!todayAttendance?.punch_out_time;

  return (
    <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-sm space-y-4">
      {/* Live Header & Time */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping inline-block" />
            Live Office Clock
          </span>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight mt-0.5">{currentTime || '--:--:--'}</h2>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1 justify-end">
            <Calendar className="w-3.5 h-3.5" />
            {currentDateFormatted || 'Today'}
          </span>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Shift: {formatTimeRange12Hour(employee.shift_start_time || '09:00', employee.shift_end_time || '18:00')} (IST)
          </p>
        </div>
      </div>

      {/* Attendance Status Summary Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Today&apos;s Attendance</p>
          <p className="text-xs font-bold text-zinc-900">
            {hasPunchedOut
              ? `Shift Completed (${todayAttendance.total_hours || '0'} hrs)`
              : hasPunchedIn
              ? 'Currently On Shift'
              : 'Not Clocked In'}
          </p>
        </div>
        <div>
          {hasPunchedOut ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-600" /> Done
            </span>
          ) : hasPunchedIn ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Clocked In
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-200 text-zinc-600">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Punch details log */}
      {hasPunchedIn && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 space-y-1">
            <span className="text-[10px] font-bold text-teal-800 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-600" /> Punch In
            </span>
            <p className="text-sm font-extrabold text-zinc-950">
              {formatTimeOnlyIST(todayAttendance.punch_in_time)}
            </p>
            {todayAttendance.punch_in_location_name && (
              <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-teal-600" />
                <span className="truncate">{todayAttendance.punch_in_location_name}</span>
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-zinc-100/60 border border-zinc-200 space-y-1">
            <span className="text-[10px] font-bold text-zinc-700 uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" /> Punch Out
            </span>
            <p className="text-sm font-extrabold text-zinc-950">
              {hasPunchedOut ? formatTimeOnlyIST(todayAttendance.punch_out_time) : '--:--'}
            </p>
            <p className="text-[10px] text-zinc-500">
              {hasPunchedOut ? `Verified with PIN` : 'Pending shift end'}
            </p>
          </div>
        </div>
      )}

      {/* Main Punch Action Button */}
      {!hasPunchedIn && (
        <button
          disabled={isPunchingIn}
          onClick={handlePunchIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
        >
          {isPunchingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching GPS & Punching In...</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-zinc-950" />
              <span>PUNCH IN (Auto GPS Capture)</span>
            </>
          )}
        </button>
      )}

      {hasPunchedIn && !hasPunchedOut && (
        <button
          onClick={initiatePunchOut}
          className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.99] font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <KeyRound className="w-4 h-4 text-teal-400" />
          <span>PUNCH OUT (Enter Security PIN)</span>
        </button>
      )}

      {hasPunchedOut && (
        <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-center">
          <p className="text-xs font-bold text-teal-950">Shift Successfully Closed for Today</p>
          <p className="text-[11px] text-teal-700">Total duration: {todayAttendance?.total_hours || '0'} hours</p>
        </div>
      )}

      {/* PIN Confirmation Modal for Punch Out */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-950">Confirm Punch Out</h3>
              <p className="text-xs text-zinc-500">
                Enter your 4-digit employee security PIN to verify and close your shift.
              </p>
            </div>

            {/* PIN Numeric Keypad Display */}
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full text-center text-3xl font-mono tracking-widest py-3 border border-zinc-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {pinError && (
              <p className="text-xs text-red-600 font-medium text-center bg-red-50 p-2 rounded-xl">
                {pinError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPunchingOut || enteredPin.length < 3}
                onClick={handleConfirmPunchOut}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50"
              >
                {isPunchingOut ? 'Verifying...' : 'Confirm Punch Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
