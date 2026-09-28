'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  Play,
  RotateCw,
  QrCode,
  Tag,
  Info,
  Square,
  PlusCircle,
  Gamepad2,
  AlertTriangle,
  User,
  Phone,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { ExtendSessionModal } from '@/components/staff/ExtendSessionModal';
import { useToast } from '@/components/ui/Toast';

export default function StaffBookingsSchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal states
  const [selectedBookingForGrid, setSelectedBookingForGrid] = useState<any | null>(null);
  const [extendStation, setExtendStation] = useState<any | null>(null);

  // Live real-time ticker
  const [currentTime, setCurrentTime] = useState(Date.now());
  const toast = useToast();

  // Tick every second for live countdowns
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Support ?tab=ACTIVE or other tab param from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'].includes(tabParam)) {
        setStatusFilter(tabParam);
      }
    }
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const json = await res.json();
      if (json.success && json.data) {
        setBookings(json.data || []);
      }
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer calculations
  const getCountdown = (scheduledEndAt: string) => {
    const end = new Date(scheduledEndAt).getTime();
    const diffMs = end - currentTime;

    if (diffMs <= 0) {
      const overdueSec = Math.floor(Math.abs(diffMs) / 1000);
      const mins = Math.floor(overdueSec / 60);
      const secs = overdueSec % 60;
      return {
        formatted: `+${mins}:${secs.toString().padStart(2, '0')}`,
        isOverdue: true,
        isEndingSoon: true,
        percentage: 100,
      };
    }

    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const formatted =
      hours > 0
        ? `${hours}h ${mins.toString().padStart(2, '0')}m`
        : `${mins}:${secs.toString().padStart(2, '0')}`;

    return {
      formatted,
      isOverdue: false,
      isEndingSoon: totalSec <= 300, // < 5 mins
      percentage: Math.min(100, Math.max(0, 100 - (diffMs / (120 * 60 * 1000)) * 100)),
    };
  };

  const handleQuickCheckIn = async (booking: any) => {
    try {
      const res = await fetch('/api/staff/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: booking.bookingRef || booking.id,
          autoStartSession: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Check-in confirmed for ${booking.customerName}!`);
        loadBookings();
      } else {
        toast.error(json.error?.message || 'Check-in failed');
      }
    } catch {
      toast.error('Check-in error');
    }
  };

  const handleEndSession = async (booking: any) => {
    if (!confirm(`End session for ${booking.customerName} on ${booking.stationName}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/staff/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: booking.session?.id,
          stationId: booking.stationId,
          bookingId: booking.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.data?.message || 'Session ended. Station marked available.');
        setSelectedBookingForGrid(null);
        loadBookings();
      } else {
        toast.error(json.error?.message || 'Failed to end session');
      }
    } catch {
      toast.error('Error ending session');
    }
  };

  const openExtendModal = (booking: any) => {
    setExtendStation({
      id: booking.stationId,
      name: booking.stationName,
      pricePerHourPaise: booking.pricePerHourPaise || 15000,
      activeSession: {
        id: booking.session?.id || `active-${booking.id}`,
        bookingId: booking.id,
        customerName: booking.customerName,
        bookingRef: booking.bookingRef,
        scheduledEndAt: booking.session?.scheduledEndAt || booking.endTime,
      },
    });
  };

  const filteredBookings = bookings.filter((b) => {
    const isSessionActive = b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isSessionActive) ||
      (statusFilter === 'UPCOMING' && b.status === 'CONFIRMED') ||
      (statusFilter === 'COMPLETED' && b.status === 'COMPLETED');

    const matchesSearch =
      !searchQuery ||
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.stationName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const activeInSessionCount = bookings.filter(
    (b) => b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
              Arena Daily Reservation Schedule
            </h1>
            {activeInSessionCount > 0 && (
              <Badge variant="accent" size="sm" className="font-mono">
                {activeInSessionCount} In Session
              </Badge>
            )}
          </div>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Monitor player check-ins, active play sessions, time remaining, and equipment assignments in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBookings} title="Refresh schedule">
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/staff">
            <Button variant="accent" size="sm" className="flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" />
              <span>Live Console Grid</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
          {[
            { id: 'ALL', label: 'All Today' },
            { id: 'ACTIVE', label: `In Session / Checked In (${activeInSessionCount})` },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all ${
                statusFilter === tab.id
                  ? 'bg-ds-accent text-white shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Grid/Table Toggle */}
        <div className="flex items-center gap-3">
          {/* Table vs Grid toggle when viewing Active sessions */}
          {statusFilter === 'ACTIVE' && (
            <div className="flex items-center bg-ds-dark p-1 rounded-xl border border-ds-border">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-ds-surface text-ds-ice shadow-sm' : 'text-ds-text-dim hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-ds-surface text-ds-ice shadow-sm' : 'text-ds-text-dim hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative">
            <Input
              placeholder="Search ref, player, station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5 pl-8 w-56 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* ─── GRID CARDS VIEW (When ACTIVE tab and Grid Mode selected) ─── */}
      {statusFilter === 'ACTIVE' && viewMode === 'grid' ? (
        loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-ds-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-ds-text-muted">Loading live station matrix...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center bg-ds-surface/30 rounded-2xl border border-dashed border-ds-border text-ds-text-dim space-y-2">
            <p className="text-sm font-heading font-bold text-ds-text">No active sessions at the moment</p>
            <p className="text-xs text-ds-text-muted">
              Check upcoming bookings or allocate a station from the Desk Walk-in console.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((b) => {
              const scheduledEnd = b.session?.scheduledEndAt || b.endTime;
              const countdown = getCountdown(scheduledEnd);

              return (
                <Card
                  key={b.id}
                  glass
                  className={`p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                    countdown.isOverdue
                      ? 'border-rose-500/80 bg-rose-500/5 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500'
                      : countdown.isEndingSoon
                      ? 'border-amber-400/80 bg-amber-400/5 shadow-lg shadow-amber-400/10'
                      : 'border-ds-accent/60 bg-ds-surface/80 shadow-md shadow-ds-accent/5'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Facility & Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-accent">
                        {b.facilityName || 'PLAYSTATION 5 ARENA'}
                      </span>
                      <Badge
                        variant={
                          countdown.isOverdue
                            ? 'default'
                            : countdown.isEndingSoon
                            ? 'warning'
                            : 'accent'
                        }
                        size="sm"
                        className="font-mono text-[11px] uppercase tracking-wider"
                      >
                        {countdown.isOverdue
                          ? '🚨 OVERDUE'
                          : countdown.isEndingSoon
                          ? '⏳ ENDING SOON'
                          : '🎮 IN SESSION'}
                      </Badge>
                    </div>

                    {/* Title & Specs */}
                    <div>
                      <h3 className="text-xl font-heading font-bold text-ds-text">{b.stationName}</h3>
                      <p className="text-xs text-ds-text-muted line-clamp-1 mt-0.5">
                        {b.stationSpecs || 'Ultra-low latency 4K 120Hz display'}
                      </p>
                    </div>

                    {/* ACTIVE SESSION DETAILS (Matching Image 1) */}
                    <div className="p-4 rounded-xl bg-ds-dark/90 border border-ds-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-ds-text-dim block">Active Player</span>
                          <span className="text-sm font-heading font-bold text-ds-text">
                            {b.customerName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-mono text-ds-text-dim block">Time Remaining</span>
                          <span
                            className={`text-lg font-mono font-black ${
                              countdown.isOverdue
                                ? 'text-rose-400 animate-pulse'
                                : countdown.isEndingSoon
                                ? 'text-amber-400'
                                : 'text-ds-ice'
                            }`}
                          >
                            {countdown.formatted}
                          </span>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-ds-surface overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            countdown.isOverdue
                              ? 'bg-rose-500'
                              : countdown.isEndingSoon
                              ? 'bg-amber-400'
                              : 'bg-ds-accent'
                          }`}
                          style={{ width: `${countdown.percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-ds-text-dim pt-1">
                        <span>Ref: {b.bookingRef}</span>
                        <span>
                          End: {new Date(scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="pt-4 mt-4 border-t border-ds-border/60 flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openExtendModal(b)}
                      className="flex-1 justify-center text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Extend</span>
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEndSession(b)}
                      className="flex-1 justify-center text-xs"
                    >
                      <Square className="w-3.5 h-3.5 mr-1" />
                      <span>End Session</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBookingForGrid(b)}
                      className="px-2.5 text-xs text-ds-ice hover:bg-ds-surface"
                      title="View Full Station Dossier"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* ─── TABLE VIEW (With Info Button on each row) ─── */
        <Card glass className="border-ds-border overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-ds-text-dim">Loading schedule...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-16 text-center text-xs text-ds-text-dim">No reservations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Player Details</th>
                    <th className="py-3 px-4">Station</th>
                    <th className="py-3 px-4">Time Window / Countdown</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ds-border/40">
                  {filteredBookings.map((b) => {
                    const isSessionActive = b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN';
                    const scheduledEnd = b.session?.scheduledEndAt || b.endTime;
                    const countdown = isSessionActive ? getCountdown(scheduledEnd) : null;

                    return (
                      <tr key={b.id} className="hover:bg-ds-surface/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-ds-ice">{b.bookingRef}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-heading font-bold text-ds-text">{b.customerName}</div>
                          <div className="text-[11px] text-ds-text-dim">
                            {b.customerPhone || b.customerEmail || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-heading font-semibold text-ds-text">{b.stationName}</div>
                          <div className="text-[10px] text-ds-accent">{b.facilityName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ds-text">
                          <div className="flex items-center gap-1.5">
                            <span>
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                              {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {isSessionActive && countdown && (
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`text-[11px] font-bold ${
                                  countdown.isOverdue
                                    ? 'text-rose-400 animate-pulse'
                                    : countdown.isEndingSoon
                                    ? 'text-amber-400'
                                    : 'text-ds-ice'
                                }`}
                              >
                                ⏱ {countdown.formatted} left
                              </span>
                              <span className="text-[10px] text-ds-text-dim">({b.durationMinutes / 60} hr)</span>
                            </div>
                          )}
                          {!isSessionActive && (
                            <span className="text-[10px] text-ds-text-dim">{b.durationMinutes / 60} hr session</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ds-text">₹{(b.totalPricePaise / 100).toFixed(0)}</div>
                          <span className="text-[10px] text-ds-text-dim uppercase font-mono">
                            {b.paymentMethod} • {b.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              countdown?.isOverdue
                                ? 'default'
                                : countdown?.isEndingSoon
                                ? 'warning'
                                : isSessionActive
                                ? 'accent'
                                : b.status === 'CONFIRMED'
                                ? 'success'
                                : b.status === 'COMPLETED'
                                ? 'default'
                                : 'warning'
                            }
                            size="sm"
                            className="font-mono text-[10px]"
                          >
                            {countdown?.isOverdue
                              ? '🚨 OVERDUE'
                              : countdown?.isEndingSoon
                              ? '⏳ ENDING SOON'
                              : isSessionActive
                              ? '🎮 IN SESSION'
                              : b.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* In-Session Quick Actions: Extend & End Session */}
                            {isSessionActive && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openExtendModal(b)}
                                  className="text-[11px] py-1 px-2.5 flex items-center gap-1 border-ds-accent/30 hover:border-ds-accent text-ds-ice hover:bg-ds-accent/20"
                                  title="Extend session duration"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-ds-accent" />
                                  <span>Extend</span>
                                </Button>

                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleEndSession(b)}
                                  className="text-[11px] py-1 px-2.5 flex items-center gap-1 text-white bg-rose-600 hover:bg-rose-500"
                                  title="End active session"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                  <span>End Session</span>
                                </Button>
                              </>
                            )}

                            {/* 1. INFO BUTTON — Shows Station Grid View Modal */}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedBookingForGrid(b)}
                              className="text-[11px] py-1 px-2.5 flex items-center gap-1 border-ds-border text-ds-text-dim hover:text-white hover:bg-ds-surface"
                              title="Open Live Station Console Grid View"
                            >
                              <Info className="w-3.5 h-3.5 text-ds-accent" />
                              <span>Info</span>
                            </Button>

                            {/* Check In action for confirmed bookings */}
                            {b.status === 'CONFIRMED' && (
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => handleQuickCheckIn(b)}
                                className="text-[11px] py-1 px-2.5"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                <span>Check In</span>
                              </Button>
                            )}

                            {/* External booking pass link */}
                            <Link href={`/booking/confirmation/${b.bookingRef || b.id}`} target="_blank">
                              <Button variant="outline" size="sm" className="text-[11px] py-1 px-2" title="View Pass">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
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
      )}

      {/* ─── STATION GRID VIEW MODAL ("thats grid view here") ─── */}
      {selectedBookingForGrid && (
        <Modal
          isOpen={!!selectedBookingForGrid}
          onClose={() => setSelectedBookingForGrid(null)}
          title={`Station Console — ${selectedBookingForGrid.stationName}`}
          size="md"
        >
          {(() => {
            const b = selectedBookingForGrid;
            const isSessionActive = b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN';
            const scheduledEnd = b.session?.scheduledEndAt || b.endTime;
            const countdown = isSessionActive ? getCountdown(scheduledEnd) : null;

            return (
              <div className="space-y-5">
                {/* Station Card Preview (Replicating Image 1) */}
                <div
                  className={`p-6 rounded-2xl border transition-all relative overflow-hidden bg-ds-surface/90 shadow-2xl ${
                    countdown?.isOverdue
                      ? 'border-rose-500/80 shadow-rose-500/10 ring-1 ring-rose-500'
                      : countdown?.isEndingSoon
                      ? 'border-amber-400/80 shadow-amber-400/10'
                      : 'border-ds-accent/60 shadow-ds-accent/10'
                  }`}
                >
                  {/* Top Bar: Facility Name + Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-accent">
                      {b.facilityName || 'PLAYSTATION 5 ARENA'}
                    </span>
                    <Badge
                      variant={
                        countdown?.isOverdue
                          ? 'default'
                          : countdown?.isEndingSoon
                          ? 'warning'
                          : isSessionActive
                          ? 'accent'
                          : 'default'
                      }
                      size="sm"
                      className="font-mono text-[11px] uppercase tracking-wider"
                    >
                      {countdown?.isOverdue
                        ? '🚨 OVERDUE'
                        : countdown?.isEndingSoon
                        ? '⏳ ENDING SOON'
                        : isSessionActive
                        ? '🎮 IN SESSION'
                        : b.status}
                    </Badge>
                  </div>

                  {/* Title & Station Specs */}
                  <div className="mt-3">
                    <h3 className="text-2xl font-heading font-black text-ds-text">{b.stationName}</h3>
                    <p className="text-xs text-ds-text-muted mt-0.5">
                      {b.stationSpecs || 'Ultra-low latency 4K 120Hz display'}
                    </p>
                  </div>

                  {/* Active Session Inner Box (Exact Replica of Image 1) */}
                  {isSessionActive && countdown ? (
                    <div className="mt-5 p-4 rounded-xl bg-ds-dark/95 border border-ds-border space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-ds-text-dim block">Active Player</span>
                          <span className="text-base font-heading font-bold text-ds-text">
                            {b.customerName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-mono text-ds-text-dim block">Time Remaining</span>
                          <span
                            className={`text-xl font-mono font-black ${
                              countdown.isOverdue
                                ? 'text-rose-400 animate-pulse'
                                : countdown.isEndingSoon
                                ? 'text-amber-400'
                                : 'text-ds-ice'
                            }`}
                          >
                            {countdown.formatted}
                          </span>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-ds-surface overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            countdown.isOverdue
                              ? 'bg-rose-500'
                              : countdown.isEndingSoon
                              ? 'bg-amber-400'
                              : 'bg-ds-accent'
                          }`}
                          style={{ width: `${countdown.percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-ds-text-dim pt-1">
                        <span>Ref: {b.bookingRef}</span>
                        <span>
                          End: {new Date(scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-xl bg-ds-dark/60 border border-ds-border text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ds-text-dim">Player:</span>
                        <span className="font-bold text-ds-text">{b.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ds-text-dim">Time Window:</span>
                        <span className="font-mono text-ds-text">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary Operational Actions (Matching Image 1) */}
                  {isSessionActive && (
                    <div className="mt-5 pt-4 border-t border-ds-border/60 flex items-center justify-between gap-3">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => openExtendModal(b)}
                        className="flex-1 justify-center text-xs font-bold"
                      >
                        <PlusCircle className="w-4 h-4 mr-1.5" />
                        <span>Extend</span>
                      </Button>

                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => handleEndSession(b)}
                        className="flex-1 justify-center text-xs font-bold"
                      >
                        <Square className="w-4 h-4 mr-1.5" />
                        <span>End Session</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Additional Dossier Information */}
                <div className="p-4 rounded-xl bg-ds-dark/60 border border-ds-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ds-text-dim">Player Contact:</span>
                    <span className="font-mono text-ds-text">{b.customerPhone || b.customerEmail || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ds-text-dim">Booking Channel:</span>
                    <span className="font-semibold text-ds-ice">{b.bookedVia || (b.isWalkIn ? 'Desk Walk-in' : 'Online')}</span>
                  </div>
                  {b.staffName && (
                    <div className="flex justify-between items-center">
                      <span className="text-ds-text-dim">Desk Staff Collected:</span>
                      <span className="font-semibold text-emerald-400">{b.staffName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-ds-text-dim">Payment Info:</span>
                    <span className="font-bold text-ds-text">
                      ₹{(b.totalPricePaise / 100).toFixed(0)} ({b.paymentMethod || 'CASH'} • {b.paymentStatus})
                    </span>
                  </div>
                </div>

                {/* Quick Link Footer */}
                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/booking/confirmation/${b.bookingRef || b.id}`}
                    target="_blank"
                    className="text-xs text-ds-ice hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Customer Receipt / QR Pass</span>
                  </Link>

                  <Button variant="outline" size="sm" onClick={() => setSelectedBookingForGrid(null)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ─── EXTEND DURATION MODAL ─── */}
      <ExtendSessionModal
        isOpen={!!extendStation}
        onClose={() => setExtendStation(null)}
        station={extendStation}
        onSuccess={() => {
          setExtendStation(null);
          setSelectedBookingForGrid(null);
          loadBookings();
        }}
      />
    </div>
  );
}
