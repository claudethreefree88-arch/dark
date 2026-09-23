'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Calendar,
  Clock,
  Sparkles,
  QrCode,
  ArrowRight,
  TrendingUp,
  Award,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrBooking, setSelectedQrBooking] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/customer/bookings');
        const json = await res.json();
        if (json.success) {
          setBookings(json.data);
        }
      } catch (err) {
        console.error('Error fetching customer bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingBooking = bookings.find(
    (b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'IN_PROGRESS'
  );

  return (
    <div className="space-y-8">
      {/* ─── Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card glass className="p-5 border-ds-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              Total Sessions
            </span>
            <Gamepad2 className="w-5 h-5 text-ds-accent" />
          </div>
          <div className="text-3xl font-heading font-black text-ds-text mt-3">
            {bookings.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium block mt-1">
            Active Syndicate Member
          </span>
        </Card>

        <Card glass className="p-5 border-ds-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              Hours Logged
            </span>
            <Clock className="w-5 h-5 text-ds-ice" />
          </div>
          <div className="text-3xl font-heading font-black text-ds-text mt-3">
            {bookings.reduce((acc, b) => acc + (b.durationMinutes || 60) / 60, 0)}h
          </div>
          <span className="text-[11px] text-ds-text-muted font-medium block mt-1">
            Arena play time
          </span>
        </Card>

        <Card glass className="p-5 border-ds-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
              Syndicate Tier
            </span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-heading font-black text-amber-400 mt-3 uppercase">
            GLACIER ELITE
          </div>
          <span className="text-[11px] text-ds-accent font-medium block mt-1">
            Eligible for Happy Hour Perks
          </span>
        </Card>
      </div>

      {/* ─── Upcoming Session Hero Card ──────────────────────────── */}
      {upcomingBooking ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-ds-surface via-ds-surface to-ds-primary/20 border border-ds-accent/40 shadow-glow relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  Active / Upcoming Reservation
                </Badge>
                <span className="font-mono text-xs text-ds-text-dim">
                  Ref: {upcomingBooking.bookingRef}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-ds-text">
                {upcomingBooking.station?.name || 'PS5 Battle Station'}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-ds-text-muted">
                <span className="flex items-center gap-1.5 text-ds-text font-semibold">
                  <Calendar className="w-4 h-4 text-ds-accent" />
                  {upcomingBooking.date}
                </span>
                <span className="flex items-center gap-1.5 text-ds-text font-semibold">
                  <Clock className="w-4 h-4 text-ds-accent" />
                  {upcomingBooking.startTime} – {upcomingBooking.endTime} ({upcomingBooking.durationMinutes} mins)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="accent"
                onClick={() => setSelectedQrBooking(upcomingBooking)}
                className="justify-center shadow-glow-sm"
              >
                <QrCode className="w-4 h-4 mr-2" />
                View Check-in QR
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card glass className="p-8 text-center border-dashed border-ds-border space-y-4">
          <Gamepad2 className="w-12 h-12 text-ds-text-dim mx-auto" />
          <h3 className="text-lg font-heading font-bold text-ds-text">
            No Upcoming Sessions Scheduled
          </h3>
          <p className="text-xs text-ds-text-muted max-w-sm mx-auto">
            Ready to jump back into action? Reserve your favorite PS5 Pro station or pool table online with instant confirmation.
          </p>
          <Link href="/booking">
            <Button variant="accent" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> Book A Station Now
            </Button>
          </Link>
        </Card>
      )}

      {/* ─── Quick Actions & Bookings History ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-bold text-ds-text uppercase">
            Recent Reservations
          </h3>
          <Link
            href="/account/bookings"
            className="text-xs font-heading font-bold text-ds-ice hover:underline flex items-center gap-1"
          >
            <span>All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {bookings.slice(0, 3).map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-ds-surface/60 border border-ds-border hover:border-ds-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-ds-text text-sm sm:text-base">
                    {b.station?.name || 'Gaming Station'}
                  </span>
                  <Badge
                    variant={
                      b.status === 'CONFIRMED'
                        ? 'success'
                        : b.status === 'COMPLETED'
                        ? 'default'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {b.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-ds-text-dim font-mono">
                  <span>{b.bookingRef}</span>
                  <span>•</span>
                  <span>{b.date} ({b.startTime} - {b.endTime})</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="font-heading font-bold text-ds-ice text-base">
                  ₹{((b.totalPricePaise || 20000) / 100).toFixed(0)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQrBooking(b)}
                  className="text-xs"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" /> QR Pass
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── QR Code Modal ────────────────────────────────────────── */}
      {selectedQrBooking && (
        <Modal
          isOpen={!!selectedQrBooking}
          onClose={() => setSelectedQrBooking(null)}
          title="Digital Check-in Pass"
          size="sm"
        >
          <div className="text-center space-y-4 py-2">
            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-2 border-ds-accent">
              {/* High contrast QR code preview representation */}
              <div className="w-48 h-48 bg-black flex flex-col items-center justify-center p-2 rounded-lg text-white">
                <QrCode className="w-32 h-32 text-white" />
                <span className="font-mono text-[9px] text-gray-300 mt-1 truncate max-w-[180px]">
                  {selectedQrBooking.qrToken || selectedQrBooking.bookingRef}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-sm font-bold text-ds-text">
                {selectedQrBooking.bookingRef}
              </span>
              <p className="text-xs text-ds-text-muted">
                {selectedQrBooking.station?.name} • {selectedQrBooking.date}
              </p>
              <p className="text-[11px] text-ds-text-dim">
                Slot: {selectedQrBooking.startTime} – {selectedQrBooking.endTime}
              </p>
            </div>

            <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg">
              Show this QR code to staff at the venue desk to start your session.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
