'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  Upload,
  X,
  CheckCircle2,
  Send
} from 'lucide-react';
import { IssuePriority, Profile } from '@/lib/types';
import { supabase, uploadImage } from '@/lib/supabase';
import PhotoCaptureInput from './PhotoCaptureInput';

interface ReportIssueModalProps {
  employee: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportIssueModal({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: ReportIssueModalProps) {
  const [category, setCategory] = useState('Equipment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = '';
      if (photo) {
        const res = await uploadImage('issue-attachments', photo, 'issues');
        photoUrl = res.publicUrl || photoPreview || 'attachment_uploaded';
      }

      const { error } = await supabase.from('issues_escalations').insert({
        raised_by_employee_id: employee.id,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        photo_url: photoUrl || null,
        status: 'open',
      });

      if (error) throw error;
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to submit issue report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-950">Report an Issue</h2>
              <p className="text-[11px] text-zinc-500">Escalate equipment, client, or site problems to Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            >
              <option value="Equipment">Equipment / Gear Damaged</option>
              <option value="Client Dispute">Client Dispute or Behavior</option>
              <option value="Facility / Location">Facility / Location Issue</option>
              <option value="Travel Expense">Travel / Fare Reimbursement Issue</option>
              <option value="Other">Other Operational Concern</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">Urgency</label>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(['low', 'medium', 'high', 'urgent'] as IssuePriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold capitalize border transition-all ${priority === p
                      ? p === 'urgent' || p === 'high'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-teal-500 text-zinc-950 border-teal-500'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Broken dumbbell handle at Sector 42"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Photo attachment with Click Photo & Upload */}
          <PhotoCaptureInput
            label="Attach Photo Evidence"
            value={photo}
            previewUrl={photoPreview}
            onChange={(file, url) => {
              setPhoto(file);
              setPhotoPreview(url);
            }}
            captureMode="environment"
            cameraButtonLabel="Click Photo (Camera)"
            uploadButtonLabel="Upload from Gallery"
            helperText="Snap a direct photo of the damage/site or pick an image"
          />

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
              <span>{isSubmitting ? 'Submitting...' : 'Submit Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

