'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { UserCog, Plus, RotateCw, Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [submitting, setSubmitting] = useState(false);

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
          role,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Staff account for ${firstName} created!`);
        loadStaff();
        setModalOpen(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('');
      } else {
        toast.error(json.error?.message || 'Failed to create staff member');
      }
    } catch {
      toast.error('Error creating staff account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">Staff & Operator Accounts</h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Manage floor operators, front-desk controllers, and administrator roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStaff}>
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="accent" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Onboard Staff</span>
          </Button>
        </div>
      </div>

      {/* Staff Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading staff accounts...</div>
        ) : staff.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No staff accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Operator Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 font-heading font-bold text-ds-text">{s.name}</td>
                    <td className="py-3.5 px-4 text-ds-text-dim font-mono">{s.email}</td>
                    <td className="py-3.5 px-4 font-mono">{s.phone}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          s.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : s.role === 'ADMIN'
                            ? 'bg-ds-accent/10 text-ds-ice border border-ds-accent/30'
                            : 'bg-ds-surface text-ds-text border border-ds-border'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-ds-text-dim font-mono text-[11px]">
                      {s.lastLoginAt
                        ? new Date(s.lastLoginAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ONBOARD STAFF MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Onboard New Staff Member">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">First Name</label>
              <Input
                placeholder="Dinesh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Last Name</label>
              <Input
                placeholder="Balan"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Email Address</label>
              <Input
                type="email"
                placeholder="dinesh@darksyndicate.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Phone Number</label>
              <Input
                placeholder="9940088776"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Temporary Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent"
              >
                <option value="STAFF">Floor Staff / Operator</option>
                <option value="ADMIN">Arena Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={submitting}>
              {submitting ? 'Onboarding...' : 'Create Staff Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
