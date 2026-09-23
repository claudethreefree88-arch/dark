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
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch =
      !search ||
      b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.stationName.toLowerCase().includes(search.toLowerCase()) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
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

        <Button variant="outline" size="sm" onClick={loadBookings}>
          <RotateCw className="w-4 h-4 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
          {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-ds-accent text-white shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search ref, customer, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8 w-56 sm:w-72"
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
