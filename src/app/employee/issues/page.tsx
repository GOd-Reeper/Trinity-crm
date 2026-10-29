'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Camera, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  Image,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { IssueEscalation } from '@/lib/types';
import ReportIssueModal from '@/components/IssueModal';
import { useAuth } from '@/lib/auth-context';

export default function EmployeeIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueEscalation[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIssues = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('issues_escalations')
      .select('*')
      .eq('raised_by_employee_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setIssues(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIssues();
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
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">
              Staff Helpdesk
            </span>
            <h1 className="text-xl font-black text-zinc-950 tracking-tight mt-0.5">
              Report an Issue
            </h1>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-teal-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Issue</span>
          </button>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Report broken gym equipment, facility disputes, or client travel reimbursement concerns with photo proof.
        </p>
      </div>

      {/* Reported Issues List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-zinc-900 uppercase tracking-wider px-1">
          Your Reported Incidents ({issues.length})
        </h2>

        {issues.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-800">No issues reported</p>
            <p className="text-[11px] text-zinc-400">
              Everything operating smoothly! Tap &quot;New Issue&quot; if anything arises.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white border border-zinc-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-zinc-100 text-zinc-700 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    item.status === 'resolved'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-zinc-950 leading-snug">{item.title}</h3>

                <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 leading-relaxed">
                  {item.description}
                </p>

                {item.photo_url && (
                  <button
                    onClick={() => setSelectedPhoto(item.photo_url!)}
                    className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/60 text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>View Attached Photo Evidence</span>
                  </button>
                )}

                {item.admin_notes && (
                  <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 space-y-0.5">
                    <p className="text-[10px] font-bold text-teal-800 uppercase flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Admin Response
                    </p>
                    <p className="text-[11px] font-medium leading-relaxed">{item.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && user && (
        <ReportIssueModal
          employee={user}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSuccess={fetchIssues}
        />
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-zinc-950 rounded-3xl p-4 border border-zinc-800 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Issue Photo Evidence</span>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-zinc-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPhoto} alt="Issue attachment" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

