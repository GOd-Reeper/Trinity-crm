'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarOff, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LeaveApplication } from '@/lib/types';
import { RejectLeaveModal } from '@/components/LeaveModal';
import { useAuth } from '@/lib/auth-context';

export default function AdminLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingApplication, setRejectingApplication] = useState<LeaveApplication | null>(null);

  const fetchLeaves = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('leave_applications')
      .select('*, employee:profiles(*), reviewer:profiles(*)')
      .order('created_at', { ascending: false });

    if (data) setLeaves(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (leaveId: string) => {
    try {
      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', leaveId);

      if (error) throw error;
      fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to approve leave application');
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const pastLeaves = leaves.filter((l) => l.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Staff Leave Applications</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Approve or reject employee leave requests with mandatory justification.
        </p>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
            Pending Approval ({pendingLeaves.length})
          </h2>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200/90 shadow-2xs">
            <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-800">All leave requests have been reviewed</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">No pending staff leave applications at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs space-y-3.5 hover:border-amber-400/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                      {leave.employee?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-950">{leave.employee?.full_name}</h3>
                      <p className="text-[11px] text-zinc-400">{leave.employee?.employee_code}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    {leave.leave_type}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1 text-xs">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Duration</p>
                  <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    {leave.from_date} → {leave.to_date}
                  </p>
                </div>

                <div className="text-xs text-zinc-700">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Reason</span>
                  <p className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 italic leading-relaxed">
                    &quot;{leave.description}&quot;
                  </p>
                </div>

                {/* Actions: Approve / Reject */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(leave.id)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm shadow-teal-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Leave</span>
                  </button>

                  <button
                    onClick={() => setRejectingApplication(leave)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject (Add Reason)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History / Past Leaves Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
          Decision History ({pastLeaves.length})
        </h2>

        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden divide-y divide-zinc-100">
          {pastLeaves.map((leave) => (
            <div key={leave.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-950">{leave.employee?.full_name}</h3>
                  <span className="text-xs text-zinc-400">({leave.leave_type})</span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-600 font-medium">
                    {leave.from_date} to {leave.to_date}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 line-clamp-1 italic">&quot;{leave.description}&quot;</p>
                {leave.status === 'rejected' && leave.rejection_reason && (
                  <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 font-medium">
                    Rejection Reason: {leave.rejection_reason}
                  </p>
                )}
              </div>

              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  leave.status === 'approved'
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {leave.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal with Mandatory Reason */}
      {rejectingApplication && (
        <RejectLeaveModal
          application={rejectingApplication}
          adminId={user?.id || ''}
          isOpen={!!rejectingApplication}
          onClose={() => setRejectingApplication(null)}
          onSuccess={fetchLeaves}
        />
      )}
    </div>
  );
}

