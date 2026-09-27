'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  CreditCard,
  AlertTriangle,
  Info,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: { path?: string; [key: string]: unknown } | null;
}

export function NotificationBell({ role = 'CUSTOMER' }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clockTime, setClockTime] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message || 'Could not load notifications.');
      }
      setNotifications(json.data.notifications || []);
      setUnreadCount(json.data.unreadCount || 0);
      setClockTime(Date.now());
      setError('');
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = window.setTimeout(() => { void fetchNotifications(); }, 0);
    const interval = window.setInterval(() => { void fetchNotifications(); }, 30000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  // Dismiss on outside click or Escape.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (!res.ok) throw new Error('Could not update notifications.');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setError('');
    } catch {
      setError('Could not mark notifications as read.');
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        const res = await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
        if (!res.ok) throw new Error('Could not update notification.');
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        setError('');
      } catch {
        setError('Could not mark this notification as read.');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SESSION_ENDING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'BOOKING_CONFIRMED':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-4 h-4 text-ds-accent" />;
      case 'SESSION_REMINDER':
        return <Clock className="w-4 h-4 text-sky-400" />;
      default:
        return <Info className="w-4 h-4 text-ds-ice" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (clockTime === null) return '';
    const timestamp = new Date(isoString).getTime();
    if (!Number.isFinite(timestamp)) return '';
    const diff = Math.max(0, Math.floor((clockTime - timestamp) / 1000));
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-ds-surface/60 hover:bg-ds-surface border border-ds-border hover:border-ds-accent/40 text-ds-text-muted hover:text-ds-text transition-all"
        aria-label="View notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-ds-accent text-[10px] font-heading font-black text-white shadow-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 flex w-[min(22rem,calc(100vw-3rem))] max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-xl border border-ds-border-light bg-ds-surface shadow-2xl shadow-black/90 z-50 animate-fade-in-down" role="region" aria-label="Notifications">
          {/* Header */}
          <div className="shrink-0 px-3 py-2.5 border-b border-ds-border flex items-center justify-between gap-2 bg-ds-surface-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="font-heading font-black text-[11px] uppercase tracking-wide text-ds-text whitespace-nowrap">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-ds-accent/20 text-ds-ice text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  aria-label="Mark all notifications as read"
                  className="flex items-center gap-1 whitespace-nowrap text-[10px] text-ds-accent hover:text-ds-accent-hover font-semibold px-1.5 py-1 rounded-lg hover:bg-ds-surface-3 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden min-[360px]:inline">Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-1 text-ds-text-dim hover:text-ds-text rounded-md hover:bg-ds-surface-3"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex shrink-0 items-center justify-between gap-2 border-b border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              <span>{error}</span>
              <button type="button" onClick={() => { setLoading(true); void fetchNotifications(); }} className="shrink-0 font-semibold underline">Retry</button>
            </div>
          )}

          {/* List */}
          <div className="min-h-0 max-h-64 flex-1 overflow-y-auto divide-y divide-ds-border/40 bg-ds-surface">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ds-text-dim">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ds-text-dim">
                {error ? 'Notifications are unavailable right now.' : 'No notifications yet.'}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => { if (!notif.isRead) void handleItemClick(notif); }}
                  onKeyDown={(event) => {
                    if (!notif.isRead && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      void handleItemClick(notif);
                    }
                  }}
                  role={notif.isRead ? undefined : 'button'}
                  tabIndex={notif.isRead ? undefined : 0}
                  aria-label={notif.isRead ? undefined : `Mark ${notif.title} as read`}
                  className={`px-3 py-2.5 transition-colors flex items-start gap-2.5 ${
                    notif.isRead
                      ? 'bg-ds-surface hover:bg-ds-surface-2/70'
                      : 'cursor-pointer bg-ds-surface-2/90 hover:bg-ds-surface-2 border-l-2 border-ds-accent'
                  }`}
                >
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ds-surface-3/80 border border-ds-border">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="min-w-0 font-heading font-bold text-[11px] leading-snug text-ds-text line-clamp-2">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-ds-text-dim font-mono shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-ds-text-muted leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.metadata?.path && (
                      <Link
                        href={notif.metadata.path}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-ds-ice hover:text-ds-accent font-semibold mt-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-3 py-2.5 border-t border-ds-border bg-ds-surface-2 text-center">
            {role === 'CUSTOMER' ? (
              <Link
                href="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent hover:text-ds-accent-hover transition-colors"
              >
                View Full Notification Center →
              </Link>
            ) : role === 'STAFF' ? (
              <Link
                href="/staff"
                onClick={() => setOpen(false)}
                className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent hover:text-ds-accent-hover transition-colors"
              >
                Open Staff Operations →
              </Link>
            ) : (
              <Link
                href="/admin/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent hover:text-ds-accent-hover transition-colors"
              >
                Manage Broadcast Alerts →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
