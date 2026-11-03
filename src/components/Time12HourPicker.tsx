'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { from24HourTime, to24HourTime, formatTime12Hour } from '@/lib/time-utils';

interface Time12HourPickerProps {
  value: string; // "HH:mm:ss" or "HH:mm"
  onChange: (time24: string) => void;
  label?: string;
  helperText?: string;
}

export default function Time12HourPicker({
  value,
  onChange,
  label,
  helperText,
}: Time12HourPickerProps) {
  const initial = from24HourTime(value || '10:00:00');
  const [hour, setHour] = useState<number>(initial.hour12);
  const [minute, setMinute] = useState<number>(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);

  // Sync internal state when external value changes meaningfully
  useEffect(() => {
    if (value) {
      const parsed = from24HourTime(value);
      setHour(parsed.hour12);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [value]);

  const handleUpdate = (h: number, m: number, p: 'AM' | 'PM') => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
    const new24 = to24HourTime(h, m, p);
    onChange(new24);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentFormatted = formatTime12Hour(to24HourTime(hour, minute, period));

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            {label}
          </label>
          <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
            {currentFormatted} IST
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Hour Select */}
        <div className="flex-1">
          <select
            value={hour}
            onChange={(e) => handleUpdate(Number(e.target.value), minute, period)}
            className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-zinc-900"
          >
            {hoursList.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')} Hr
              </option>
            ))}
          </select>
        </div>

        <span className="text-zinc-400 font-bold">:</span>

        {/* Minute Select */}
        <div className="flex-1">
          <select
            value={minute}
            onChange={(e) => handleUpdate(hour, Number(e.target.value), period)}
            className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-zinc-900"
          >
            {minutesList.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')} Min
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Toggle */}
        <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
          <button
            type="button"
            onClick={() => handleUpdate(hour, minute, 'AM')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              period === 'AM'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleUpdate(hour, minute, 'PM')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
              period === 'PM'
                ? 'bg-teal-500 text-zinc-950 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {helperText && <p className="text-[10px] text-zinc-400">{helperText}</p>}
    </div>
  );
}
