'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Gamepad2, Banknote, UserPlus, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Station {
  id: string;
  name: string;
  stationType: string;
  facilityName: string;
  pricePerHourPaise: number;
  status: string;
}

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  preselectedStationId?: string;
  onSuccess: () => void;
}

export function WalkInModal({
  isOpen,
  onClose,
  stations,
  preselectedStationId,
  onSuccess,
}: WalkInModalProps) {
  const availableStations = stations.filter((s) => s.status === 'AVAILABLE');
  const initialStation =
    stations.find((s) => s.id === preselectedStationId) || availableStations[0] || stations[0];

  const [selectedStationId, setSelectedStationId] = useState<string>(initialStation?.id || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const hourlyRate = selectedStation ? selectedStation.pricePerHourPaise : 20000;
  const totalFeePaise = Math.round(hourlyRate * (durationMinutes / 60));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      toast.error('Please select a station');
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error('Please provide customer name and phone');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStationId,
          durationMinutes,
          customerName,
          customerPhone,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Walk-in confirmed! Console on ${selectedStation?.name || 'station'} is active.`);
        onSuccess();
        onClose();
        setCustomerName('');
        setCustomerPhone('');
      } else {
        toast.error(json.error?.message || 'Failed to start walk-in');
      }
    } catch {
      toast.error('Error creating walk-in session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Front-Desk Instant Walk-in Booking">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Station Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Select Gaming Station
          </label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent transition-colors"
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id} disabled={st.status !== 'AVAILABLE'}>
                {st.name} ({st.facilityName}) — ₹{(st.pricePerHourPaise / 100).toFixed(0)}/hr
                {st.status !== 'AVAILABLE' ? ` [${st.status}]` : ' [Ready]'}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Session Length
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { min: 30, label: '30m' },
              { min: 60, label: '1 Hour' },
              { min: 120, label: '2 Hours' },
              { min: 180, label: '3 Hours' },
            ].map((d) => (
              <button
                type="button"
                key={d.min}
                onClick={() => setDurationMinutes(d.min)}
                className={`py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all border ${
                  durationMinutes === d.min
                    ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                    : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">Gamer Name</label>
            <Input
              placeholder="e.g. Rahul Verma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">WhatsApp Phone</label>
            <Input
              placeholder="9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Payment Received At Desk
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Cash Desk', icon: Banknote },
              { id: 'UPI', label: 'UPI / QR', icon: Sparkles },
              { id: 'CARD', label: 'POS Card', icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setPaymentMethod(id as any)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === id
                    ? 'bg-ds-surface border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                    : 'bg-ds-surface/40 border-ds-border text-ds-text-muted hover:border-ds-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-heading font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Total Pill */}
        <div className="p-4 rounded-xl bg-ds-dark border border-ds-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Amount to Collect</span>
            <span className="text-xl font-heading font-extrabold text-ds-ice">
              ₹{(totalFeePaise / 100).toFixed(0)}
            </span>
          </div>
          <Badge variant="success" size="sm">
            Instant Start
          </Badge>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="accent" type="submit" disabled={submitting}>
            {submitting ? 'Allocating Console...' : 'Confirm & Start Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
