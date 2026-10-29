'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Lock, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  User, 
  Calendar,
  Bike,
  Car,
  Check,
  XCircle,
  Timer
} from 'lucide-react';
import { ClassSession } from '@/lib/types';
import ClassStarterModal from './ClassStarterModal';
import { supabase } from '@/lib/supabase';
import { getClassTimeState, ClassTimeState } from '@/lib/class-time';

interface ClassCardProps {
  session: ClassSession;
  onRefresh: () => void;
}

export default function ClassCard({ session, onRefresh }: ClassCardProps) {
  const [isStarterOpen, setIsStarterOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [timeState, setTimeState] = useState<ClassTimeState | null>(null);

  // Recalculate time state every 10 seconds
  useEffect(() => {
    const updateTime = async () => {
      const state = getClassTimeState(session);
      setTimeState(state);

      // Auto-update to missed if past end time and never started
      if (state.isExpiredMissed && session.status === 'scheduled') {
        await supabase
          .from('classes')
          .update({
            status: 'missed',
            is_half_day_penalty: true,
            penalty_reason: `Class not started within scheduled window (${session.start_time} - ${session.end_time}). Marked as missed.`,
          })
          .eq('id', session.id);
        onRefresh();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [session.id, session.class_date, session.start_time, session.end_time, session.status]);

  const handleCompleteSession = async () => {
    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          status: 'completed',
          actual_ended_at: new Date().toISOString(),
          session_notes: notes || 'Completed regular 1-hour fitness session.',
        })
        .eq('id', session.id);

      if (error) throw error;
      setIsCompleting(false);
      setShowCompleteModal(false);
      onRefresh();
    } catch (err) {
      alert('Failed to complete class');
      setIsCompleting(false);
    }
  };

  const isCompleted = session.status === 'completed';
  const isInProgress = session.status === 'in_progress';
  const isMissed = session.status === 'missed' || timeState?.isExpiredMissed;
  const isScheduled = session.status === 'scheduled' && !timeState?.isExpiredMissed;
  const canStart = timeState?.canStart ?? false;

  const formattedStartTime = session.start_time ? session.start_time.slice(0, 5) : '';
  const formattedEndTime = session.end_time ? session.end_time.slice(0, 5) : '';

  return (
    <>
      <div className={`p-4 rounded-3xl border transition-all ${
        isInProgress 
          ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400 shadow-md'
          : isCompleted
            ? 'bg-white border-zinc-200'
            : isMissed
              ? 'bg-red-50/40 border-red-200'
              : canStart
                ? 'bg-white border-teal-300 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 opacity-90'
      }`}>
        {/* Top Badges & Timings */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>{formattedStartTime} - {formattedEndTime}</span>
            <span className="text-[10px] text-zinc-400 font-normal">(1 Hr)</span>
          </div>

          <div>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <CheckCircle2 className="w-3 h-3 text-teal-600" /> Completed
              </span>
            )}

            {isInProgress && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-zinc-950 animate-pulse shadow-xs">
                In Progress
              </span>
            )}

            {isMissed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                <XCircle className="w-3 h-3 text-red-600" /> Missed
              </span>
            )}

            {isScheduled && !canStart && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 text-zinc-600">
                <Lock className="w-3 h-3" /> Locked ({timeState?.timeUntilStartFormatted || 'Upcoming'})
              </span>
            )}

            {isScheduled && canStart && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                timeState?.isLate 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-teal-100 text-teal-800 border-teal-200'
              }`}>
                {timeState?.isLate ? `Late (+${timeState.lateMinutes}m)` : 'Ready to Start'}
              </span>
            )}
          </div>
        </div>

        {/* Client & Address Information */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 font-bold flex items-center justify-center text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 leading-tight">
                {session.client?.full_name || 'Client Session'}
              </h3>
              <p className="text-[11px] text-zinc-500">{session.client?.phone || 'Daily Session'}</p>
            </div>
          </div>
          {session.client?.address && (
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 pl-10 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-zinc-400" />
              <span className="truncate">{session.client.address}</span>
            </p>
          )}
        </div>

        {/* Missed Class Notice */}
        {isMissed && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px]">Class Window Closed</p>
              <p className="text-[10px] text-red-700 leading-tight">
                This session was scheduled from {formattedStartTime} to {formattedEndTime}. Since it was not started, it is marked as Missed.
              </p>
            </div>
          </div>
        )}

        {/* Half Day Warning Pill if triggered */}
        {session.is_half_day_penalty && !isMissed && (
          <div className="mb-3 p-2 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-[11px] font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{session.penalty_reason || 'Flagged as Half-Day Penalty'}</span>
          </div>
        )}

        {/* Travel Mode details if recorded */}
        {session.travel_mode && (
          <div className="mb-3 flex items-center gap-2 text-[11px] text-zinc-600 bg-zinc-100/70 p-2 rounded-xl">
            {session.travel_mode === 'rapido' && <Bike className="w-3.5 h-3.5 text-amber-500" />}
            {session.travel_mode === 'uber' && <Car className="w-3.5 h-3.5 text-zinc-800" />}
            <span>Travel: <strong className="capitalize">{session.travel_mode}</strong></span>
            {session.travel_dropped_by_name && (
              <span>• Dropped by: <strong>{session.travel_dropped_by_name}</strong></span>
            )}
          </div>
        )}

        {/* Dynamic Action Buttons */}
        <div>
          {/* Scheduled State */}
          {isScheduled && (
            <button
              disabled={!canStart}
              onClick={() => setIsStarterOpen(true)}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                canStart
                  ? timeState?.isLate
                    ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 active:scale-[0.99] shadow-md shadow-amber-400/20 cursor-pointer'
                    : 'bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] shadow-md shadow-teal-500/20 cursor-pointer'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {canStart ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {timeState?.isLate 
                      ? `Start Class (Late: +${timeState.lateMinutes}m)` 
                      : 'Start Class (Verify Travel & Photo)'}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Upcoming (Opens at {formattedStartTime})</span>
                </>
              )}
            </button>
          )}

          {/* In-Progress State: Complete Class Button (Active during session window) */}
          {isInProgress && (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-teal-100/70 border border-teal-200 text-teal-950 flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                  Session in progress
                </span>
                <span className="font-bold text-[11px]">Ends at {formattedEndTime}</span>
              </div>

              <button
                onClick={() => setShowCompleteModal(true)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Check className="w-4 h-4 text-teal-400" />
                <span>Complete Class & Log Notes</span>
              </button>
            </div>
          )}

          {/* Missed State */}
          {isMissed && (
            <button
              disabled
              className="w-full py-2.5 px-3 rounded-2xl text-xs font-semibold bg-zinc-200 text-zinc-400 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Session Missed (Class Expired at {formattedEndTime})</span>
            </button>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">Session recorded</span>
              <span className="text-teal-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Verified
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Start Class Verification Modal */}
      {isStarterOpen && (
        <ClassStarterModal
          session={session}
          isOpen={isStarterOpen}
          onClose={() => setIsStarterOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Complete Class Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-zinc-950">Finish Fitness Session</h3>
              <p className="text-xs text-zinc-500">
                Log workout notes and client feedback for {session.client?.full_name}
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="e.g. Completed 1-hour back & biceps training. Client had high energy, maintained proper deadlift form."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 rounded-2xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                disabled={isCompleting}
                onClick={handleCompleteSession}
                className="flex-1 py-3 rounded-2xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50"
              >
                {isCompleting ? 'Finalizing...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
