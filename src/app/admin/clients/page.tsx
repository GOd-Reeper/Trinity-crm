'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Ruler, 
  Calendar, 
  Phone, 
  MapPin, 
  Edit3, 
  CheckCircle2, 
  X, 
  ChevronRight,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Client, ClientMeasurement, Profile } from '@/lib/types';
import MeasurementModal from '@/components/MeasurementModal';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMeasurements, setClientMeasurements] = useState<ClientMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);

  // Form states for new client
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [measurementDay, setMeasurementDay] = useState('Saturday');
  const [packageType, setPackageType] = useState('1-Hour Daily Monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [defaultTrainerId, setDefaultTrainerId] = useState('');
  const [fitnessGoals, setFitnessGoals] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    setEndDate(nextMonth.toISOString().split('T')[0]);
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*, default_trainer:profiles(*)')
      .order('full_name');

    const { data: trainersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .eq('is_active', true);

    if (clientsData) setClients(clientsData);
    if (trainersData) {
      setTrainers(trainersData);
      if (!defaultTrainerId && trainersData.length > 0) {
        setDefaultTrainerId(trainersData[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    const { data: mData } = await supabase
      .from('client_measurements')
      .select('*, taken_by:profiles(*)')
      .eq('client_id', client.id)
      .order('measurement_date', { ascending: false });

    setClientMeasurements(mData || []);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('clients').insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        emergency_contact: emergencyContact.trim() || null,
        address: address.trim() || null,
        preferred_measurement_day: measurementDay,
        package_type: packageType,
        package_start_date: startDate,
        package_end_date: endDate,
        default_trainer_id: defaultTrainerId || null,
        fitness_goals: fitnessGoals.trim() || null,
        status: 'active',
      });

      if (error) throw error;
      setShowAddModal(false);
      resetForm();
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setEmergencyContact('');
    setAddress('');
    setMeasurementDay('Saturday');
    setFitnessGoals('');
  };

  const filteredClients = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Client Profiles & Tracking</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage 1-hour session clients, membership packages, and weekly body measurements.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by client name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Split view: Client list + Selected client detail & measurements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredClients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10'
                    : 'border-zinc-200/90 hover:border-zinc-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-950">{client.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      Day: {client.preferred_measurement_day}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-400" /> {client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-teal-600" /> Trainer: {client.default_trainer?.full_name || 'Unassigned'}
                    </span>
                  </div>
                  {client.fitness_goals && (
                    <p className="text-[11px] text-zinc-500 italic mt-0.5 line-clamp-1">
                      Goal: {client.fitness_goals}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(client);
                      setShowMeasurementModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>Log Metrics</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Client Measurements Inspector */}
        <div className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
          {selectedClient ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <h2 className="text-base font-extrabold text-zinc-950">{selectedClient.full_name}</h2>
                  <p className="text-xs text-zinc-500">
                    Measurement Schedule: <strong className="text-teal-700">{selectedClient.preferred_measurement_day}s</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowMeasurementModal(true)}
                  className="p-2 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold"
                  title="Add measurement"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Package Details */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Package Timeline</p>
                <p className="font-semibold text-zinc-900">{selectedClient.package_type}</p>
                <p className="text-zinc-500 text-[11px]">
                  {selectedClient.package_start_date} → {selectedClient.package_end_date}
                </p>
              </div>

              {/* Measurements Timeline */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 mb-2 uppercase tracking-wider">
                  Measurement History ({clientMeasurements.length})
                </h3>

                {clientMeasurements.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">No measurements recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {clientMeasurements.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            {m.measurement_date}
                          </span>
                          <span className="font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full text-[11px]">
                            {m.weight_kg} kg
                          </span>
                        </div>

                        {/* Circumferences grid */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-zinc-600">
                          {m.waist_cm && <div>Waist: <strong>{m.waist_cm}cm</strong></div>}
                          {m.chest_cm && <div>Chest: <strong>{m.chest_cm}cm</strong></div>}
                          {m.arms_cm && <div>Arms: <strong>{m.arms_cm}cm</strong></div>}
                          {m.thighs_cm && <div>Thighs: <strong>{m.thighs_cm}cm</strong></div>}
                          {m.body_fat_percentage && <div>BodyFat: <strong>{m.body_fat_percentage}%</strong></div>}
                        </div>

                        {m.trainer_notes && (
                          <p className="text-[11px] text-zinc-600 italic bg-white p-2 rounded-lg border border-zinc-200/50">
                            &quot;{m.trainer_notes}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Select a client on the left</p>
              <p className="text-[11px]">View weekly body stats, photos, and progress.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h2 className="text-base font-extrabold text-zinc-950">Add New Trinity Client</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Khanna"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Measurement Day *</label>
                  <select
                    value={measurementDay}
                    onChange={(e) => setMeasurementDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Saturday">Saturday (Standard)</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Default Trainer</label>
                  <select
                    value={defaultTrainerId}
                    onChange={(e) => setDefaultTrainerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name} ({t.employee_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 42, H-102"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Fitness Goals</label>
                <input
                  type="text"
                  placeholder="e.g. Weight loss, posture, core training"
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Measurement Modal */}
      {showMeasurementModal && selectedClient && (
        <MeasurementModal
          clients={clients}
          currentEmployee={trainers[0]}
          preselectedClientId={selectedClient.id}
          isOpen={showMeasurementModal}
          onClose={() => setShowMeasurementModal(false)}
          onSuccess={() => handleSelectClient(selectedClient)}
        />
      )}
    </div>
  );
}
