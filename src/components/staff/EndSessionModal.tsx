'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Square, AlertTriangle, Clock, Gamepad2, CheckCircle2, User } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface EndSessionTarget {
  sessionId?: string;
  stationId?: string;
  stationName: string;
  bookingId?: string;
  customerName: string;
  bookingRef?: string;
  scheduledEndAt?: string;
}

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: EndSessionTarget | null;
  onSuccess: () => void;
}

export function EndSessionModal({
  isOpen,
  onClose,
  target,
  onSuccess,
}: EndSessionModalProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  if (!isOpen || !target) return null;

  const handleConfirmEnd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: target.sessionId,
          stationId: target.stationId,
          bookingId: target.bookingId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || `Session ended. ${target.stationName} is now Available.`);
        onSuccess();
        onClose();
      } else {
        toast.error(json.error?.message || 'Failed to end session');
      }
    } catch {
      toast.error('Error ending session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const endDateTime = target.scheduledEndAt ? new Date(target.scheduledEndAt) : null;
  const validEndTime = endDateTime && !isNaN(endDateTime.getTime()) ? endDateTime : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conclude Active Session"
      size="md"
    >
      <div className="space-y-5">
        {/* Warning / Confirmation Banner */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-white">
              End Session for {target.customerName}?
            </h4>
            <p className="text-xs text-ds-text-dim mt-0.5 leading-relaxed">
              This will wrap up the ongoing gaming session on <strong className="text-white">{target.stationName}</strong> and immediately free up the station for new players.
            </p>
          </div>
        </div>

        {/* Session Dossier Summary */}
        <div className="p-4 rounded-xl bg-ds-dark border border-ds-border space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-ds-border/60">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <User className="w-4 h-4 text-ds-accent" />
              <span>Current Player</span>
            </div>
            <span className="font-heading font-bold text-white text-sm">
              {target.customerName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-ds-border/60">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <Gamepad2 className="w-4 h-4 text-ds-ice" />
              <span>Console / Station</span>
            </div>
            <Badge variant="accent" size="sm" className="font-mono">
              {target.stationName}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Scheduled End Time</span>
            </div>
            <span className="font-mono text-ds-text font-bold">
              {validEndTime
                ? validEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Active Now'}
            </span>
          </div>

          {target.bookingRef && (
            <div className="flex items-center justify-between pt-2 border-t border-ds-border/60">
              <span className="text-ds-text-dim font-mono text-[11px]">Booking Reference</span>
              <code className="text-ds-ice font-mono text-[11px] bg-ds-surface px-2 py-0.5 rounded border border-ds-border">
                {target.bookingRef}
              </code>
            </div>
          )}
        </div>

        {/* Operational Consequences Notice */}
        <div className="rounded-xl bg-ds-surface/50 border border-ds-border p-3.5 space-y-2 text-xs">
          <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim block">
            What happens when you confirm:
          </span>
          <div className="space-y-1.5 text-ds-text-muted text-[11px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-400">{target.stationName}</strong> will instantly switch to <strong className="text-emerald-400">AVAILABLE</strong> on the floor grid.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Booking status moves to <strong className="text-white">COMPLETED</strong> in reservation history.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Active timers and notifications are halted.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-xs"
          >
            Cancel / Keep Running
          </Button>

          <Button
            variant="danger"
            type="button"
            onClick={handleConfirmEnd}
            disabled={submitting}
            className="text-xs font-bold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
          >
            <Square className="w-3.5 h-3.5" />
            <span>{submitting ? 'Ending Session...' : 'Confirm & End Session'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
