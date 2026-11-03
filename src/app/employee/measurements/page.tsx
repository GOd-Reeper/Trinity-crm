'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Plus, 
  Calendar, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Client, ClientMeasurement } from '@/lib/types';
import MeasurementModal from '@/components/MeasurementModal';
import { useAuth } from '@/lib/auth-context';
import { formatDateIST } from '@/lib/time-utils';

export default function EmployeeMeasurementsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [recentMeasurements, setRecentMeasurements] = useState<ClientMeasurement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekday, setCurrentWeekday] = useState('Saturday');

  const fetchData = async () => {
    setIsLoading(true);
    const { data: clientsData } = await supabase.from('clients').select('*').eq('status', 'active');
    const { data: mData } = await supabase
      .from('client_measurements')
      .select('*, client:clients(*)')
      .order('measurement_date', { ascending: false })
      .limit(10);

    if (clientsData) setClients(clientsData);
    if (mData) setRecentMeasurements(mData);
    setIsLoading(false);
  };

  useEffect(() => {
    setCurrentWeekday(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    fetchData();
  }, []);

  // Filter clients due today (e.g. Saturday)
  const dueTodayClients = clients.filter(
    (c) => (c.preferred_measurement_day || 'Saturday').toLowerCase() === currentWeekday.toLowerCase()
  );

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Weekly Client Check-In
            </span>
            <h1 className="text-xl font-black text-zinc-950 tracking-tight mt-0.5">
              Body Measurements
            </h1>
          </div>
          <button
            onClick={() => {
              setSelectedClientId('');
              setShowModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-teal-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record</span>
          </button>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Log weekly progress (weight, body fat %, and tape circumferences) every Saturday or designated client check-in day.
        </p>
      </div>

      {/* Due Today (Saturday / Custom) Highlight Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Due on {currentWeekday}s ({dueTodayClients.length})</span>
          </h2>
          <span className="text-[10px] text-zinc-400 font-semibold">Priority check-in</span>
        </div>

        {dueTodayClients.length === 0 ? (
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900">
            No specific client check-ins scheduled for today ({currentWeekday}). Saturday is the standard check-in day.
          </div>
        ) : (
          <div className="space-y-2">
            {dueTodayClients.map((client) => (
              <div
                key={client.id}
                className="p-4 rounded-2xl bg-white border border-teal-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-zinc-950">{client.full_name}</h3>
                  <p className="text-[11px] text-zinc-500">
                    Schedule: Every {client.preferred_measurement_day || 'Saturday'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-teal-400"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Log Now</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Clients Quick Select */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider px-1">
          All Enrolled Clients ({clients.length})
        </h3>
        <div className="space-y-2">
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedClientId(c.id);
                setShowModal(true);
              }}
              className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-teal-400/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                  {c.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-950">{c.full_name}</h4>
                  <p className="text-[10px] text-zinc-400">Preferred Day: {c.preferred_measurement_day}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Measurements History */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider px-1">
          Recent Check-Ins Recorded
        </h3>
        {recentMeasurements.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">No measurements logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentMeasurements.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-950">{m.client?.full_name || 'Client'}</span>
                  <span className="text-[11px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    {m.weight_kg} kg
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>Date: {formatDateIST(m.measurement_date)}</span>
                  {m.waist_cm && <span>Waist: {m.waist_cm}cm</span>}
                  {m.chest_cm && <span>Chest: {m.chest_cm}cm</span>}
                </div>
                {m.trainer_notes && (
                  <p className="text-[10px] text-zinc-600 italic bg-zinc-50 p-2 rounded-lg">
                    &quot;{m.trainer_notes}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Measurement Modal */}
      {showModal && user && (
        <MeasurementModal
          clients={clients}
          currentEmployee={user}
          preselectedClientId={selectedClientId}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
