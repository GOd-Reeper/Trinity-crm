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
import { supabase } from '@/lib/supabase';
import { getClassTimeState } from '@/lib/class-time';

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

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfiePhoto(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptPhoto(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

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

      // Upload selfie to Supabase Storage
      if (selfiePhoto) {
        const fileExt = selfiePhoto.name.split('.').pop();
        const filePath = `selfies/${session.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('class-proofs')
          .upload(filePath, selfiePhoto, { upsert: true });

        if (!uploadError) {
          const { data: pubData } = supabase.storage.from('class-proofs').getPublicUrl(filePath);
          selfieUrl = pubData.publicUrl;
        } else {
          // Fallback to data URL or dummy if storage bucket fails
          selfieUrl = selfiePreview || 'proof_uploaded';
        }
      }

      // Upload receipt if rapido or uber
      if (receiptPhoto) {
        const fileExt = receiptPhoto.name.split('.').pop();
        const filePath = `receipts/${session.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('travel-receipts')
          .upload(filePath, receiptPhoto, { upsert: true });

        if (!uploadError) {
          const { data: pubData } = supabase.storage.from('travel-receipts').getPublicUrl(filePath);
          receiptUrl = pubData.publicUrl;
        } else {
          receiptUrl = receiptPreview || 'receipt_uploaded';
        }
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
                  Scheduled for {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}. This class was not started during its scheduled 1-hour window and cannot be started anymore.
                </p>
              </div>
            </div>
          ) : isLatePenalty ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Late Start Detected (+{diffMinutes}m late)</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Scheduled for {session.start_time?.slice(0, 5)}. Exceeding the 10-minute threshold triggers an automatic <strong>Half-Day Penalty</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-xs font-medium">
                Scheduled: <span className="font-bold">{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}</span> • On-time session ({diffMinutes}m elapsed)
              </p>
            </div>
          )}

          {/* 1. Selfie / Proof Photo */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1.5">
              1. Take Start Selfie / Proof Photo <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-teal-300 rounded-xl bg-teal-50/50 hover:bg-teal-50 transition-colors text-center">
                <Camera className="w-6 h-6 text-teal-600 mb-1" />
                <span className="text-xs font-semibold text-teal-900">
                  {selfiePhoto ? 'Replace Photo' : 'Capture / Upload Photo'}
                </span>
                <span className="text-[10px] text-zinc-500">Camera or Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieChange}
                  className="hidden"
                />
              </label>
              {selfiePreview && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-300 shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-teal-600 text-white p-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          </div>

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
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
              <label className="block text-xs font-bold text-zinc-900">
                Upload {travelMode === 'rapido' ? 'Rapido' : 'Uber'} Fare Screenshot <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 transition-colors">
                  <Upload className="w-4 h-4 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">
                    {receiptPhoto ? 'Change Screenshot' : 'Select Ride Screenshot'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />
                </label>
                {receiptPreview && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-300 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
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

