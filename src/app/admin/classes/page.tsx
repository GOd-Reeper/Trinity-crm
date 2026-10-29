'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Filter,
  Calendar,
  Bike,
  Car,
  Image,
  Repeat
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession, Client, Profile } from '@/lib/types';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('all');

  // Form states
  const [clientId, setClientId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [classDate, setClassDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [scheduleMode, setScheduleMode] = useState<'single' | 'monthly'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const curDate = new Date().toISOString().split('T')[0];
    setFilterDate(curDate);
    setClassDate(curDate);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const { data: clientsData } = await supabase.from('clients').select('*').eq('status', 'active');
    const { data: empsData } = await supabase.from('profiles').select('*').eq('role', 'employee').eq('is_active', true);

    let query = supabase
      .from('classes')
      .select(`*, client:clients(*), employee:profiles(*)`)
      .order('class_date', { ascending: false })
      .order('start_time', { ascending: true });

    if (filterDate) {
      query = query.eq('class_date', filterDate);
    }
    if (filterEmployeeId !== 'all') {
      query = query.eq('employee_id', filterEmployeeId);
    }

    const { data: classesData } = await query;

    if (clientsData) {
      setClients(clientsData);
      if (!clientId && clientsData.length > 0) setClientId(clientsData[0].id);
    }
    if (empsData) {
      setEmployees(empsData);
      if (!employeeId && empsData.length > 0) setEmployeeId(empsData[0].id);
    }
    if (classesData) setClasses(classesData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterEmployeeId]);

  const handleCreateClasses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !employeeId) return;

    setIsSubmitting(true);
    try {
      // Calculate start and end time
      const [sh, sm] = startTime.split(':').map(Number);
      const endTotalMins = sh * 60 + sm + durationMinutes;
      const eh = Math.floor(endTotalMins / 60) % 24;
      const em = endTotalMins % 60;
      const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
      const formattedStartTime = `${startTime}:00`;

      if (scheduleMode === 'single') {
        const startIso = `${classDate}T${formattedStartTime}`;
        const endIso = `${classDate}T${endTime}`;

        const { error } = await supabase.from('classes').insert({
          client_id: clientId,
          employee_id: employeeId,
          class_date: classDate,
          start_time: formattedStartTime,
          end_time: endTime,
          scheduled_start_timestamp: new Date(startIso).toISOString(),
          scheduled_end_timestamp: new Date(endIso).toISOString(),
          status: 'scheduled',
        });

        if (error) throw error;
      } else {
        // Monthly batch schedule: 30 consecutive days
        const batchRecords = [];
        const baseDate = new Date(classDate);

        for (let i = 0; i < 30; i++) {
          const d = new Date(baseDate);
          d.setDate(baseDate.getDate() + i);
          const dStr = d.toISOString().split('T')[0];

          const startIso = `${dStr}T${formattedStartTime}`;
          const endIso = `${dStr}T${endTime}`;

          batchRecords.push({
            client_id: clientId,
            employee_id: employeeId,
            class_date: dStr,
            start_time: formattedStartTime,
            end_time: endTime,
            scheduled_start_timestamp: new Date(startIso).toISOString(),
            scheduled_end_timestamp: new Date(endIso).toISOString(),
            status: 'scheduled',
          });
        }

        const { error } = await supabase.from('classes').insert(batchRecords);
        if (error) throw error;
      }

      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Classes & Timetable</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Schedule 1-hour sessions, assign trainers, and track travel & late penalties.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Session</span>
        </button>
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
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50"
          />

          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50"
          >
            <option value="all">All Trainers</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setFilterDate(''); setFilterEmployeeId('all'); }}
          className="text-xs text-zinc-500 hover:text-zinc-800 underline font-medium"
        >
          Clear Filters
        </button>
      </div>

      {/* Class List Table / Cards */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {classes.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-zinc-700">No classes found for this date</p>
            <p className="text-xs text-zinc-400 mt-1">Click &quot;Schedule New Session&quot; to assign a class.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/60 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Time Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/60 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                    <span className="text-[11px] leading-tight">{cls.start_time?.slice(0, 5)}</span>
                    <span className="text-[9px] text-teal-600 font-semibold mt-0.5">1-HOUR</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-zinc-950">{cls.client?.full_name || 'Client'}</h3>
                      <span className="text-xs text-zinc-400">•</span>
                      <span className="text-xs text-zinc-600">
                        Date: <strong className="text-zinc-900">{cls.class_date}</strong>
                      </span>
                      {cls.is_half_day_penalty && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Half Day Penalty
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500">
                      Assigned Trainer: <strong className="text-zinc-800">{cls.employee?.full_name}</strong> ({cls.employee?.employee_code})
                    </p>

                    {/* Travel details & Proof */}
                    {cls.travel_mode && (
                      <div className="flex items-center gap-3 text-[11px] text-zinc-600 pt-1">
                        <span className="flex items-center gap-1 font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
                          {cls.travel_mode === 'rapido' && <Bike className="w-3 h-3 text-amber-500" />}
                          {cls.travel_mode === 'uber' && <Car className="w-3 h-3 text-zinc-900" />}
                          Mode: {cls.travel_mode} {cls.travel_dropped_by_name && `(${cls.travel_dropped_by_name})`}
                        </span>

                        {cls.start_photo_url && (
                          <button
                            onClick={() => setSelectedProofPhoto(cls.start_photo_url!)}
                            className="text-teal-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Image className="w-3 h-3" /> View Selfie
                          </button>
                        )}

                        {cls.travel_receipt_url && (
                          <button
                            onClick={() => setSelectedProofPhoto(cls.travel_receipt_url!)}
                            className="text-teal-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Image className="w-3 h-3" /> View Fare Screenshot
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    cls.status === 'completed'
                      ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                      : cls.status === 'in_progress'
                      ? 'bg-teal-500 text-zinc-950 shadow-xs'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {cls.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal (Single or Monthly Repeat) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-base font-extrabold text-zinc-950">Schedule Fitness Class</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClasses} className="space-y-3.5">
              {/* Single vs Monthly Schedule Toggle */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">Schedule Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('single')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      scheduleMode === 'single'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    Single Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      scheduleMode === 'monthly'
                        ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Monthly (30 Days)</span>
                  </button>
                </div>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Select Client *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trainer Assignment */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Assign Trainer *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    {scheduleMode === 'monthly' ? 'Starting Date' : 'Class Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Start Time (1 Hour)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                {scheduleMode === 'monthly' ? (
                  <p>
                    ⚡ Will generate <strong>30 daily consecutive 1-hour sessions</strong> at {startTime} for this client.
                  </p>
                ) : (
                  <p>
                    ⚡ Single 1-hour session. Trainer app will unlock &quot;Start Class&quot; at exactly {startTime}.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save & Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedProofPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-950 rounded-3xl p-4 border border-zinc-800 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Proof Attachment</span>
              <button onClick={() => setSelectedProofPhoto(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-zinc-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedProofPhoto} alt="Proof" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
