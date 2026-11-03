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
  CalendarDays,
  Edit3,
  UserX,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import Time12HourPicker from '@/components/Time12HourPicker';
import { formatTimeRange12Hour, formatTime12Hour } from '@/lib/time-utils';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Profile | null>(null);
  const [newPin, setNewPin] = useState('');

  // Add Employee Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00:00');
  const [shiftEnd, setShiftEnd] = useState('18:00:00');
  const [isFlexible, setIsFlexible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Employee Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editShiftStart, setEditShiftStart] = useState('09:00:00');
  const [editShiftEnd, setEditShiftEnd] = useState('18:00:00');
  const [editIsFlexible, setEditIsFlexible] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('employee_code');

    if (!error && data) setEmployees(data);
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
        shift_start_time: isFlexible ? null : shiftStart,
        shift_end_time: isFlexible ? null : shiftEnd,
        is_flexible_shift: isFlexible,
        is_active: true,
      });

      if (error) throw error;
      setShowAddModal(false);
      resetAddForm();
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (emp: Profile) => {
    setSelectedEmp(emp);
    setEditFullName(emp.full_name);
    setEditPhone(emp.phone);
    setEditEmail(emp.email || '');
    setEditShiftStart(emp.shift_start_time || '09:00:00');
    setEditShiftEnd(emp.shift_end_time || '18:00:00');
    setEditIsFlexible(emp.is_flexible_shift || false);
    setEditIsActive(emp.is_active);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          shift_start_time: editIsFlexible ? null : editShiftStart,
          shift_end_time: editIsFlexible ? null : editShiftEnd,
          is_flexible_shift: editIsFlexible,
          is_active: editIsActive,
        })
        .eq('id', selectedEmp.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedEmp(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to update employee profile');
    } finally {
      setIsEditing(false);
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

  const resetAddForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setEmployeeCode('');
    setPin('');
    setShiftStart('09:00:00');
    setShiftEnd('18:00:00');
    setIsFlexible(false);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Staff & Shift Profiles</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage fitness trainers, configure IST shift timings (AM/PM), and manage punch verification PINs.
          </p>
        </div>
        <button
          onClick={() => {
            setEmployeeCode(`TRN-${Math.floor(100 + Math.random() * 900)}`);
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trainer / Staff</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by name, employee code, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className={`p-5 rounded-3xl bg-white border transition-all space-y-4 shadow-2xs ${
              emp.is_active ? 'border-zinc-200/90' : 'border-zinc-200/50 opacity-60 bg-zinc-50/50'
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-800 font-black text-sm flex items-center justify-center shrink-0">
                  {emp.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-950 flex items-center gap-1.5">
                    <span>{emp.full_name}</span>
                    {!emp.is_active && (
                      <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 mt-0.5 inline-block">
                    {emp.employee_code}
                  </span>
                </div>
              </div>

              <button
                onClick={() => openEditModal(emp)}
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                title="Edit Employee"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contact details */}
            <div className="space-y-1.5 text-xs text-zinc-600">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{emp.phone}</span>
              </p>
              {emp.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </p>
              )}
            </div>

            {/* Shift Hours Specification in 12-Hour AM/PM IST */}
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Office Shift Schedule (IST)
              </span>
              <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                {emp.is_flexible_shift ? (
                  <span className="text-teal-700 font-semibold">Flexible Shift (Open Schedule)</span>
                ) : (
                  <span>
                    {formatTimeRange12Hour(emp.shift_start_time, emp.shift_end_time)}
                  </span>
                )}
              </p>
            </div>

            {/* Bottom Actions: PIN & Reset */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-[11px] text-zinc-500">
                PIN: <strong className="font-mono text-zinc-900 font-bold">{emp.pin_hash}</strong>
              </div>
              <button
                onClick={() => {
                  setSelectedEmp(emp);
                  setNewPin(emp.pin_hash);
                  setShowPinModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
                  placeholder="e.g. Akash Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Office Shift Configuration with 12-Hour AM/PM Pickers */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900">Shift Timings (IST)</label>
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
                  <div className="space-y-3 pt-1">
                    <Time12HourPicker
                      value={shiftStart}
                      onChange={setShiftStart}
                      label="Shift Start Time"
                    />
                    <Time12HourPicker
                      value={shiftEnd}
                      onChange={setShiftEnd}
                      label="Shift End Time"
                    />
                  </div>
                )}
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
                  {isSubmitting ? 'Saving...' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950">Edit Staff Profile</h2>
                <p className="text-[11px] text-zinc-400">Code: {selectedEmp.employee_code}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Shift Hours with 12-Hour AM/PM */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900">Shift Configuration (IST)</label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsFlexible}
                      onChange={(e) => setEditIsFlexible(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Flexible Hours</span>
                  </label>
                </div>

                {!editIsFlexible && (
                  <div className="space-y-3 pt-1">
                    <Time12HourPicker
                      value={editShiftStart}
                      onChange={setEditShiftStart}
                      label="Shift Start Time"
                    />
                    <Time12HourPicker
                      value={editShiftEnd}
                      onChange={setEditShiftEnd}
                      label="Shift End Time"
                    />
                  </div>
                )}
              </div>

              {/* Active / Inactive Toggle */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Account Active Status</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-zinc-700">
                    {editIsActive ? 'Active Employee' : 'Deactivated'}
                  </span>
                </label>
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
                  {isEditing ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showPinModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-base font-extrabold text-zinc-950">Reset Verification PIN</h2>
              <button onClick={() => setShowPinModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Set a new 4-digit numeric punch confirmation PIN for{' '}
              <strong className="text-zinc-900">{selectedEmp.full_name}</strong>.
            </p>

            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">New 4-digit PIN</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 4-digit PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-mono font-black tracking-widest border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] cursor-pointer"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
