'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Bell,
  Send,
  Users,
  Shield,
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'ALL' | 'CUSTOMERS' | 'STAFF'>('ALL');
  const [type, setType] = useState('SYSTEM');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState([
    {
      id: 'b-1',
      title: 'Weekend FIFA 24 Tournament Announced',
      message: 'Registration is now live! 32 slots available with a ₹15,000 cash pool.',
      target: 'ALL',
      type: 'SYSTEM',
      recipients: 52,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'b-2',
      title: 'Console Firmware Update Tonight',
      message: 'Station 6 and 7 will undergo scheduled maintenance from 12:30 AM to 2:00 AM.',
      target: 'STAFF',
      type: 'SYSTEM',
      recipients: 8,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'b-3',
      title: 'Happy Gaming! Special Midweek Discount',
      message: 'Use code CHAMPION15 for 15% off any 2+ hour console or pool booking this Wednesday.',
      target: 'CUSTOMERS',
      type: 'BOOKING_CONFIRMED',
      recipients: 44,
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  ]);

  const toast = useToast();

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please enter both title and message');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, target, type }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data.message || 'Broadcast announcement dispatched!');
        setHistory([
          {
            id: `b-${Date.now()}`,
            title,
            message,
            target,
            type,
            recipients: json.data.recipientCount || 40,
            createdAt: new Date().toISOString(),
          },
          ...history,
        ]);
        setTitle('');
        setMessage('');
      } else {
        toast.error(json.error?.message || 'Failed to dispatch broadcast');
      }
    } catch {
      toast.error('Network error dispatching broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
              Notification & Broadcast Center
            </h1>
            <Badge variant="accent" size="sm">
              INSTANT PUSH
            </Badge>
          </div>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Compose and broadcast instant in-app alerts to gamers, floor operators, and administrative staff.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Broadcast Form (1 Col) */}
        <Card variant="glass" className="p-6 space-y-5 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-ds-border pb-3">
            <Send className="w-4 h-4 text-ds-accent" />
            <h2 className="font-heading font-bold text-sm text-ds-text uppercase">
              Compose Announcement
            </h2>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            {/* Target Audience */}
            <div>
              <label className="text-ds-text-dim block mb-1.5 font-heading font-bold uppercase text-[10px]">
                Target Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', label: 'All Users', icon: Users },
                  { id: 'CUSTOMERS', label: 'Gamers', icon: Gamepad2 },
                  { id: 'STAFF', label: 'Staff', icon: Shield },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTarget(id as any)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-heading font-bold transition-all ${
                      target === id
                        ? 'bg-ds-accent/20 border-ds-accent text-ds-ice shadow-glow-sm'
                        : 'bg-ds-surface/50 border-ds-border text-ds-text-dim hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Type */}
            <div>
              <label className="text-ds-text-dim block mb-1 font-heading font-bold uppercase text-[10px]">
                Alert Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono"
              >
                <option value="SYSTEM">System Announcement</option>
                <option value="BOOKING_CONFIRMED">Special Promo / Event</option>
                <option value="SESSION_REMINDER">Tournament Alert</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-ds-text-dim block mb-1 font-heading font-bold uppercase text-[10px]">
                Broadcast Headline
              </label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Tekken 8 Championship"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-ds-text-dim block mb-1 font-heading font-bold uppercase text-[10px]">
                Notification Body
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message details that will appear in user notification trays..."
                className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono resize-none leading-relaxed"
              />
            </div>

            <Button
              variant="accent"
              className="w-full shadow-glow-sm"
              type="submit"
              isLoading={sending}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Dispatch Broadcast</span>
            </Button>
          </form>
        </Card>

        {/* Broadcast History Ledger (2 Cols) */}
        <Card variant="glass" className="p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ds-border pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-ds-ice" />
              <h2 className="font-heading font-bold text-sm text-ds-text uppercase">
                Broadcast History Log
              </h2>
            </div>
            <span className="text-xs text-ds-text-dim">{history.length} dispatched</span>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-ds-surface/40 border border-ds-border hover:border-ds-border-light transition-colors space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-ds-text">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-ds-text-dim font-mono mt-1">
                      <span>Target: <strong className="text-ds-ice">{item.target}</strong></span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <Badge variant="accent" size="sm">
                    {item.recipients} Recipients
                  </Badge>
                </div>

                <p className="text-ds-text-muted leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
