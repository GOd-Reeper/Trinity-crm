'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Image, 
  X, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { IssueEscalation } from '@/lib/types';

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<IssueEscalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<IssueEscalation | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIssues = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('issues_escalations')
      .select('*, employee:profiles(*), client:clients(*)')
      .order('created_at', { ascending: false });

    if (data) setIssues(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('issues_escalations')
        .update({
          status: 'resolved',
          admin_notes: adminNotes.trim() || 'Resolved by Administrator.',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', resolvingIssue.id);

      if (error) throw error;
      setResolvingIssue(null);
      setAdminNotes('');
      fetchIssues();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Issue & Escalation Helpdesk</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Review employee reported equipment damage, facility hurdles, and client concerns with photo evidence.
        </p>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-amber-400/50 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  issue.priority === 'urgent' || issue.priority === 'high'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {issue.priority} priority
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                  issue.status === 'resolved'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {issue.status}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-zinc-950 leading-snug">{issue.title}</h3>
              <p className="text-xs text-zinc-500 font-medium">Category: {issue.category}</p>

              <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 leading-relaxed">
                {issue.description}
              </p>

              {/* Photo preview pill */}
              {issue.photo_url && (
                <button
                  onClick={() => setSelectedPhoto(issue.photo_url!)}
                  className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/60 text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>View Attached Photo Evidence</span>
                </button>
              )}

              {issue.admin_notes && (
                <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-[11px] text-teal-900">
                  <strong>Admin Action:</strong> {issue.admin_notes}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                By {issue.employee?.full_name || 'Staff'}
              </span>

              {issue.status !== 'resolved' && (
                <button
                  onClick={() => {
                    setResolvingIssue(issue);
                    setAdminNotes('');
                  }}
                  className="px-3 py-1 rounded-xl bg-zinc-900 text-white hover:bg-teal-600 text-xs font-bold transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
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

      {/* Resolve Issue Modal */}
      {resolvingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-extrabold text-zinc-950">Resolve Incident</h3>
            <p className="text-xs text-zinc-500">Add resolution remarks for: &quot;{resolvingIssue.title}&quot;</p>

            <form onSubmit={handleResolveIssue} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="e.g. Equipment replaced. Notified trainer and client."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResolvingIssue(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

