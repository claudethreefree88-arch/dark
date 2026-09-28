'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  UserCog,
  Plus,
  RotateCw,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Shield,
  Trash2,
  Power,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  User,
  UploadCloud,
  FileText,
  MapPin,
  CreditCard,
  Download,
  AlertCircle,
  X,
  FileCheck,
  Building,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'DEACTIVATED' | 'BLOCKED';
  address?: string;
  aadhaarNumber?: string;
  aadhaarDocumentUrl?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  notes?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');

  // Onboarding Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarDocumentUrl, setAadhaarDocumentUrl] = useState('');
  const [aadhaarFileName, setAadhaarFileName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dossier Edit State
  const [editAddress, setEditAddress] = useState('');
  const [editAadhaarNumber, setEditAadhaarNumber] = useState('');
  const [editAadhaarDoc, setEditAadhaarDoc] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [savingDossier, setSavingDossier] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const json = await res.json();
      if (json.success && json.data) {
        setStaff(json.data || []);
      }
    } catch {
      toast.error('Failed to load staff roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Quick Password Generator
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  // Handle Aadhaar File Selection (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      toast.error('File size must be under 6MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (isEdit) {
        setEditAadhaarDoc(base64);
        toast.success(`Aadhaar document selected (${file.name})`);
      } else {
        setAadhaarDocumentUrl(base64);
        setAadhaarFileName(file.name);
        toast.success(`Aadhaar document uploaded (${file.name})`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  // Format Aadhaar Input (XXXX XXXX XXXX)
  const handleAadhaarChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 12);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaarNumber(formatted);
  };

  // Onboard Staff Submission
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          address,
          aadhaarNumber,
          aadhaarDocumentUrl,
          emergencyContact,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Staff account for ${firstName} created successfully!`);
        setOnboardModalOpen(false);
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setAddress('');
        setAadhaarNumber('');
        setAadhaarDocumentUrl('');
        setAadhaarFileName('');
        setEmergencyContact('');
        loadStaff();
      } else {
        toast.error(json.error?.message || 'Failed to onboard staff member');
      }
    } catch {
      toast.error('Network error while creating staff account');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Dossier Modal
  const openDossier = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditAddress(member.address || '');
    setEditAadhaarNumber(member.aadhaarNumber || '');
    setEditAadhaarDoc(member.aadhaarDocumentUrl || '');
    setEditEmergencyContact(member.emergencyContact || '');
    setDossierModalOpen(true);
  };

  // Save Updated Dossier (Address & Aadhaar)
  const handleSaveDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setSavingDossier(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStaff.id,
          address: editAddress,
          aadhaarNumber: editAadhaarNumber,
          aadhaarDocumentUrl: editAadhaarDoc,
          emergencyContact: editEmergencyContact,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Updated information for ${selectedStaff.name}!`);
        loadStaff();
        setDossierModalOpen(false);
      } else {
        toast.error(json.error?.message || 'Failed to update staff dossier');
      }
    } catch {
      toast.error('Network error saving staff information');
    } finally {
      setSavingDossier(false);
    }
  };

  // Toggle Staff Status (ACTIVE <-> DEACTIVATED)
  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          `${member.name} is now ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`
        );
        loadStaff();
      } else {
        toast.error(json.error?.message || 'Could not update staff status');
      }
    } catch {
      toast.error('Failed to change status');
    }
  };

  // Reset Staff Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !newPassword) return;

    setResetting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStaff.id,
          password: newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Password updated for ${selectedStaff.name}!`);
        setResetPasswordModalOpen(false);
        setNewPassword('');
        setSelectedStaff(null);
      } else {
        toast.error(json.error?.message || 'Failed to update password');
      }
    } catch {
      toast.error('Network error updating password');
    } finally {
      setResetting(false);
    }
  };

  // Delete Staff Account
  const handleDeleteStaff = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the staff roster?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff?id=${member.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || 'Staff account removed');
        loadStaff();
      } else {
        toast.error(json.error?.message || 'Failed to delete staff member');
      }
    } catch {
      toast.error('Network error deleting staff');
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.phone.toLowerCase().includes(query) ||
        (s.address && s.address.toLowerCase().includes(query)) ||
        (s.aadhaarNumber && s.aadhaarNumber.includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [staff, statusFilter, search]);

  const activeCount = useMemo(() => staff.filter((s) => s.status === 'ACTIVE').length, [staff]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-ds-accent" />
            <span>Staff & Operator Accounts</span>
          </h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Manage floor operators, KYC identification (Aadhaar & Address), and arena shift access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStaff} className="border-ds-border hover:border-ds-accent/40">
            <RotateCw className="w-3.5 h-3.5 mr-1.5 text-ds-accent" />
            <span>Refresh</span>
          </Button>

          <Button variant="accent" size="sm" onClick={() => setOnboardModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Onboard Staff</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ds-text-dim mr-1">
            Status:
          </span>
          <div className="flex gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-heading font-bold uppercase transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-ds-accent text-white shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              All ({staff.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-heading font-bold uppercase transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DEACTIVATED')}
              className={`px-3 py-1 rounded-lg font-heading font-bold uppercase transition-all ${
                statusFilter === 'DEACTIVATED'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Deactivated ({staff.length - activeCount})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder="Search name, phone, email, Aadhaar, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8 w-full sm:w-80"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Staff Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim animate-pulse">
            Loading staff accounts and KYC records...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim space-y-2">
            <UserCog className="w-8 h-8 text-ds-text-dim mx-auto opacity-50" />
            <p>No staff accounts found matching your search.</p>
            <Button variant="outline" size="sm" onClick={() => setOnboardModalOpen(true)} className="text-xs mt-2">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Onboard First Staff Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/80 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Operator Name</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                  <th className="py-3.5 px-4 font-semibold">Residential Address</th>
                  <th className="py-3.5 px-4 font-semibold">Aadhaar Card / KYC</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold">Last Login</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40 font-body">
                {filteredStaff.map((s) => {
                  const isSuperAdmin = s.role === 'SUPER_ADMIN';
                  const isActive = s.status === 'ACTIVE';
                  const hasAadhaarDoc = Boolean(s.aadhaarDocumentUrl);
                  const hasAadhaarNum = Boolean(s.aadhaarNumber);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-ds-surface/50 transition-colors group"
                    >
                      {/* Operator Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-bold text-xs shrink-0 ${
                              isSuperAdmin
                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                : 'bg-ds-accent/20 border border-ds-accent/40 text-ds-ice'
                            }`}
                          >
                            {s.name[0] || 'S'}
                          </div>
                          <div>
                            <div className="font-heading font-bold text-ds-text text-sm leading-tight flex items-center gap-1.5">
                              <span>{s.name}</span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-semibold uppercase ${
                                isSuperAdmin
                                  ? 'text-purple-400'
                                  : s.role === 'ADMIN'
                                  ? 'text-amber-400'
                                  : 'text-cyan-400'
                              }`}
                            >
                              {isSuperAdmin
                                ? 'Super Admin'
                                : s.role === 'ADMIN'
                                ? 'Administrator'
                                : 'Floor Operator'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-ds-text leading-tight">{s.phone}</div>
                        <div className="text-[11px] text-ds-text-dim truncate max-w-[170px]">
                          {s.email}
                        </div>
                      </td>

                      {/* Residential Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {s.address ? (
                          <div className="flex items-start gap-1.5 text-ds-text-muted text-[11px] leading-snug line-clamp-2">
                            <MapPin className="w-3 h-3 text-ds-accent shrink-0 mt-0.5" />
                            <span className="truncate">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-ds-text-dim text-[11px] italic">Address not provided</span>
                        )}
                      </td>

                      {/* Aadhaar Card / KYC Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {hasAadhaarNum ? (
                            <div className="font-mono text-xs text-ds-text flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-cyan-400" />
                              <span>{s.aadhaarNumber}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-ds-text-dim italic block">
                              No Aadhaar No.
                            </span>
                          )}

                          {hasAadhaarDoc ? (
                            <button
                              type="button"
                              onClick={() => openDossier(s)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                            >
                              <FileCheck className="w-3 h-3 text-emerald-400" />
                              <span>Aadhaar Doc Uploaded</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDossier(s)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                            >
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>KYC Pending Upload</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          <span>{s.status}</span>
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-ds-text-dim font-mono text-[11px] whitespace-nowrap">
                        {s.lastLoginAt
                          ? new Date(s.lastLoginAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Full Dossier Button */}
                          <button
                            type="button"
                            onClick={() => openDossier(s)}
                            className="p-1.5 rounded-lg border border-ds-border text-ds-text-dim hover:text-ds-ice hover:border-ds-accent/40 hover:bg-ds-accent/10 transition-all"
                            title="View Staff Dossier & Aadhaar Card"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate Button */}
                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s)}
                              className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
                                isActive
                                  ? 'border-ds-border text-ds-text-dim hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                              title={isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(s);
                              setNewPassword('');
                              setResetPasswordModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-ds-border text-ds-text-dim hover:text-ds-ice hover:border-ds-accent/40 hover:bg-ds-accent/10 transition-all"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account Button */}
                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(s)}
                              className="p-1.5 rounded-lg border border-ds-border text-ds-text-dim hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── ONBOARD STAFF MODAL (WITH ADDRESS & AADHAAR CARD UPLOAD) ──────────── */}
      <Modal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        title="Onboard New Staff Member"
        description="Register a new floor operator with residential address and Aadhaar KYC identification."
        size="lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto px-1 pr-2">
          {/* SECTION 1: Personal & Contact */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ds-accent font-bold block border-b border-ds-border/60 pb-1">
              1. Personal & Contact Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="hari"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="text-xs py-2 bg-ds-dark border-ds-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Last Name
                </label>
                <Input
                  placeholder="Balan"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs py-2 bg-ds-dark border-ds-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="claudethreefree88@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-xs py-2 bg-ds-dark border-ds-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Primary Mobile Phone <span className="text-rose-400">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="9940088776"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="text-xs py-2 bg-ds-dark border-ds-border font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Emergency Contact / Alternate Phone
                </label>
                <Input
                  type="tel"
                  placeholder="+91 98400 12345 (Family / Guardian)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="text-xs py-2 bg-ds-dark border-ds-border font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Temporary Login Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-xs py-2 pr-16 bg-ds-dark border-ds-border font-mono"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1 text-ds-text-dim">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-ds-ice"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="p-1 text-ds-accent hover:text-ds-ice"
                      title="Generate Secure Password"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Address & Aadhaar Identification */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ds-accent font-bold block border-b border-ds-border/60 pb-1">
              2. Residential Address & KYC Verification
            </span>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Full Residential Address
              </label>
              <textarea
                rows={2}
                placeholder="Door No, Street, Apartment, City, State, PIN Code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ds-dark border border-ds-border text-xs text-ds-text focus:outline-none focus:border-ds-accent transition-colors"
              />
            </div>

            {/* Aadhaar Number & Upload Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Aadhaar Card Number
                </label>
                <Input
                  placeholder="XXXX XXXX XXXX (12 digits)"
                  value={aadhaarNumber}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  className="text-xs py-2 bg-ds-dark border-ds-border font-mono tracking-widest"
                />
                <span className="text-[10px] font-mono text-ds-text-dim block">
                  Government issued 12-digit UIDAI identity
                </span>
              </div>

              {/* Aadhaar Document Upload */}
              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                  Aadhaar Card Document / Photo
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e, false)}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {aadhaarDocumentUrl ? (
                  <div className="p-2.5 rounded-xl bg-ds-surface border border-emerald-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {aadhaarDocumentUrl.startsWith('data:image') ? (
                        <img
                          src={aadhaarDocumentUrl}
                          alt="Aadhaar Preview"
                          className="w-10 h-10 object-cover rounded-lg border border-ds-border shrink-0"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-ds-ice shrink-0" />
                      )}
                      <div className="min-w-0 truncate">
                        <p className="text-xs font-heading font-bold text-emerald-400 truncate">
                          {aadhaarFileName || 'Aadhaar Attached'}
                        </p>
                        <span className="text-[10px] font-mono text-ds-text-dim">Ready to save</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarDocumentUrl('');
                        setAadhaarFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded-lg text-ds-text-dim hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl border border-dashed border-ds-border hover:border-ds-accent/60 bg-ds-dark/60 hover:bg-ds-surface/40 transition-all cursor-pointer text-center group"
                  >
                    <UploadCloud className="w-5 h-5 text-ds-text-dim group-hover:text-ds-accent mx-auto mb-1 transition-colors" />
                    <span className="text-xs font-heading font-bold text-ds-text group-hover:text-ds-ice block">
                      Upload Aadhaar Card
                    </span>
                    <span className="text-[10px] font-mono text-ds-text-dim">
                      Supports JPG, PNG, or PDF up to 6MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permission Guarantee Note */}
          <div className="p-3 rounded-xl bg-ds-surface/60 border border-ds-accent/30 text-[11px] text-ds-text-muted flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-heading font-bold text-ds-text uppercase tracking-wider block">
                Floor Operator Permissions
              </span>
              <span>
                All onboarded staff automatically receive access to the Live Station Grid, counter check-ins, walk-in registration, and session extensions.
              </span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ds-border/60 sticky bottom-0 bg-ds-dark/95 backdrop-blur-md">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOnboardModalOpen(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={submitting} className="text-xs font-heading font-bold uppercase">
              {submitting ? 'Creating Staff Account...' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── STAFF DOSSIER MODAL (FULL PROFILE & AADHAAR CARD VIEWER) ─────────── */}
      <Modal
        isOpen={dossierModalOpen}
        onClose={() => {
          setDossierModalOpen(false);
          setSelectedStaff(null);
        }}
        title={`Staff Dossier: ${selectedStaff?.name || 'Operator'}`}
        description="Comprehensive personal records, residential address, and Aadhaar card verification."
        size="lg"
      >
        {selectedStaff && (
          <form onSubmit={handleSaveDossier} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto px-1 pr-2">
            {/* Header Identity Badge */}
            <div className="p-4 rounded-xl bg-ds-surface/60 border border-ds-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-ds-accent/20 border border-ds-accent/40 text-ds-ice flex items-center justify-center font-heading font-black text-lg">
                  {selectedStaff.name[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-ds-text">{selectedStaff.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-ds-text-dim">{selectedStaff.email}</span>
                    <span className="text-ds-border">•</span>
                    <span className="text-xs font-mono text-ds-accent">{selectedStaff.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    selectedStaff.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedStaff.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  <span>{selectedStaff.status}</span>
                </span>
              </div>
            </div>

            {/* Editable Address & Emergency Contact */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ds-accent font-bold block border-b border-ds-border/60 pb-1">
                Residential Address & Emergency Contact
              </span>

              <div className="space-y-1">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-ds-accent" />
                  <span>Residential Address</span>
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Enter complete residential address"
                  className="w-full px-3 py-2 rounded-xl bg-ds-dark border border-ds-border text-xs text-ds-text focus:outline-none focus:border-ds-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                    Emergency Contact Number
                  </label>
                  <Input
                    type="tel"
                    value={editEmergencyContact}
                    onChange={(e) => setEditEmergencyContact(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="text-xs py-2 bg-ds-dark border-ds-border font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-ds-accent" />
                    <span>Aadhaar Card Number</span>
                  </label>
                  <Input
                    value={editAadhaarNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
                      setEditAadhaarNumber(formatted);
                    }}
                    placeholder="XXXX XXXX XXXX"
                    className="text-xs py-2 bg-ds-dark border-ds-border font-mono tracking-widest"
                  />
                </div>
              </div>
            </div>

            {/* Aadhaar Card Document Preview / Viewer */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-ds-border/60 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ds-accent font-bold">
                  Government Aadhaar Card Document
                </span>

                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => handleFileUpload(e, true)}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-xs py-1 h-7 border-ds-border"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1 text-ds-accent" />
                  <span>{editAadhaarDoc ? 'Replace Document' : 'Upload Aadhaar Card'}</span>
                </Button>
              </div>

              {editAadhaarDoc ? (
                <div className="p-3 rounded-xl bg-ds-dark border border-ds-border space-y-2">
                  {editAadhaarDoc.startsWith('data:image') ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden border border-ds-border max-h-72 bg-black/60 flex items-center justify-center">
                        <img
                          src={editAadhaarDoc}
                          alt="Aadhaar Card"
                          className="max-h-72 w-auto object-contain hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aadhaar Document Verified on File</span>
                        </span>
                        <a
                          href={editAadhaarDoc}
                          download={`Aadhaar_${selectedStaff.name.replace(/\s+/g, '_')}.png`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ds-surface border border-ds-border text-[11px] font-heading font-bold text-ds-ice hover:bg-ds-accent/20 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Image</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <FileText className="w-10 h-10 text-ds-ice mx-auto" />
                      <p className="text-xs font-heading font-bold text-ds-text">PDF Document Attached</p>
                      <a
                        href={editAadhaarDoc}
                        download={`Aadhaar_${selectedStaff.name.replace(/\s+/g, '_')}.pdf`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border text-xs font-heading font-bold text-ds-ice hover:bg-ds-accent/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Document</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="p-8 rounded-xl border-2 border-dashed border-ds-border hover:border-ds-accent/60 bg-ds-dark/40 hover:bg-ds-surface/30 transition-all cursor-pointer text-center group"
                >
                  <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-heading font-bold text-ds-text group-hover:text-ds-ice">
                    No Aadhaar Card Uploaded
                  </p>
                  <span className="text-[11px] text-ds-text-dim block mt-0.5">
                    Click to upload front-side photo or scan copy (JPG, PNG, or PDF)
                  </span>
                </div>
              )}
            </div>

            {/* Dossier Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-ds-border/60 sticky bottom-0 bg-ds-dark/95 backdrop-blur-md">
              <Button
                variant="outline"
                type="button"
                onClick={() => setDossierModalOpen(false)}
                disabled={savingDossier}
                className="text-xs"
              >
                Close
              </Button>
              <Button variant="accent" type="submit" disabled={savingDossier} className="text-xs font-heading font-bold uppercase">
                {savingDossier ? 'Saving Changes...' : 'Save Updated Records'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── RESET PASSWORD MODAL ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedStaff(null);
        }}
        title={`Reset Password for ${selectedStaff?.name || 'Staff'}`}
        description="Assign a new temporary password for this operator account."
      >
        <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              New Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="text-xs py-2 pr-10 bg-ds-dark border-ds-border font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-ds-text-dim hover:text-ds-ice transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ds-border/60">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setResetPasswordModalOpen(false);
                setSelectedStaff(null);
              }}
              disabled={resetting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={resetting} className="text-xs">
              {resetting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
