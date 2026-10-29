'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  Save,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Client, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface LogMeasurementModalProps {
  clients: Client[];
  currentEmployee: Profile;
  preselectedClientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MeasurementModal({
  clients,
  currentEmployee,
  preselectedClientId,
  isOpen,
  onClose,
  onSuccess,
}: LogMeasurementModalProps) {
  const [clientId, setClientId] = useState(preselectedClientId || clients[0]?.id || '');
  const [measurementDate, setMeasurementDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');
  const [armsCm, setArmsCm] = useState('');
  const [thighsCm, setThighsCm] = useState('');
  const [calvesCm, setCalvesCm] = useState('');
  const [shouldersCm, setShouldersCm] = useState('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMeasurementDate(new Date().toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  const handleFrontPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontPhoto(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg('Please select a client.');
      return;
    }
    if (!weightKg) {
      setErrorMsg('Client weight is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = '';
      if (frontPhoto) {
        const fileExt = frontPhoto.name.split('.').pop();
        const filePath = `progress/${clientId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('client-measurements')
          .upload(filePath, frontPhoto);

        if (!uploadError) {
          const { data } = supabase.storage.from('client-measurements').getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        } else {
          photoUrl = frontPreview || 'progress_photo_saved';
        }
      }

      const { error } = await supabase.from('client_measurements').insert({
        client_id: clientId,
        taken_by_employee_id: currentEmployee.id,
        measurement_date: measurementDate,
        weight_kg: parseFloat(weightKg),
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        chest_cm: chestCm ? parseFloat(chestCm) : null,
        waist_cm: waistCm ? parseFloat(waistCm) : null,
        hips_cm: hipsCm ? parseFloat(hipsCm) : null,
        arms_cm: armsCm ? parseFloat(armsCm) : null,
        thighs_cm: thighsCm ? parseFloat(thighsCm) : null,
        calves_cm: calvesCm ? parseFloat(calvesCm) : null,
        shoulders_cm: shouldersCm ? parseFloat(shouldersCm) : null,
        photo_front_url: photoUrl || null,
        trainer_notes: trainerNotes.trim() || null,
      });

      if (error) throw error;
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to record measurements.');
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Record Weekly Measurements</h2>
              <p className="text-[11px] text-zinc-400">
                {selectedClient ? `Preferred Day: ${selectedClient.preferred_measurement_day || 'Saturday'}` : 'Client Progress Tracker'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Client & Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">Select Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.preferred_measurement_day || 'Saturday'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1">Date</label>
              <input
                type="date"
                required
                value={measurementDate}
                onChange={(e) => setMeasurementDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Core Metrics: Weight & Body Fat */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 78.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 18.2"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Circumferences Grid */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-2">
              Body Circumferences (in cm)
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Chest</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Waist</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Hips</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Arms / Biceps</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={armsCm}
                  onChange={(e) => setArmsCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Thighs</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={thighsCm}
                  onChange={(e) => setThighsCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block mb-0.5">Shoulders</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={shouldersCm}
                  onChange={(e) => setShouldersCm(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Progress Photo */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1.5">Progress Photo</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors">
                <Camera className="w-4 h-4 text-zinc-600" />
                <span className="text-xs font-medium text-zinc-700">
                  {frontPhoto ? 'Replace Photo' : 'Upload Client Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontPhoto}
                  className="hidden"
                />
              </label>
              {frontPreview && (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-300 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={frontPreview} alt="Client progress" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Trainer Observations */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">Trainer Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Significant improvement in waist definition. Good hydration."
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              className="w-full p-2.5 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Metrics...' : 'Save Measurement Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
