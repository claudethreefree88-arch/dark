'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Calendar,
  Search,
  ExternalLink,
  RotateCw,
  Globe,
  UserCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE' | 'DESK'>('ALL');
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
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onlineCount = bookings.filter((b) => !b.isWalkIn).length;
  const deskCount = bookings.filter((b) => b.isWalkIn).length;

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesChannel =
      channelFilter === 'ALL' ||
      (channelFilter === 'ONLINE' && !b.isWalkIn) ||
      (channelFilter === 'DESK' && b.isWalkIn);

    const matchesSearch =
      !search ||
      b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.stationName.toLowerCase().includes(search.toLowerCase()) ||
      (b.staffName && b.staffName.toLowerCase().includes(search.toLowerCase())) ||
      (b.channel && b.channel.toLowerCase().includes(search.toLowerCase())) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(search.toLowerCase())) ||
      (b.customerPhone && b.customerPhone.includes(search));

    return matchesStatus && matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
            All Reservations Ledger
          </h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Audit trail of online bookings, front-desk walk-ins, and session completions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-ds-surface border border-ds-border text-ds-text-muted">
              Total: <strong className="text-ds-text font-bold">{bookings.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              Online: <strong className="text-white font-bold">{onlineCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
              Desk: <strong className="text-white font-bold">{deskCount}</strong>
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={loadBookings}>
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Source / Channel Filter & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Tabs */}
          <div className="flex items-center gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all ${
                channelFilter === 'ALL'
                  ? 'bg-ds-surface-3 text-white shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setChannelFilter('ONLINE')}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all flex items-center gap-1.5 ${
                channelFilter === 'ONLINE'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Online ({onlineCount})</span>
            </button>
            <button
              onClick={() => setChannelFilter('DESK')}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all flex items-center gap-1.5 ${
                channelFilter === 'DESK'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3 text-amber-400" />
              <span>Desk ({deskCount})</span>
            </button>
          </div>

          <span className="hidden sm:inline-block w-px h-6 bg-ds-border" />

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
            {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-heading font-bold uppercase transition-all ${
                  statusFilter === st
                    ? 'bg-ds-accent text-white shadow-sm'
                    : 'text-ds-text-dim hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search ref, player, staff, station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8 w-full sm:w-72"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading reservations...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No reservations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Player Details</th>
                  <th className="py-3 px-4">Booked Via</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ds-ice">{b.bookingRef}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-ds-text">{b.customerName}</div>
                      <div className="text-[11px] text-ds-text-dim">{b.customerEmail || b.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.isWalkIn ? (
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 font-heading font-bold text-[10px] uppercase tracking-wider">
                            <UserCheck className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Desk Walk-in</span>
                          </div>
                          <div className="text-[11px] text-ds-text-muted mt-1 flex items-center gap-1">
                            <span className="text-[10px] text-ds-text-dim font-mono">Staff:</span>
                            <span className="font-semibold text-ds-ice truncate max-w-[140px]">
                              {b.staffName || 'Front Desk'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/25 text-sky-400 font-heading font-bold text-[10px] uppercase tracking-wider">
                            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>Online</span>
                          </div>
                          <div className="text-[10px] text-ds-text-dim mt-1 font-mono">
                            Customer Portal
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ds-text">{b.stationName}</div>
                      <div className="text-[10px] text-ds-accent">{b.facilityName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ds-text">
                      <div>
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] text-ds-text-dim">
                        {new Date(b.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-heading font-extrabold text-ds-text">
                      ₹{(b.totalPricePaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono block text-ds-text">{b.paymentMethod}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">{b.paymentStatus}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          b.status === 'CONFIRMED'
                            ? 'success'
                            : b.status === 'IN_PROGRESS'
                            ? 'accent'
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
                      <Link href={`/booking/confirmation/${b.bookingRef || b.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[11px] py-1 px-2.5">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          <span>Pass</span>
                        </Button>
                      </Link>
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
