'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function StaffBookingsSchedulePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

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
  }, []);

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

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (b.status === 'IN_PROGRESS' || b.status === 'CHECKED_IN')) ||
      (statusFilter === 'UPCOMING' && b.status === 'CONFIRMED') ||
      (statusFilter === 'COMPLETED' && b.status === 'COMPLETED');

    const matchesSearch =
      !searchQuery ||
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.stationName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
            Arena Daily Reservation Schedule
          </h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Monitor player check-ins, time slots, and equipment assignments in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBookings}>
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/staff">
            <Button variant="accent" size="sm">
              <span>Live Console Grid</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
          {[
            { id: 'ALL', label: 'All Today' },
            { id: 'ACTIVE', label: 'In Session / Checked In' },
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

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search ref, player, station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs py-1.5 pl-8 w-56 sm:w-72"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Schedule Table */}
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
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ds-ice">{b.bookingRef}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-ds-text">{b.customerName}</div>
                      <div className="text-[11px] text-ds-text-dim">{b.customerPhone || b.customerEmail || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-semibold text-ds-text">{b.stationName}</div>
                      <div className="text-[10px] text-ds-accent">{b.facilityName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ds-text">
                      <div>
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] text-ds-text-dim">{b.durationMinutes / 60} hr session</span>
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
                          b.status === 'IN_PROGRESS'
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
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                        <Link href={`/booking/confirmation/${b.bookingRef || b.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="text-[11px] py-1 px-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
