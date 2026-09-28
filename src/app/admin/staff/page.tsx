'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
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
  const [submitting, setSubmitting] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

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
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Staff account for ${firstName} created successfully!`);
        setOnboardModalOpen(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('');
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
        s.phone.toLowerCase().includes(query);

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
            Manage floor operators, front-desk controllers, and shift access.
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
            placeholder="Search operator name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8 w-full sm:w-72"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Staff Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim animate-pulse">
            Loading staff accounts roster...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim space-y-2">
            <UserCog className="w-8 h-8 text-ds-text-dim mx-auto opacity-50" />
            <p>No staff accounts found.</p>
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
                  <th className="py-3.5 px-4 font-semibold">Email Address</th>
                  <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold">Last Login</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40 font-body">
                {filteredStaff.map((s) => {
                  const isSuperAdmin = s.role === 'SUPER_ADMIN';
                  const isActive = s.status === 'ACTIVE';

                  return (
                    <tr key={s.id} className="hover:bg-ds-surface/50 transition-colors">
                      {/* Operator Name & Role Tag */}
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
                            <div className="font-heading font-bold text-ds-text text-sm leading-tight">
                              {s.name}
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

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-ds-text-dim text-xs">
                        {s.email}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-ds-text text-xs whitespace-nowrap">
                        {s.phone}
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
                            title="Reset Staff Password"
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

      {/* ─── ONBOARD STAFF MODAL (NO ASSIGNED ROLE OPTION) ─────────────────────────── */}
      <Modal
        isOpen={onboardModalOpen}
        onClose={() => setOnboardModalOpen(false)}
        title="Onboard New Staff Member"
        description="Add a new floor operator with immediate access to station monitoring and counter check-ins."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 pt-1">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                First Name <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="Dinesh"
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

          {/* Email Address & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <Input
                type="email"
                placeholder="dinesh@darksyndicate.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs py-2 bg-ds-dark border-ds-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Phone Number <span className="text-rose-400">*</span>
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

          {/* Temporary Password with Generator & Eye Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Temporary Password <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] font-mono text-ds-accent hover:text-ds-ice flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Secure Password</span>
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-xs py-2 pr-10 bg-ds-dark border-ds-border font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-ds-text-dim hover:text-ds-ice transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
                Staff accounts automatically receive access to the Live Station Grid, walk-in counter registration, QR ticket scanner, and today's schedule.
              </span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ds-border/60">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOnboardModalOpen(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={submitting} className="text-xs">
              {submitting ? 'Creating Staff Account...' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
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
