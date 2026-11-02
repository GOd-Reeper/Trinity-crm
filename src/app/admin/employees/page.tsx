'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  KeyRound, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Profile | null>(null);
  const [newPin, setNewPin] = useState('');

  // Add Employee Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [isFlexible, setIsFlexible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('employee_code');

    if (data) setEmployees(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('profiles').insert({
        role: 'employee',
        employee_code: employeeCode.trim() || `TRN-${Math.floor(100 + Math.random() * 900)}`,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        pin_hash: pin.trim(),
        shift_start_time: isFlexible ? null : `${shiftStart}:00`,
        shift_end_time: isFlexible ? null : `${shiftEnd}:00`,
        is_flexible_shift: isFlexible,
        is_active: true,
      });

      if (error) throw error;
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !newPin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pin_hash: newPin.trim() })
        .eq('id', selectedEmp.id);

      if (error) throw error;
      setShowPinModal(false);
      setNewPin('');
      fetchEmployees();
      alert(`PIN successfully updated for ${selectedEmp.full_name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update PIN');
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setEmployeeCode('');
    setPin('');
    setIsFlexible(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Staff & Shift Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure employee security PINs, custom office shifts, and attendance parameters.
          </p>
        </div>
        <button
          onClick={() => {
            setEmployeeCode(`TRN-${Math.floor(100 + Math.random() * 900)}`);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee Profile</span>
        </button>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-700 font-black flex items-center justify-center text-sm border border-teal-500/20">
                    {emp.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-950">{emp.full_name}</h3>
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">
                      {emp.employee_code} • {emp.role}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  emp.is_active ? 'bg-teal-100 text-teal-800' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {emp.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact Info */}
              <div className="mt-3.5 space-y-1.5 text-xs text-zinc-600">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{emp.phone}</span>
                </p>
                {emp.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </p>
                )}
              </div>

              {/* Shift Hours Specification */}
              <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Office Shift Configuration
                </span>
                <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  {emp.is_flexible_shift ? (
                    <span className="text-indigo-600">Flexible Timing (No Fixed Shift)</span>
                  ) : (
                    <span>
                      {emp.shift_start_time?.slice(0, 5) || '09:00'} - {emp.shift_end_time?.slice(0, 5) || '18:00'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Bottom Actions: View PIN / Reset PIN */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-[11px] text-zinc-500">
                PIN: <strong className="font-mono text-zinc-900">{emp.pin_hash}</strong>
              </div>
              <button
                onClick={() => {
                  setSelectedEmp(emp);
                  setNewPin(emp.pin_hash);
                  setShowPinModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3 text-teal-600" />
                <span>Reset PIN</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-base font-extrabold text-zinc-950">Add Employee / Trainer</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Login PIN (4-digit) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter employee full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Office Shift Configuration */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900">Shift Timings</label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFlexible}
                      onChange={(e) => setIsFlexible(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Flexible Hours (No Fixed Shift)</span>
                  </label>
                </div>

                {!isFlexible && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Shift Start</span>
                      <input
                        type="time"
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Shift End</span>
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>
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
                  {isSubmitting ? 'Saving...' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showPinModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-teal-600 mx-auto" />
              <h3 className="text-base font-extrabold text-zinc-950">Change Security PIN</h3>
              <p className="text-xs text-zinc-500">{selectedEmp.full_name}</p>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-3">
              <input
                type="text"
                required
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="New 4-digit PIN"
                className="w-full text-center text-2xl font-mono tracking-widest py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-teal-500"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

