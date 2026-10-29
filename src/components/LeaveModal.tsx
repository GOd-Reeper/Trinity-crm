'use client';

import React, { useState } from 'react';
import { 
  CalendarOff, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  X,
  Send
} from 'lucide-react';
import { LeaveApplication, LeaveType, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

// ==========================================
// 1. Employee Leave Application Modal
// ==========================================
interface ApplyLeaveModalProps {
  employee: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyLeaveModal({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: ApplyLeaveModalProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fromDate || !toDate) {
      setErrorMsg('Please select both From and To dates.');
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      setErrorMsg('To Date cannot be earlier than From Date.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please describe the reason for your leave.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leave_applications').insert({
        employee_id: employee.id,
        from_date: fromDate,
        to_date: toDate,
        leave_type: leaveType,
        description: description.trim(),
        status: 'pending',
      });

      if (error) throw error;
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit leave application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-950">Apply for Leave</h2>
              <p className="text-[11px] text-zinc-500">Official Trinity Fitness leave request form</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">Leave Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['casual', 'sick', 'emergency', 'vacation', 'unpaid'] as LeaveType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setLeaveType(type)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border transition-all text-center ${
                    leaveType === type
                      ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range: From -> To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">From Date</label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">To Date</label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Detailed Reason */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Reason / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide a professional description (e.g., family function, personal emergency, medical appointment)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs border border-zinc-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Leave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. Admin Rejection Modal (Mandatory Reason)
// ==========================================
interface RejectLeaveModalProps {
  application: LeaveApplication;
  adminId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectLeaveModal({
  application,
  adminId,
  isOpen,
  onClose,
  onSuccess,
}: RejectLeaveModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Rejection reason is mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim(),
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) throw error;
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to reject leave application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-950">Reject Leave Request</h3>
            <p className="text-xs text-zinc-500">
              For: <span className="font-semibold text-zinc-800">{application.employee?.full_name || 'Employee'}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleReject} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1.5">
              Specify Rejection Reason <span className="text-red-500">* (Mandatory)</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain why this leave application is rejected (e.g. Critical client schedule conflict, shortage of coverage, etc.)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 text-xs border border-zinc-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

