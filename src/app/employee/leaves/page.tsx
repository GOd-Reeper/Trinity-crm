'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarOff, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LeaveApplication } from '@/lib/types';
import { ApplyLeaveModal } from '@/components/LeaveModal';
import { useAuth } from '@/lib/auth-context';
import { formatDateIST } from '@/lib/time-utils';

export default function EmployeeLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('leave_applications')
      .select('*, reviewer:profiles(*)')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setLeaves(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
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
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
              Time Off Management
            </span>
            <h1 className="text-xl font-black text-zinc-950 tracking-tight mt-0.5">
              Leave Requests
            </h1>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-teal-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave</span>
          </button>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Submit professional leave requests with dates and reasons. Admin approvals and rejection reasons appear below in realtime.
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-zinc-900 uppercase tracking-wider px-1">
          Your Applications ({leaves.length})
        </h2>

        {leaves.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs space-y-2">
            <CalendarOff className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs font-bold text-zinc-800">No leave requests submitted</p>
            <p className="text-[11px] text-zinc-400">
              Need time off? Tap &quot;Apply Leave&quot; above to submit an application.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                    {item.leave_type} Leave
                  </span>

                  <div>
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" /> Under Review
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> Approved
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full border border-red-200">
                        <XCircle className="w-3 h-3 text-red-600" /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>{formatDateIST(item.from_date)} → {formatDateIST(item.to_date)}</span>
                </div>

                <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 italic leading-relaxed">
                  &quot;{item.description}&quot;
                </p>

                {/* Show Admin Rejection Reason if Rejected */}
                {item.status === 'rejected' && item.rejection_reason && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-red-800">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Admin Rejection Reason:</span>
                    </div>
                    <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                      {item.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && user && (
        <ApplyLeaveModal
          employee={user}
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onSuccess={fetchLeaves}
        />
      )}
    </div>
  );
}

