'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Tag, Plus, RotateCw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderPaise?: number;
  maxDiscountPaise?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  validUntil: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [formValue, setFormValue] = useState('15');
  const [formMinOrder, setFormMinOrder] = useState('200');
  const [formMaxDiscount, setFormMaxDiscount] = useState('100');
  const [formMaxUses, setFormMaxUses] = useState('250');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const json = await res.json();
      if (json.success && json.data) {
        setCoupons(json.data || []);
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggle = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: coupon.id, isActive: !coupon.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.info(`Coupon ${coupon.code} toggled`);
        loadCoupons();
      }
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const discountVal =
      formType === 'PERCENTAGE'
        ? parseInt(formValue, 10) * 100 // store percentage * 100
        : parseInt(formValue, 10) * 100; // paise

    const minOrderPaise = formMinOrder ? parseInt(formMinOrder, 10) * 100 : undefined;
    const maxDiscountPaise = formMaxDiscount ? parseInt(formMaxDiscount, 10) * 100 : undefined;
    const maxUses = formMaxUses ? parseInt(formMaxUses, 10) : undefined;

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode.toUpperCase().trim(),
          name: formName,
          discountType: formType,
          discountValue: discountVal,
          minOrderPaise,
          maxDiscountPaise,
          maxUses,
          validDays: 30,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Promo code ${formCode.toUpperCase()} created!`);
        loadCoupons();
        setModalOpen(false);
        setFormCode('');
        setFormName('');
      } else {
        toast.error(json.error?.message || 'Failed to create coupon');
      }
    } catch {
      toast.error('Error creating coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">Promo & Discount Codes</h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Manage promotional campaigns, percentage discounts, and redemption usage limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCoupons}>
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="accent" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Coupon</span>
          </Button>
        </div>
      </div>

      {/* Coupons Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading coupon records...</div>
        ) : coupons.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No coupons created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min Spend</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {coupons.map((c) => {
                  const discountDisplay =
                    c.discountType === 'PERCENTAGE'
                      ? `${c.discountValue / 100}% OFF`
                      : `₹${(c.discountValue / 100).toFixed(0)} Flat`;

                  return (
                    <tr key={c.id} className="hover:bg-ds-surface/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-ds-ice text-sm">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-heading font-bold text-ds-text">{c.name}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">{discountDisplay}</td>
                      <td className="py-3.5 px-4 text-ds-text-dim">
                        {c.minOrderPaise ? `₹${(c.minOrderPaise / 100).toFixed(0)}` : 'None'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : 'uses'}
                      </td>
                      <td className="py-3.5 px-4 text-ds-text-dim">
                        {new Date(c.validUntil).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={c.isActive ? 'success' : 'default'} size="sm">
                          {c.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={c.isActive ? 'outline' : 'accent'}
                          size="sm"
                          onClick={() => handleToggle(c)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE COUPON MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Promotional Coupon">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Code</label>
              <Input
                placeholder="e.g. CHAMPION20"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="font-mono uppercase font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Promo Name</label>
              <Input
                placeholder="Tournament Winner Deal"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Discount Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">
                {formType === 'PERCENTAGE' ? 'Discount Value (%)' : 'Discount Amount (₹)'}
              </label>
              <Input
                type="number"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Min Order (₹)</label>
              <Input
                type="number"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Max Cap (₹)</label>
              <Input
                type="number"
                value={formMaxDiscount}
                onChange={(e) => setFormMaxDiscount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Max Redemptions</label>
              <Input
                type="number"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Issue Promo Code'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
