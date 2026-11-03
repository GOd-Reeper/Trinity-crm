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
  UserCheck,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Filter,
  Check,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Client, ClientMeasurement, Profile } from '@/lib/types';
import MeasurementModal from '@/components/MeasurementModal';
import { formatDateIST, getTodayIST } from '@/lib/time-utils';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMeasurements, setClientMeasurements] = useState<ClientMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  
  // Mobile tab state: 'list' or 'details'
  const [mobileTab, setMobileTab] = useState<'list' | 'details'>('list');

  // Add Client Modal State
  const [showAddModal, setShowAddModal] = useState(false);
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

  // Edit Client Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMeasurementDay, setEditMeasurementDay] = useState('Saturday');
  const [editPackageType, setEditPackageType] = useState('1-Hour Daily Monthly');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTrainerId, setEditTrainerId] = useState('');
  const [editFitnessGoals, setEditFitnessGoals] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'paused' | 'expired'>('active');
  const [isEditing, setIsEditing] = useState(false);

  // Delete Confirm Dialog State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Measurement Modal State
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);

  useEffect(() => {
    const todayStr = getTodayIST();
    setStartDate(todayStr);
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    setEndDate(nextMonth.toISOString().split('T')[0]);
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*, default_trainer:profiles(*)')
      .order('full_name');

    const { data: trainersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .eq('is_active', true);

    if (!error && clientsData) {
      setClients(clientsData);
      // If we already had a selected client, update their data
      if (selectedClient) {
        const updated = clientsData.find((c) => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    }

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
    setMobileTab('details');

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
      const { data, error } = await supabase
        .from('clients')
        .insert({
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
        })
        .select('*, default_trainer:profiles(*)')
        .single();

      if (error) throw error;
      setShowAddModal(false);
      resetAddForm();
      await fetchClients();
      if (data) handleSelectClient(data);
    } catch (err: any) {
      alert(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setEditFullName(client.full_name);
    setEditPhone(client.phone);
    setEditEmail(client.email || '');
    setEditEmergencyContact(client.emergency_contact || '');
    setEditAddress(client.address || '');
    setEditMeasurementDay(client.preferred_measurement_day || 'Saturday');
    setEditPackageType(client.package_type || '1-Hour Daily Monthly');
    setEditStartDate(client.package_start_date || '');
    setEditEndDate(client.package_end_date || '');
    setEditTrainerId(client.default_trainer_id || '');
    setEditFitnessGoals(client.fitness_goals || '');
    setEditStatus(client.status || 'active');
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          emergency_contact: editEmergencyContact.trim() || null,
          address: editAddress.trim() || null,
          preferred_measurement_day: editMeasurementDay,
          package_type: editPackageType,
          package_start_date: editStartDate,
          package_end_date: editEndDate,
          default_trainer_id: editTrainerId || null,
          fitness_goals: editFitnessGoals.trim() || null,
          status: editStatus,
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      setShowEditModal(false);
      await fetchClients();

      // Refresh selected client view
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient({
          ...selectedClient,
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          emergency_contact: editEmergencyContact.trim() || undefined,
          address: editAddress.trim() || undefined,
          preferred_measurement_day: editMeasurementDay,
          package_type: editPackageType,
          package_start_date: editStartDate,
          package_end_date: editEndDate,
          default_trainer_id: editTrainerId || undefined,
          fitness_goals: editFitnessGoals.trim() || undefined,
          status: editStatus,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update client');
    } finally {
      setIsEditing(false);
    }
  };

  const handleQuickStatusChange = async (client: Client, newStatus: 'active' | 'paused' | 'expired') => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;
      fetchClients();
      if (selectedClient?.id === client.id) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const confirmDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) {
        // If foreign key constraint prevents deletion (e.g. existing classes or measurements)
        if (error.code === '23503') {
          const archive = confirm('This client has recorded classes or measurements and cannot be hard deleted. Would you like to mark their account as EXPIRED instead?');
          if (archive) {
            await handleQuickStatusChange(clientToDelete, 'expired');
            setShowDeleteModal(false);
            setClientToDelete(null);
            return;
          }
        }
        throw error;
      }

      setShowDeleteModal(false);
      if (selectedClient?.id === clientToDelete.id) {
        setSelectedClient(null);
        setMobileTab('list');
      }
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAddForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setEmergencyContact('');
    setAddress('');
    setMeasurementDay('Saturday');
    setFitnessGoals('');
  };

  // Filter clients by search & status
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = clients.filter((c) => c.status === 'active').length;
  const pausedCount = clients.filter((c) => c.status === 'paused').length;
  const expiredCount = clients.filter((c) => c.status === 'expired').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Client Profiles & Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create, edit, and manage 1-hour session clients, membership packages, and weekly body stats.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar & Status Filter */}
      <div className="p-3 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by client name, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All ({clients.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'active'
                  ? 'bg-teal-500 text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'paused'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Paused ({pausedCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === 'expired'
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Expired ({expiredCount})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Switch Tabs */}
      <div className="lg:hidden flex rounded-2xl bg-zinc-200/80 p-1">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
            mobileTab === 'list' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
          }`}
        >
          Clients List ({filteredClients.length})
        </button>
        <button
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
            mobileTab === 'details' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600'
          }`}
        >
          {selectedClient ? selectedClient.full_name : 'Client Details'}
        </button>
      </div>

      {/* Responsive Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Cards List */}
        <div className={`space-y-3 ${mobileTab === 'details' ? 'hidden lg:block lg:col-span-1' : 'block lg:col-span-1'}`}>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200">
              Loading clients...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200">
              <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-700">No clients found</p>
              <p className="text-[11px] text-zinc-400 mt-1">Try adjusting your search or add a new client.</p>
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer space-y-3 shadow-xs ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10'
                      : 'border-zinc-200/90 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-zinc-950">{client.full_name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            client.status === 'active'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : client.status === 'paused'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{client.phone}</span>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 shrink-0">
                      {client.preferred_measurement_day}s
                    </span>
                  </div>

                  {client.address && (
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </p>
                  )}

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      Trainer: <strong className="text-zinc-800">{client.default_trainer?.full_name || 'Unassigned'}</strong>
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                        title="Edit Client"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowMeasurementModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 text-[11px] font-bold flex items-center gap-1 border border-teal-200"
                        title="Log Measurement"
                      >
                        <Ruler className="w-3 h-3" />
                        <span>Metrics</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Client Detailed Profile & Measurements */}
        <div className={`space-y-4 ${mobileTab === 'list' ? 'hidden lg:block lg:col-span-2' : 'block lg:col-span-2'}`}>
          {selectedClient ? (
            <div className="space-y-4">
              {/* Client Profile Header Card */}
              <div className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
                {/* Mobile back to list button */}
                <div className="lg:hidden pb-2 border-b border-zinc-100 flex items-center justify-between">
                  <button
                    onClick={() => setMobileTab('list')}
                    className="text-xs font-bold text-teal-600 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Clients List</span>
                  </button>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Profile View</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-black text-zinc-950">{selectedClient.full_name}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          selectedClient.status === 'active'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : selectedClient.status === 'paused'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {selectedClient.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        {selectedClient.phone}
                      </span>
                      {selectedClient.email && (
                        <span className="text-zinc-500">• {selectedClient.email}</span>
                      )}
                      {selectedClient.emergency_contact && (
                        <span className="text-zinc-500">
                          • Emergency: <strong>{selectedClient.emergency_contact}</strong>
                        </span>
                      )}
                    </div>

                    {selectedClient.address && (
                      <p className="text-xs text-zinc-600 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{selectedClient.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => openEditModal(selectedClient)}
                      className="px-3 py-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.99] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => confirmDeleteClient(selectedClient)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                      title="Delete or Archive Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Switcher Quick Bar */}
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-zinc-500">Quick Status Switch:</span>
                  <div className="flex items-center gap-1.5">
                    {(['active', 'paused', 'expired'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(selectedClient, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          selectedClient.status === st
                            ? 'bg-zinc-950 text-white shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Package & Goal Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                    <span className="text-[10px] font-bold uppercase text-teal-800 block">Package Type</span>
                    <strong className="text-zinc-950 text-sm mt-0.5 block">{selectedClient.package_type}</strong>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      {formatDateIST(selectedClient.package_start_date)} → {formatDateIST(selectedClient.package_end_date)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Assigned Trainer</span>
                    <strong className="text-zinc-950 text-sm mt-0.5 block">
                      {selectedClient.default_trainer?.full_name || 'Unassigned'}
                    </strong>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Code: {selectedClient.default_trainer?.employee_code || '--'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Measurement Schedule</span>
                    <strong className="text-teal-700 text-sm mt-0.5 block">
                      Every {selectedClient.preferred_measurement_day}
                    </strong>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      {clientMeasurements.length} records logged
                    </span>
                  </div>
                </div>

                {selectedClient.fitness_goals && (
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Fitness Goals</span>
                    <p className="text-zinc-700 italic">{selectedClient.fitness_goals}</p>
                  </div>
                )}
              </div>

              {/* Measurements History Section */}
              <div className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-teal-600" />
                      <span>Weekly Body Measurements & Progress</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Weekly metrics logged by trainer every {selectedClient.preferred_measurement_day}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-teal-500 text-zinc-950 hover:bg-teal-400 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-[0.99] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Metrics</span>
                  </button>
                </div>

                {clientMeasurements.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <Ruler className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-zinc-700">No measurements recorded yet</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Click &quot;Log Metrics&quot; to record weight, body fat %, and tape circumferences.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientMeasurements.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span className="font-extrabold text-sm text-zinc-950">
                              {formatDateIST(m.measurement_date)}
                            </span>
                            {m.taken_by_employee && (
                              <span className="text-xs text-zinc-500">
                                • By {m.taken_by_employee.full_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-black text-teal-900 bg-teal-100 px-3 py-1 rounded-full text-xs border border-teal-200">
                              {m.weight_kg} kg
                            </span>
                            {m.body_fat_percentage && (
                              <span className="font-bold text-zinc-700 bg-white px-2.5 py-1 rounded-full text-xs border border-zinc-200">
                                {m.body_fat_percentage}% Fat
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Circumferences Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          {m.chest_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Chest</span>
                              <strong className="text-zinc-900">{m.chest_cm} cm</strong>
                            </div>
                          )}
                          {m.waist_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Waist</span>
                              <strong className="text-zinc-900">{m.waist_cm} cm</strong>
                            </div>
                          )}
                          {m.hips_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Hips</span>
                              <strong className="text-zinc-900">{m.hips_cm} cm</strong>
                            </div>
                          )}
                          {m.arms_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Arms</span>
                              <strong className="text-zinc-900">{m.arms_cm} cm</strong>
                            </div>
                          )}
                          {m.thighs_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Thighs</span>
                              <strong className="text-zinc-900">{m.thighs_cm} cm</strong>
                            </div>
                          )}
                          {m.calves_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Calves</span>
                              <strong className="text-zinc-900">{m.calves_cm} cm</strong>
                            </div>
                          )}
                          {m.shoulders_cm && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-100">
                              <span className="text-[10px] text-zinc-400 block">Shoulders</span>
                              <strong className="text-zinc-900">{m.shoulders_cm} cm</strong>
                            </div>
                          )}
                        </div>

                        {m.trainer_notes && (
                          <div className="p-2.5 rounded-xl bg-white border border-zinc-100 text-xs">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Trainer Observations</span>
                            <p className="text-zinc-700 italic mt-0.5">&quot;{m.trainer_notes}&quot;</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-zinc-200/90 shadow-sm text-center text-zinc-400 space-y-2">
              <Users className="w-12 h-12 mx-auto opacity-40 text-teal-600" />
              <h3 className="text-sm font-bold text-zinc-800">No Client Selected</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Select a client from the list to view full profile details, edit membership information, and inspect weekly measurement history.
              </p>
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
                    placeholder="e.g. Priya Sharma"
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
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. priya@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9811122233"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Weekly Measurement Day *</label>
                  <select
                    value={measurementDay}
                    onChange={(e) => setMeasurementDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
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
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Default Assigned Trainer</label>
                  <select
                    value={defaultTrainerId}
                    onChange={(e) => setDefaultTrainerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Select Trainer</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Package Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Package End Date</label>
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
                <label className="block text-xs font-bold text-zinc-800 mb-1">Client Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Tower B-402, DLF Phase 5, Gurgaon"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Fitness Goals & Medical History</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weight loss 5kg, core strengthening, lower back pain care"
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
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Save Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950">Edit Client Profile</h2>
                <p className="text-[11px] text-zinc-400">Update contact info, package duration, and assigned trainer.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-3.5">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Account Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'paused', 'expired'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        editStatus === st
                          ? st === 'active'
                            ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-sm'
                            : st === 'paused'
                            ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                            : 'bg-red-500 text-white border-red-500 shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Emergency Contact</label>
                  <input
                    type="tel"
                    value={editEmergencyContact}
                    onChange={(e) => setEditEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Measurement Day *</label>
                  <select
                    value={editMeasurementDay}
                    onChange={(e) => setEditMeasurementDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Assigned Trainer</label>
                  <select
                    value={editTrainerId}
                    onChange={(e) => setEditTrainerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Package Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Package End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Client Address / Location</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Fitness Goals</label>
                <textarea
                  rows={2}
                  value={editFitnessGoals}
                  onChange={(e) => setEditFitnessGoals(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isEditing ? 'Saving Changes...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-zinc-950">Remove Client?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to delete <strong>{clientToDelete.full_name}</strong>? If this client has historical classes, they will be archived as expired instead.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteClient}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
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
