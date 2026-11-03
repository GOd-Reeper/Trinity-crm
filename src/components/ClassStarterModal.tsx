'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Car, 
  Bike, 
  Users, 
  AlertTriangle, 
  X, 
  Clock, 
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { ClassSession, TravelMode } from '@/lib/types';
import { supabase, uploadImage } from '@/lib/supabase';
import { getClassTimeState } from '@/lib/class-time';
import { formatTime12Hour, formatTimeRange12Hour } from '@/lib/time-utils';
import PhotoCaptureInput from './PhotoCaptureInput';

interface ClassStarterModalProps {
  session: ClassSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClassStarterModal({
  session,
  isOpen,
  onClose,
  onSuccess,
}: ClassStarterModalProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>('rapido');
  const [droppedByName, setDroppedByName] = useState<string>('Akash');
  const [customDroppedName, setCustomDroppedName] = useState<string>('');
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Accurate local time check
  const timeState = getClassTimeState(session);
  const isLatePenalty = timeState.isLate;
  const diffMinutes = timeState.lateMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selfiePhoto && !selfiePreview) {
      setErrorMsg('Please capture or upload a class start selfie / photo proof.');
      return;
    }

    if ((travelMode === 'rapido' || travelMode === 'uber') && !receiptPhoto && !receiptPreview) {
      setErrorMsg(`Please upload your ${travelMode === 'rapido' ? 'Rapido' : 'Uber'} ride screenshot.`);
      return;
    }

    setIsSubmitting(true);

    try {
      let selfieUrl = '';
      let receiptUrl = '';

      // Upload selfie to 'class-proofs' bucket
      if (selfiePhoto) {
        const res = await uploadImage('class-proofs', selfiePhoto, `selfies/${session.id}`);
        selfieUrl = res.publicUrl || selfiePreview || 'proof_uploaded';
      }

      // Upload receipt to 'travel-receipts' bucket if rapido or uber
      if (receiptPhoto) {
        const res = await uploadImage('travel-receipts', receiptPhoto, `receipts/${session.id}`);
        receiptUrl = res.publicUrl || receiptPreview || 'receipt_uploaded';
      }

      const effectiveDroppedName = travelMode === 'dropped'
        ? (droppedByName === 'Other' ? customDroppedName : droppedByName)
        : null;

      const nowIso = new Date().toISOString();

      // Update class session record
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          status: 'in_progress',
          actual_started_at: nowIso,
          start_photo_url: selfieUrl || 'verified',
          travel_mode: travelMode,
          travel_dropped_by_name: effectiveDroppedName,
          travel_receipt_url: receiptUrl || null,
        })
        .eq('id', session.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to start class. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Start Fitness Session</h2>
              <p className="text-[11px] text-zinc-400">
                Client: <span className="text-teal-400 font-semibold">{session.client?.full_name || 'Client'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Time State Banner */}
          {timeState.isExpiredMissed ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Session Expired / Window Closed</p>
                <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                  Scheduled for {formatTimeRange12Hour(session.start_time, session.end_time)} (IST). This class was not started during its scheduled 1-hour window and cannot be started anymore.
                </p>
              </div>
            </div>
          ) : isLatePenalty ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Late Start Detected (+{diffMinutes}m late)</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Scheduled for {formatTime12Hour(session.start_time)} (IST). Exceeding the 10-minute threshold triggers an automatic <strong>Half-Day Penalty</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-xs font-medium">
                Scheduled: <span className="font-bold">{formatTimeRange12Hour(session.start_time, session.end_time)} (IST)</span> • On-time session ({diffMinutes}m elapsed)
              </p>
            </div>
          )}

          {/* 1. Selfie / Proof Photo with Direct Camera & Upload */}
          <PhotoCaptureInput
            label="1. Take Start Selfie / Proof Photo"
            required
            value={selfiePhoto}
            previewUrl={selfiePreview}
            onChange={(file, url) => {
              setSelfiePhoto(file);
              setSelfiePreview(url);
            }}
            captureMode="user"
            cameraButtonLabel="Click Selfie (Camera)"
            uploadButtonLabel="Upload Photo"
            helperText="Open camera to snap live selfie or select from gallery"
          />

          {/* 2. Travel Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1.5">
              2. How did you reach the client location? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTravelMode('rapido')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                  travelMode === 'rapido'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Bike className="w-4 h-4 text-amber-500" />
                <span>Rapido (Bike Taxi)</span>
              </button>

              <button
                type="button"
                onClick={() => setTravelMode('uber')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                  travelMode === 'uber'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Car className="w-4 h-4 text-zinc-900" />
                <span>Uber / Ola</span>
              </button>

              <button
                type="button"
                onClick={() => setTravelMode('dropped')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                  travelMode === 'dropped'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Dropped by Someone</span>
              </button>

              <button
                type="button"
                onClick={() => setTravelMode('self')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                  travelMode === 'self'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Bike className="w-4 h-4 text-teal-600" />
                <span>Self / Own Bike</span>
              </button>
            </div>
          </div>

          {/* Conditional Travel Proof: Rapido or Uber requires Screenshot */}
          {(travelMode === 'rapido' || travelMode === 'uber') && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
              <PhotoCaptureInput
                label={`Upload ${travelMode === 'rapido' ? 'Rapido' : 'Uber'} Fare Screenshot`}
                required
                value={receiptPhoto}
                previewUrl={receiptPreview}
                onChange={(file, url) => {
                  setReceiptPhoto(file);
                  setReceiptPreview(url);
                }}
                captureMode="environment"
                cameraButtonLabel="Click Photo"
                uploadButtonLabel="Select Screenshot"
                helperText="Upload ride receipt screenshot or snap a photo"
                compact
              />
            </div>
          )}

          {/* Conditional Travel Mode: Dropped by someone */}
          {travelMode === 'dropped' && (
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
              <label className="block text-xs font-bold text-zinc-900">
                Who dropped you? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {['Akash', 'Nitin', 'Other'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setDroppedByName(name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      droppedByName === name
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {droppedByName === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter person's name (e.g. Ramesh / Friend)"
                  value={customDroppedName}
                  onChange={(e) => setCustomDroppedName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  required
                />
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMsg}
            </p>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || timeState.isExpiredMissed}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Starting Session...</span>
              ) : timeState.isExpiredMissed ? (
                <span>Session Expired (Window Closed)</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-zinc-950" />
                  <span>Confirm & Start 1-Hour Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

