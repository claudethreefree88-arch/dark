'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Gamepad2,
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
  metadata?: { path?: string; [key: string]: any } | null;
}

export function NotificationBell({ role = 'CUSTOMER' }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Dismiss on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
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
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-ds-surface/60 hover:bg-ds-surface border border-ds-border hover:border-ds-accent/40 text-ds-text-muted hover:text-ds-text transition-all"
        aria-label="View notifications"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-ds-dark/95 backdrop-blur-xl border border-ds-border shadow-elevated z-50 overflow-hidden animate-fade-in-down">
          {/* Header */}
          <div className="p-3.5 border-b border-ds-border flex items-center justify-between bg-ds-surface/40">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xs uppercase tracking-wider text-ds-text">
                Live Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-ds-accent/20 text-ds-ice text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-ds-accent hover:text-ds-accent-hover font-semibold px-2 py-1 rounded-lg hover:bg-ds-surface/60 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-ds-text-dim hover:text-ds-text rounded-md hover:bg-ds-surface/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-ds-border/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-ds-text-dim">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 transition-colors flex gap-3 cursor-pointer ${
                    notif.isRead
                      ? 'bg-transparent hover:bg-ds-surface/30 opacity-75'
                      : 'bg-ds-accent/5 hover:bg-ds-accent/10 border-l-2 border-ds-accent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-2 rounded-xl bg-ds-surface/80 border border-ds-border">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-heading font-bold text-xs text-ds-text truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-ds-text-dim font-mono shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-ds-text-muted leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.metadata?.path && (
                      <Link
                        href={notif.metadata.path}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] text-ds-ice hover:text-ds-accent font-semibold mt-1.5"
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
          <div className="p-2.5 border-t border-ds-border bg-ds-surface/20 text-center">
            {role === 'CUSTOMER' ? (
              <Link
                href="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent hover:text-ds-accent-hover transition-colors"
              >
                View Full Notification Center →
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
