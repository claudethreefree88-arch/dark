'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Sparkles,
  Search,
  RotateCw,
  PlusCircle,
  ShieldCheck,
  Crown,
  Shield,
  Calendar,
  CreditCard,
  User,
  Phone,
  Mail,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Membership {
  id: string;
  userId: string;
  planId: string;
  planNameSnapshot: string;
  tierSnapshot: string;
  pricePaidPaise: number;
  discountPercent: number;
  freeHoursGranted?: number;
  freeHoursUsed?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startsAt: string;
  expiresAt: string;
  paymentMethod: string;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    tier: string;
    discountPercent: number;
    pricePaise: number;
    durationDays: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  tier: string;
  description: string;
  pricePaise: number;
  durationDays: number;
  discountPercent: number;
  freeHours: number;
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modal State for granting pass
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'OTHER'>('CASH');
  const [grantNotes, setGrantNotes] = useState('Admin manual pass grant');
  const [submittingGrant, setSubmittingGrant] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [memRes, plansRes, custRes] = await Promise.all([
        fetch('/api/admin/memberships'),
        fetch('/api/membership/plans'),
        fetch('/api/admin/customers'),
      ]);

      const memJson = await memRes.json();
      const plansJson = await plansRes.json();
      const custJson = await custRes.json();

      if (memJson.success && memJson.data?.memberships) {
        setMemberships(memJson.data.memberships);
      }
      if (plansJson.success && plansJson.data?.plans) {
        setPlans(plansJson.data.plans);
        if (plansJson.data.plans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(plansJson.data.plans[0].id);
        }
      }
      if (custJson.success && custJson.data) {
        setCustomers(
          custJson.data.map((c: any) => ({
            id: c.id,
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Gamer',
            email: c.email,
            phone: c.phone || '',
          }))
        );
      }
    } catch {
      toast.error('Failed to load memberships data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGrantMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedPlanId) {
      toast.error('Please select both a gamer and a pass plan');
      return;
    }

    setSubmittingGrant(true);
    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          planId: selectedPlanId,
          paymentMethod,
          notes: grantNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message || 'Pass activated successfully!');
        setIsGrantOpen(false);
        loadData();
      } else {
        toast.error(json.error?.message || 'Failed to grant membership');
      }
    } catch {
      toast.error('Network error during pass allocation');
    } finally {
      setSubmittingGrant(false);
    }
  };

  const handleCancelMembership = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to cancel the active pass for ${customerName}?`)) return;

    setCancellingId(id);
    try {
      const res = await fetch(`/api/admin/memberships/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Pass for ${customerName} has been cancelled`);
        loadData();
      } else {
        toast.error(json.error?.message || 'Failed to cancel pass');
      }
    } catch {
      toast.error('Network error while cancelling pass');
    } finally {
      setCancellingId(null);
    }
  };

  // Metrics
  const activeCount = memberships.filter((m) => m.status === 'ACTIVE').length;
  const totalRevenuePaise = memberships.reduce((acc, m) => acc + (m.pricePaidPaise || 0), 0);
  const vipCount = memberships.filter((m) => m.tierSnapshot === 'VIP' && m.status === 'ACTIVE').length;
  const goldCount = memberships.filter((m) => m.tierSnapshot === 'GOLD' && m.status === 'ACTIVE').length;

  const filteredMemberships = memberships.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || m.tierSnapshot === tierFilter;
    const query = search.toLowerCase();
    const fullName = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      m.user.email.toLowerCase().includes(query) ||
      (m.user.phone && m.user.phone.includes(query)) ||
      m.planNameSnapshot.toLowerCase().includes(query);

    return matchesStatus && matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-ds-accent animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-ds-accent font-bold">
              SUBSCRIPTION & PASS OPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase text-ds-text">
            Dark Syndicate Passes
          </h1>
          <p className="text-xs text-ds-text-muted mt-1">
            Manage player memberships, monitor active privileges, and issue manual passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button variant="accent" size="sm" onClick={() => setIsGrantOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Issue Syndicate Pass</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 border-ds-accent/30">
          <div className="flex items-center justify-between text-xs text-ds-text-dim">
            <span>ACTIVE PASSES</span>
            <Sparkles className="w-4 h-4 text-ds-ice" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-ds-text mt-2">
            {activeCount}
          </p>
          <p className="text-[10px] text-emerald-400 mt-1">Live active gamers</p>
        </Card>

        <Card variant="glass" className="p-4 border-ds-border">
          <div className="flex items-center justify-between text-xs text-ds-text-dim">
            <span>PASSES REVENUE</span>
            <CreditCard className="w-4 h-4 text-ds-accent" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-ds-text mt-2">
            ₹{(totalRevenuePaise / 100).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-ds-text-muted mt-1">Gross pass sales</p>
        </Card>

        <Card variant="glass" className="p-4 border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-ds-text-dim">
            <span>GOLD PASS HOLDERS</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-amber-300 mt-2">
            {goldCount}
          </p>
          <p className="text-[10px] text-amber-400/80 mt-1">20% discount tier</p>
        </Card>

        <Card variant="glass" className="p-4 border-ds-ice/30">
          <div className="flex items-center justify-between text-xs text-ds-text-dim">
            <span>VIP BLACK CARDS</span>
            <Crown className="w-4 h-4 text-ds-ice" />
          </div>
          <p className="text-2xl sm:text-3xl font-heading font-black text-ds-ice mt-2">
            {vipCount}
          </p>
          <p className="text-[10px] text-ds-ice/80 mt-1">30% discount tier</p>
        </Card>
      </div>

      {/* Plan Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id} variant="default" className="p-4 border-ds-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-ds-text-dim">
                {p.tier} TIER
              </span>
              <Badge variant={p.tier === 'VIP' ? 'accent' : p.tier === 'GOLD' ? 'warning' : 'default'} size="sm">
                {p.discountPercent}% OFF
              </Badge>
            </div>
            <h3 className="font-heading font-bold text-sm text-ds-text mt-1">{p.name}</h3>
            <p className="text-xs text-ds-text-muted mt-1 line-clamp-2">{p.description}</p>
            <div className="mt-3 pt-3 border-t border-ds-border/60 flex items-baseline justify-between">
              <span className="text-lg font-heading font-black text-ds-text">
                ₹{(p.pricePaise / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-mono text-ds-text-dim">{p.durationDays} Days Validity</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card variant="glass" className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ds-text-dim" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by gamer name, email, phone, or pass title..."
              className="pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-ds-surface border border-ds-border rounded-xl px-3 py-2 text-xs font-heading font-bold text-ds-text focus:outline-none focus:border-ds-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-ds-surface border border-ds-border rounded-xl px-3 py-2 text-xs font-heading font-bold text-ds-text focus:outline-none focus:border-ds-accent"
            >
              <option value="ALL">All Tiers</option>
              <option value="VIP">VIP Black</option>
              <option value="GOLD">Gold Syndicate</option>
              <option value="SILVER">Silver Syndicate</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Memberships Table */}
      <Card variant="glass" className="overflow-hidden border-ds-border">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim flex flex-col items-center gap-3">
            <RotateCw className="w-6 h-6 animate-spin text-ds-accent" />
            <span>Loading Syndicate Memberships...</span>
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">
            <Sparkles className="w-8 h-8 text-ds-accent/40 mx-auto mb-2" />
            <p>No memberships match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-surface/60 border-b border-ds-border text-[10px] font-mono uppercase tracking-wider text-ds-text-dim">
                <tr>
                  <th className="p-4">Gamer Profile</th>
                  <th className="p-4">Pass & Tier</th>
                  <th className="p-4">Hourly Discount</th>
                  <th className="p-4">Validity Period</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/60">
                {filteredMemberships.map((m) => {
                  const isVip = m.tierSnapshot === 'VIP';
                  const isGold = m.tierSnapshot === 'GOLD';

                  return (
                    <tr key={m.id} className="hover:bg-ds-surface/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-bold text-xs ${
                              isVip
                                ? 'bg-ds-accent/20 border border-ds-accent text-ds-ice'
                                : isGold
                                ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                                : 'bg-slate-700/50 border border-slate-600 text-slate-300'
                            }`}
                          >
                            {m.user.firstName?.[0] || 'G'}
                          </div>
                          <div>
                            <p className="font-heading font-bold text-ds-text">
                              {m.user.firstName} {m.user.lastName}
                            </p>
                            <p className="text-[11px] text-ds-text-muted">{m.user.email}</p>
                            {m.user.phone && (
                              <p className="text-[10px] font-mono text-ds-text-dim">{m.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-heading font-bold text-ds-text block">
                          {m.planNameSnapshot}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${
                            isVip ? 'text-ds-ice' : isGold ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {m.tierSnapshot} TIER
                        </span>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={isVip ? 'accent' : isGold ? 'warning' : 'default'}
                          size="sm"
                        >
                          {m.discountPercent}% OFF
                        </Badge>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-ds-text">
                            <Clock className="w-3 h-3 text-ds-text-dim" />
                            <span>Expires {new Date(m.expiresAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-[10px] font-mono text-ds-text-dim block">
                            Issued {new Date(m.startsAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-mono text-[11px] text-ds-text">
                          ₹{(m.pricePaidPaise / 100).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-ds-text-dim uppercase font-mono">
                          {m.paymentMethod}
                        </span>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={
                            m.status === 'ACTIVE'
                              ? 'success'
                              : m.status === 'EXPIRED'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {m.status}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        {m.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-[10px] h-7 px-2"
                            disabled={cancellingId === m.id}
                            onClick={() =>
                              handleCancelMembership(
                                m.id,
                                `${m.user.firstName} ${m.user.lastName}`.trim()
                              )
                            }
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            <span>Revoke</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Issue Syndicate Pass Modal */}
      <Modal
        isOpen={isGrantOpen}
        onClose={() => setIsGrantOpen(false)}
        title="Issue Syndicate Pass to Gamer"
      >
        <form onSubmit={handleGrantMembership} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              Select Gamer
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2.5 text-xs text-ds-text focus:outline-none focus:border-ds-accent"
            >
              <option value="">-- Select Registered Gamer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email}) {c.phone ? `— ${c.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              Select Pass Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2.5 text-xs text-ds-text focus:outline-none focus:border-ds-accent"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.tier} — {p.discountPercent}% OFF — ₹{p.pricePaise / 100})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-xs text-ds-text focus:outline-none focus:border-ds-accent"
              >
                <option value="CASH">Counter Cash</option>
                <option value="UPI">UPI / QR Transfer</option>
                <option value="OTHER">Complimentary / VIP</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                Internal Notes
              </label>
              <Input
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                placeholder="e.g. VIP tournament perk"
                className="text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-ds-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsGrantOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="sm" isLoading={submittingGrant}>
              <span>Activate Syndicate Pass</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
