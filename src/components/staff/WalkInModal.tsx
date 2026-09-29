'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Gamepad2, Banknote, UserPlus, CreditCard, Sparkles, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/components/ui/Toast';

interface StationGame {
  id: string;
  title: string;
  genre: string | null;
  coverImage: string | null;
  maxPlayers: number;
  isFeatured?: boolean;
}

interface Station {
  id: string;
  name: string;
  stationType: string;
  facilityName: string;
  pricePerHourPaise: number;
  status: string;
  games?: StationGame[];
}

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  preselectedStationId?: string;
  onSuccess: () => void;
}

export function WalkInModal({
  isOpen,
  onClose,
  stations,
  preselectedStationId,
  onSuccess,
}: WalkInModalProps) {
  const availableStations = stations.filter((s) => s.status === 'AVAILABLE');
  const initialStation =
    stations.find((s) => s.id === preselectedStationId) || availableStations[0] || stations[0];

  const [selectedStationId, setSelectedStationId] = useState<string>(initialStation?.id || '');
  const [selectedGameTitle, setSelectedGameTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  // Synchronize preselected station when modal opens
  useEffect(() => {
    if (isOpen) {
      const target =
        stations.find((s) => s.id === preselectedStationId) ||
        stations.find((s) => s.status === 'AVAILABLE') ||
        stations[0];
      if (target) {
        setSelectedStationId(target.id);
      }
      setSelectedGameTitle('');
    }
  }, [isOpen, preselectedStationId, stations]);

  // Admin QR & UPI Details
  const [adminQrUrl, setAdminQrUrl] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('darksyndicate@icici');
  const [upiPayeeName, setUpiPayeeName] = useState<string>('Dark Syndicate Gaming World');
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch Admin uploaded QR Code and UPI configuration
  useEffect(() => {
    let isMounted = true;
    fetch('/api/cms/public')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.data?.settings) {
          const s = json.data.settings;
          if (s.counter_upi_qr_url) setAdminQrUrl(s.counter_upi_qr_url);
          if (s.counter_upi_id) setUpiId(s.counter_upi_id);
          if (s.counter_upi_name) setUpiPayeeName(s.counter_upi_name);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const hourlyRate = selectedStation ? selectedStation.pricePerHourPaise : 20000;
  const totalFeePaise = Math.round(hourlyRate * (durationMinutes / 60));

  // Generate dynamic QR fallback if admin has not uploaded a static QR image
  useEffect(() => {
    if (paymentMethod === 'UPI' && !adminQrUrl) {
      const amount = (totalFeePaise / 100).toFixed(2);
      const stationName = selectedStation?.name || 'Walk-in Gaming';
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Walk-in ${stationName}`)}`;
      QRCode.toDataURL(upiUrl, {
        width: 220,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setDynamicQrUrl(url))
        .catch(() => {});
    }
  }, [paymentMethod, adminQrUrl, upiId, upiPayeeName, totalFeePaise, selectedStation?.name]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      toast.error('Please select a station');
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error('Please provide customer name and phone');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStationId,
          durationMinutes,
          customerName,
          customerPhone,
          paymentMethod,
          gameTitle: selectedGameTitle.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Walk-in session started for ${customerName}!`);
        onSuccess();
        onClose();
      } else {
        toast.error(json.error?.message || 'Failed to start session');
      }
    } catch {
      toast.error('Error allocating console');
    } finally {
      setSubmitting(false);
    }
  };

  const displayQrCode = adminQrUrl || dynamicQrUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desk Walk-in Rapid Allocation">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Station Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ds-text-muted uppercase">Select Gaming Station</label>
          <select
            value={selectedStationId}
            onChange={(e) => {
              setSelectedStationId(e.target.value);
              setSelectedGameTitle('');
            }}
            className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2.5 text-xs text-ds-text font-mono font-bold focus:border-ds-accent"
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id} disabled={st.status !== 'AVAILABLE'}>
                {st.name} — {st.facilityName} ({st.status}) • ₹{(st.pricePerHourPaise / 100).toFixed(0)}/hr
              </option>
            ))}
          </select>
        </div>

        {/* Game Selection (Optional) */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-ds-surface/50 border border-ds-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-ds-accent" />
              <span>Select Game To Play</span>
              <span className="text-[10px] text-ds-text-dim normal-case font-normal">(optional)</span>
            </label>
            {selectedGameTitle && (
              <button
                type="button"
                onClick={() => setSelectedGameTitle('')}
                className="text-[10px] font-mono text-rose-400 hover:underline"
              >
                Clear choice
              </button>
            )}
          </div>

          {selectedStation?.games && selectedStation.games.length > 0 ? (
            <div className="space-y-2.5">
              {/* Dropdown for installed titles */}
              <select
                value={selectedGameTitle}
                onChange={(e) => setSelectedGameTitle(e.target.value)}
                className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-xs text-ds-text font-heading font-semibold focus:border-ds-accent"
              >
                <option value="">-- Choose Installed Game (or leave open) --</option>
                {selectedStation.games.map((g) => (
                  <option key={g.id} value={g.title}>
                    🎮 {g.title} {g.genre ? `• ${g.genre}` : ''}
                  </option>
                ))}
              </select>

              {/* Quick 1-click pills for faster touch/mouse selection */}
              <div>
                <span className="text-[10px] uppercase font-mono text-ds-text-dim block mb-1.5">
                  Installed on this {selectedStation.stationType || 'console'} ({selectedStation.games.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedStation.games.map((g) => {
                    const isSelected = selectedGameTitle.toLowerCase() === g.title.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setSelectedGameTitle(isSelected ? '' : g.title)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                            : 'bg-ds-dark/90 border-ds-border text-ds-text-muted hover:text-white hover:border-ds-border/80'
                        }`}
                      >
                        <Gamepad2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-ds-accent'}`} />
                        <span>{g.title}</span>
                        {g.genre && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded ${
                              isSelected ? 'bg-black/30 text-white' : 'bg-ds-surface text-ds-text-dim'
                            }`}
                          >
                            {g.genre}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Game text input for unlisted titles */}
              <div className="pt-0.5">
                <input
                  type="text"
                  placeholder="Or type custom game title (e.g. Call of Duty, Mortal Kombat)..."
                  value={selectedGameTitle}
                  onChange={(e) => setSelectedGameTitle(e.target.value)}
                  className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-xs text-ds-text placeholder:text-ds-text-dim focus:border-ds-accent focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-ds-text-dim">
                No catalog games tagged to this console yet. You can manually enter what the player wants:
              </p>
              <input
                type="text"
                placeholder="e.g. Tekken 8, Mortal Kombat 1, EA Sports FC 24..."
                value={selectedGameTitle}
                onChange={(e) => setSelectedGameTitle(e.target.value)}
                className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-xs text-ds-text font-heading placeholder:text-ds-text-dim focus:border-ds-accent focus:outline-none"
              />
            </div>
          )}

          {selectedGameTitle && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Session Game: <strong className="text-white font-semibold">{selectedGameTitle}</strong></span>
            </div>
          )}
        </div>

        {/* Duration Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ds-text-muted uppercase">Session Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { min: 30, label: '30 Mins' },
              { min: 60, label: '1 Hour' },
              { min: 120, label: '2 Hours' },
              { min: 180, label: '3 Hours' },
            ].map((d) => (
              <button
                type="button"
                key={d.min}
                onClick={() => setDurationMinutes(d.min)}
                className={`py-2 rounded-xl text-xs font-heading font-bold uppercase transition-all border ${
                  durationMinutes === d.min
                    ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                    : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">Gamer Name</label>
            <Input
              placeholder="e.g. Rahul Verma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">WhatsApp Phone</label>
            <Input
              placeholder="9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Payment Received At Desk
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Cash Desk', icon: Banknote },
              { id: 'UPI', label: 'UPI / QR', icon: Sparkles },
              { id: 'CARD', label: 'POS Card', icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setPaymentMethod(id as any)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === id
                    ? 'bg-ds-surface border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                    : 'bg-ds-surface/40 border-ds-border text-ds-text-muted hover:border-ds-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-heading font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── UPI / QR CODE DISPLAY (When UPI / QR is selected) ─── */}
        {paymentMethod === 'UPI' && (
          <div className="p-4 rounded-xl bg-ds-surface/80 border border-emerald-500/40 space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 font-heading font-bold text-xs">
                <QrCode className="w-4 h-4" />
                <span>Scan & Pay via UPI</span>
              </div>
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                Collect ₹{(totalFeePaise / 100).toFixed(0)}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-ds-dark/90 p-3.5 rounded-xl border border-ds-border">
              {/* QR Code Container */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white p-2 rounded-xl shadow-lg border border-ds-border flex items-center justify-center shrink-0">
                {displayQrCode ? (
                  <img
                    src={displayQrCode}
                    alt="Official Counter UPI QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* UPI Payee Info & Instructions */}
              <div className="space-y-2 text-xs flex-1 w-full text-center sm:text-left">
                <div>
                  <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Official Payee</span>
                  <span className="font-heading font-bold text-ds-text block text-sm">
                    {upiPayeeName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-ds-text-dim block">UPI ID / VPA</span>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <code className="bg-ds-surface px-2 py-0.5 rounded text-ds-ice font-mono font-bold text-[11px] border border-ds-border">
                      {upiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-[10px] font-mono text-ds-accent hover:underline flex items-center gap-0.5"
                      title="Copy UPI ID"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-ds-text-muted pt-1">
                  Ask gamer to scan with <strong className="text-ds-text">GPay</strong>, <strong className="text-ds-text">PhonePe</strong>, or <strong className="text-ds-text">Paytm</strong> to start play.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Amount Total Pill */}
        <div className="p-4 rounded-xl bg-ds-dark border border-ds-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Amount to Collect</span>
            <span className="text-xl font-heading font-extrabold text-ds-ice">
              ₹{(totalFeePaise / 100).toFixed(0)}
            </span>
          </div>
          <Badge variant="success" size="sm">
            Instant Start
          </Badge>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="accent" type="submit" disabled={submitting}>
            {submitting ? 'Allocating Console...' : 'Confirm & Start Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
