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
  Image as ImageIcon, 
  Repeat,
  Edit3,
  Trash2,
  XCircle,
  Check,
  RotateCcw,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ClassSession, ClassStatus, Client, Profile } from '@/lib/types';
import Time12HourPicker from '@/components/Time12HourPicker';
import { 
  formatDateIST, 
  formatTime12Hour, 
  formatTimeRange12Hour, 
  getTodayIST 
} from '@/lib/time-utils';

function calculateEndTime(startTimeStr: string, durationMinutes = 60): string {
  const parts = startTimeStr.split(':');
  const sh = parseInt(parts[0], 10) || 0;
  const sm = parseInt(parts[1], 10) || 0;
  const endTotalMins = sh * 60 + sm + durationMinutes;
  const eh = Math.floor(endTotalMins / 60) % 24;
  const em = endTotalMins % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);

  // Filters
  const [todayIST, setTodayIST] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Add Class Form State
  const [clientId, setClientId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [classDate, setClassDate] = useState('');
  const [startTime, setStartTime] = useState('10:00:00'); // 24h internal format
  const [scheduleMode, setScheduleMode] = useState<'single' | 'monthly'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Class Form State
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [editClassDate, setEditClassDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('10:00:00');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editStatus, setEditStatus] = useState<ClassStatus>('scheduled');
  const [editHalfDay, setEditHalfDay] = useState(false);
  const [editPenaltyReason, setEditPenaltyReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Delete State
  const [sessionToDelete, setSessionToDelete] = useState<ClassSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const today = getTodayIST();
    setTodayIST(today);
    setFilterDate(today);
    setClassDate(today);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .order('full_name');

    const { data: empsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .eq('is_active', true)
      .order('full_name');

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
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data: classesData, error } = await query;

    if (clientsData) {
      setClients(clientsData);
      if (!clientId && clientsData.length > 0) setClientId(clientsData[0].id);
    }
    if (empsData) {
      setEmployees(empsData);
      if (!employeeId && empsData.length > 0) setEmployeeId(empsData[0].id);
    }
    if (!error && classesData) {
      setClasses(classesData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterEmployeeId, filterStatus]);

  // Handle Create Session(s)
  const handleCreateClasses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !employeeId || !classDate) {
      alert('Please select client, trainer, and date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
      const endTime = calculateEndTime(formattedStartTime, 60);

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

  // Open Edit Modal
  const openEditModal = (session: ClassSession) => {
    setEditingSession(session);
    setEditClassDate(session.class_date);
    setEditStartTime(session.start_time || '10:00:00');
    setEditEmployeeId(session.employee_id);
    setEditStatus(session.status);
    setEditHalfDay(session.is_half_day_penalty || false);
    setEditPenaltyReason(session.penalty_reason || '');
    setShowEditModal(true);
  };

  // Handle Update Session
  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    setIsEditing(true);
    try {
      const formattedStartTime = editStartTime.length === 5 ? `${editStartTime}:00` : editStartTime;
      const endTime = calculateEndTime(formattedStartTime, 60);

      const startIso = `${editClassDate}T${formattedStartTime}`;
      const endIso = `${editClassDate}T${endTime}`;

      const { error } = await supabase
        .from('classes')
        .update({
          class_date: editClassDate,
          start_time: formattedStartTime,
          end_time: endTime,
          scheduled_start_timestamp: new Date(startIso).toISOString(),
          scheduled_end_timestamp: new Date(endIso).toISOString(),
          employee_id: editEmployeeId,
          status: editStatus,
          is_half_day_penalty: editHalfDay,
          penalty_reason: editHalfDay ? editPenaltyReason || 'Manual half-day penalty applied by admin.' : null,
        })
        .eq('id', editingSession.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingSession(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update class session');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle Quick Cancel
  const handleQuickCancel = async (session: ClassSession) => {
    const confirmCancel = confirm(`Cancel session for ${session.client?.full_name} scheduled on ${formatDateIST(session.class_date)}?`);
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'cancelled' })
        .eq('id', session.id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel session');
    }
  };

  // Handle Permanent Delete
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', sessionToDelete.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSessionToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Classes & Timetable</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Schedule 1-hour sessions, assign trainers in IST time (AM/PM), reschedule, and review travel proofs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Session</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>Filters:</span>
            </div>

            {/* Quick Date Shortcuts */}
            <button
              onClick={() => setFilterDate(todayIST)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterDate === todayIST
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFilterDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all cursor-pointer"
            >
              Tomorrow
            </button>

            {/* Date Input */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50 text-zinc-900 font-semibold"
            />

            {/* Trainer Select */}
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50 text-zinc-800 font-medium"
            >
              <option value="all">All Trainers</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code})
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-zinc-50 text-zinc-800 font-medium capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilterDate('');
              setFilterEmployeeId('all');
              setFilterStatus('all');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-400">Loading timetable...</div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 px-4">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50 text-teal-600" />
            <p className="text-sm font-bold text-zinc-800">No classes found</p>
            <p className="text-xs text-zinc-500 mt-1">
              {filterDate ? `No sessions scheduled for ${formatDateIST(filterDate)}.` : 'No sessions match the selected filters.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Session</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {classes.map((cls) => {
              const formattedTime12 = formatTime12Hour(cls.start_time);
              const formattedRange12 = formatTimeRange12Hour(cls.start_time, cls.end_time);

              return (
                <div
                  key={cls.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Time Badge (12-Hour AM/PM) */}
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-900 border border-teal-200 flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      <span className="text-[11px] leading-tight text-teal-950 font-extrabold">{formattedTime12}</span>
                      <span className="text-[9px] text-teal-600 font-bold mt-0.5">1-HOUR</span>
                    </div>

                    {/* Class Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-zinc-950">{cls.client?.full_name || 'Client'}</h3>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-600 font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {formatDateIST(cls.class_date)}
                        </span>
                        <span className="text-xs text-teal-700 font-bold">
                          ({formattedRange12} IST)
                        </span>

                        {cls.is_half_day_penalty && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1 border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Half Day Penalty
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600">
                        Trainer: <strong className="text-zinc-900 font-semibold">{cls.employee?.full_name || 'Unassigned'}</strong>
                        {cls.employee?.employee_code && (
                          <span className="text-zinc-400 font-normal"> ({cls.employee.employee_code})</span>
                        )}
                      </p>

                      {/* Travel details & Proof Attachments */}
                      {cls.travel_mode && (
                        <div className="flex items-center gap-3 text-[11px] text-zinc-600 pt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
                            {cls.travel_mode === 'rapido' && <Bike className="w-3.5 h-3.5 text-amber-500" />}
                            {cls.travel_mode === 'uber' && <Car className="w-3.5 h-3.5 text-zinc-900" />}
                            Travel: <strong className="capitalize">{cls.travel_mode}</strong>
                            {cls.travel_dropped_by_name && ` (${cls.travel_dropped_by_name})`}
                          </span>

                          {cls.start_photo_url && (
                            <button
                              onClick={() => setSelectedProofPhoto(cls.start_photo_url!)}
                              className="text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> View Selfie
                            </button>
                          )}

                          {cls.travel_receipt_url && (
                            <button
                              onClick={() => setSelectedProofPhoto(cls.travel_receipt_url!)}
                              className="text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> View Receipt
                            </button>
                          )}
                        </div>
                      )}

                      {cls.session_notes && (
                        <p className="text-[11px] text-zinc-500 italic pt-0.5">
                          Notes: &quot;{cls.session_notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Status Badge + Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                        cls.status === 'completed'
                          ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          : cls.status === 'in_progress'
                          ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-xs animate-pulse'
                          : cls.status === 'missed'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : cls.status === 'cancelled'
                          ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {cls.status}
                    </span>

                    {/* Edit Session */}
                    <button
                      onClick={() => openEditModal(cls)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit or Reschedule Class"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Edit</span>
                    </button>

                    {/* Quick Cancel if not completed or cancelled */}
                    {cls.status !== 'completed' && cls.status !== 'cancelled' && (
                      <button
                        onClick={() => handleQuickCancel(cls)}
                        className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs transition-colors cursor-pointer"
                        title="Cancel Class"
                      >
                        <XCircle className="w-4 h-4 text-zinc-500" />
                      </button>
                    )}

                    {/* Hard Delete */}
                    <button
                      onClick={() => {
                        setSessionToDelete(cls);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs transition-colors cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal (Single or Monthly Repeat) with 12-Hour AM/PM Picker */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950">Schedule Fitness Class</h2>
                <p className="text-[11px] text-zinc-400">1-hour session with IST 12-hour AM/PM timing</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClasses} className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Select Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone}) - {c.preferred_measurement_day}s
                    </option>
                  ))}
                </select>
              </div>

              {/* Trainer Assignment */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Assign Trainer *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Class Date *</label>
                <input
                  type="date"
                  required
                  value={classDate}
                  onChange={(e) => setClassDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* 12-Hour AM/PM Time Picker */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                <Time12HourPicker
                  value={startTime}
                  onChange={setStartTime}
                  label="Session Start Time (IST)"
                  helperText="Classes run for 1 full hour. Starts punctually in Indian Standard Time."
                />
                <div className="mt-2 pt-2 border-t border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
                  <span>Class Window:</span>
                  <strong className="text-teal-800 font-bold">
                    {formatTime12Hour(startTime)} - {formatTime12Hour(calculateEndTime(startTime, 60))}
                  </strong>
                </div>
              </div>

              {/* Schedule Mode */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Repeat Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('single')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      scheduleMode === 'single'
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    Single Session (1 Day)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      scheduleMode === 'monthly'
                        ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Monthly (30 Days)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Scheduling...' : scheduleMode === 'monthly' ? 'Create 30 Sessions' : 'Confirm Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Reschedule Modal */}
      {showEditModal && editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950">Edit / Reschedule Session</h2>
                <p className="text-[11px] text-zinc-400">
                  Client: <strong className="text-zinc-800">{editingSession.client?.full_name}</strong>
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Class Date *</label>
                <input
                  type="date"
                  required
                  value={editClassDate}
                  onChange={(e) => setEditClassDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Time 12-Hour Picker */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                <Time12HourPicker
                  value={editStartTime}
                  onChange={setEditStartTime}
                  label="Session Start Time (IST)"
                  helperText="12-Hour AM/PM format"
                />
                <div className="mt-2 pt-2 border-t border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
                  <span>New Window:</span>
                  <strong className="text-teal-800 font-bold">
                    {formatTime12Hour(editStartTime)} - {formatTime12Hour(calculateEndTime(editStartTime, 60))}
                  </strong>
                </div>
              </div>

              {/* Reassign Trainer */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Assigned Trainer *</label>
                <select
                  required
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Session Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ClassStatus)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white capitalize"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Half-Day Penalty Toggle */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHalfDay}
                    onChange={(e) => setEditHalfDay(e.target.checked)}
                    className="w-4 h-4 rounded-md text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-zinc-900">Flag Half-Day Penalty for Trainer</span>
                </label>

                {editHalfDay && (
                  <div>
                    <input
                      type="text"
                      placeholder="Penalty reason (e.g. Late start > 10m, missed class)"
                      value={editPenaltyReason}
                      onChange={(e) => setEditPenaltyReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isEditing ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-zinc-950">Delete Class Session?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to permanently delete the session for{' '}
                <strong>{sessionToDelete.client?.full_name}</strong> on{' '}
                <strong>{formatDateIST(sessionToDelete.class_date)}</strong> at{' '}
                <strong>{formatTime12Hour(sessionToDelete.start_time)}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteSession}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedProofPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 rounded-3xl p-4 shadow-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">Class Proof Image</h3>
              <button
                onClick={() => setSelectedProofPhoto(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedProofPhoto}
                alt="Class Proof"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
