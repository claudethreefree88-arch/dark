'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Clock, Banknote, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Station {
  id: string;
  name: string;
  pricePerHourPaise: number;
  activeSession?: {
    id: string;
    customerName: string;
    bookingRef?: string;
    scheduledEndAt: string;
  } | null;
}

interface ExtendSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onSuccess: () => void;
}

export function ExtendSessionModal({
  isOpen,
  onClose,
  station,
  onSuccess,
}: ExtendSessionModalProps) {
  const [additionalMinutes, setAdditionalMinutes] = useState<number>(30);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  if (!station || !station.activeSession) return null;

  const hourlyRate = station.pricePerHourPaise;
  const extensionFeePaise = Math.round(hourlyRate * (additionalMinutes / 60));

  const currentEnd = new Date(station.activeSession.scheduledEndAt);
  const newEnd = new Date(currentEnd.getTime() + additionalMinutes * 60 * 1000);

  const handleExtend = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/sessions/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: station.activeSession?.id,
          stationId: station.id,
          additionalMinutes,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Session extended by +${additionalMinutes}m successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(json.error?.message || 'Could not extend session');
      }
    } catch {
      toast.error('Failed to extend session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Extend Session — ${station.name}`}>
      <div className="space-y-6">
        {/* Gamer Info Banner */}
        <div className="p-4 rounded-xl bg-ds-dark border border-ds-border flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Current Player</span>
            <p className="font-heading font-bold text-sm text-ds-text">
              {station.activeSession.customerName}
            </p>
            <p className="text-ds-ice font-mono text-[11px] mt-0.5">
              Ref: {station.activeSession.bookingRef || 'Direct Session'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Current End Time</span>
            <p className="font-mono font-bold text-ds-text">
              {currentEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Additional Duration Options */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Select Additional Time
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { min: 15, label: '+15m' },
              { min: 30, label: '+30m' },
              { min: 60, label: '+1 Hour' },
              { min: 120, label: '+2 Hours' },
            ].map((d) => (
              <button
                type="button"
                key={d.min}
                onClick={() => setAdditionalMinutes(d.min)}
                className={`py-2.5 rounded-xl text-xs font-heading font-bold uppercase transition-all border ${
                  additionalMinutes === d.min
                    ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                    : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Extension Payment Received
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'UPI', label: 'UPI / QR', icon: Sparkles },
              { id: 'CARD', label: 'POS Card', icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setPaymentMethod(id as any)}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-heading font-bold ${
                  paymentMethod === id
                    ? 'bg-ds-surface border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                    : 'bg-ds-surface/40 border-ds-border text-ds-text-muted hover:border-ds-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Pill */}
        <div className="p-4 rounded-xl bg-ds-dark border border-ds-accent/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">New Scheduled End</span>
            <p className="font-heading font-extrabold text-base text-ds-ice">
              {newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Amount to Collect</span>
            <span className="text-xl font-heading font-black text-ds-text">
              ₹{(extensionFeePaise / 100).toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleExtend} disabled={submitting}>
            {submitting ? 'Extending...' : 'Confirm Extension & Update End Time'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
