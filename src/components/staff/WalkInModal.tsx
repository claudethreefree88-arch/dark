'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Gamepad2, Banknote, CreditCard, Sparkles, QrCode, Copy, Check } from 'lucide-react';
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

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  PS5: { label: 'PlayStation 5', icon: '🎮' },
  POOL_TABLE: { label: 'Snooker & Pool', icon: '🎱' },
  PC: { label: 'PC Gaming', icon: '💻' },
  VR: { label: 'VR Arena', icon: '🥽' },
  OTHER: { label: 'Other Stations', icon: '🎯' },
};

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

  // Distinct category tabs ordered PS5 -> Snooker -> PC -> others
  const availableCategories = Array.from(
    new Set(stations.map((s) => s.stationType))
  ).sort((a, b) => {
    const order = ['PS5', 'POOL_TABLE', 'PC', 'VR', 'OTHER'];
    return (
      (order.indexOf(a) !== -1 ? order.indexOf(a) : 99) -
      (order.indexOf(b) !== -1 ? order.indexOf(b) : 99)
    );
  });

  const [activeCategory, setActiveCategory] = useState<string>(initialStation?.stationType || 'PS5');
  const [selectedStationId, setSelectedStationId] = useState<string>(initialStation?.id || '');
  const [selectedGameTitle, setSelectedGameTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const toast = useToast();

  // Admin QR & UPI Details
  const [adminQrUrl, setAdminQrUrl] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('darksyndicate@icici');
  const [upiPayeeName, setUpiPayeeName] = useState<string>('Dark Syndicate Gaming World');
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Synchronize preselected station and category when modal opens
  useEffect(() => {
    if (isOpen) {
      const target =
        stations.find((s) => s.id === preselectedStationId) ||
        stations.find((s) => s.status === 'AVAILABLE') ||
        stations[0];
      if (target) {
        setSelectedStationId(target.id);
        setActiveCategory(target.stationType);
      }
      setSelectedGameTitle('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
    }
  }, [isOpen, preselectedStationId, stations]);

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
  const categoryStations = stations.filter((s) => s.stationType === activeCategory);
  const isConsoleStation =
    selectedStation?.stationType === 'PS5' ||
    selectedStation?.stationType === 'PC' ||
    Boolean(selectedStation?.games && selectedStation.games.length > 0);

  const hourlyRate = selectedStation ? selectedStation.pricePerHourPaise : 15000;
  const totalFeePaise = Math.round(hourlyRate * (durationMinutes / 60));

  // Switch category and auto-select first available station
  const handleCategoryChange = (catKey: string) => {
    setActiveCategory(catKey);
    const firstAvailable =
      stations.find((s) => s.stationType === catKey && s.status === 'AVAILABLE') ||
      stations.find((s) => s.stationType === catKey);
    if (firstAvailable) {
      setSelectedStationId(firstAvailable.id);
    }
    setSelectedGameTitle('');
  };

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
          customerEmail: customerEmail.trim() || undefined,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Desk Walk-in Rapid Allocation"
      description="Quickly assign available gaming consoles and snooker tables to walk-in players."
      size="full"
    >
      <form onSubmit={handleSubmit} className="flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─── LEFT COLUMN: CATEGORY, STATION & GAME (7 COLS) ─── */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Category Switcher Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-black text-ds-ice uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">1</span>
                  <span>Select Arena Category</span>
                </label>
                <span className="text-[11px] font-mono text-ds-text-dim">
                  {stations.filter((s) => s.status === 'AVAILABLE').length} Available Consoles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableCategories.map((catKey) => {
                  const isSelected = activeCategory === catKey;
                  const count = stations.filter(
                    (s) => s.stationType === catKey && s.status === 'AVAILABLE'
                  ).length;
                  const totalCount = stations.filter((s) => s.stationType === catKey).length;
                  const meta = CATEGORY_META[catKey] || { label: catKey, icon: '🎯' };

                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => handleCategoryChange(catKey)}
                      className={`p-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'bg-ds-accent text-white border-ds-accent shadow-lg shadow-ds-accent/25 ring-1 ring-ds-accent'
                          : 'bg-ds-dark/80 border-ds-border text-ds-text-muted hover:text-white hover:border-ds-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-lg">{meta.icon}</span>
                        <span className="truncate">{meta.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ml-1.5 ${
                          isSelected ? 'bg-black/35 text-white font-bold' : 'bg-ds-surface text-ds-text-dim'
                        }`}
                      >
                        {count}/{totalCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Choose Station (1-click Cards) */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black text-ds-ice uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">2</span>
                <span>Choose {CATEGORY_META[activeCategory]?.label || 'Station'}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {categoryStations.map((st) => {
                  const isSelected = selectedStationId === st.id;
                  const isAvailable = st.status === 'AVAILABLE';

                  return (
                    <button
                      type="button"
                      key={st.id}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedStationId(st.id);
                        setSelectedGameTitle('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-ds-accent/20 border-ds-accent text-white ring-2 ring-ds-accent shadow-md shadow-ds-accent/20'
                          : isAvailable
                          ? 'bg-ds-dark/90 border-ds-border text-ds-text hover:border-ds-accent/60'
                          : 'bg-ds-surface/20 border-ds-border/40 text-ds-text-dim opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-heading font-bold text-xs truncate">{st.name}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono">
                        <span className="text-ds-ice font-bold">₹{(st.pricePerHourPaise / 100).toFixed(0)}/hr</span>
                        <span className={isAvailable ? 'text-emerald-400 text-[10px] font-bold uppercase' : 'text-rose-400 text-[10px]'}>
                          {isAvailable ? 'Ready' : 'Occupied'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Game Selection (Consoles Only — Automatically Hidden for Snooker/Pool) */}
            {isConsoleStation && (
              <div className="space-y-2.5 p-3.5 rounded-xl bg-ds-surface/50 border border-ds-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-black text-ds-text uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">3</span>
                    <Gamepad2 className="w-4 h-4 text-ds-accent" />
                    <span>Select Game To Play</span>
                    <span className="text-[10px] text-ds-text-dim normal-case font-normal">(optional)</span>
                  </label>
                  {selectedGameTitle && (
                    <button
                      type="button"
                      onClick={() => setSelectedGameTitle('')}
                      className="text-[11px] font-mono text-rose-400 hover:underline"
                    >
                      Clear choice
                    </button>
                  )}
                </div>

                {selectedStation?.games && selectedStation.games.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setSelectedGameTitle('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all border ${
                          !selectedGameTitle
                            ? 'bg-ds-surface border-ds-accent text-white ring-1 ring-ds-accent'
                            : 'bg-ds-dark/80 border-ds-border text-ds-text-muted hover:text-white'
                        }`}
                      >
                        🎮 Decide Later / Open Play
                      </button>

                      {selectedStation.games.map((g) => {
                        const isSelected = selectedGameTitle.toLowerCase() === g.title.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() => setSelectedGameTitle(isSelected ? '' : g.title)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-ds-accent text-white border-ds-accent shadow-md shadow-ds-accent/20'
                                : 'bg-ds-dark/90 border-ds-border text-ds-text-muted hover:text-white hover:border-ds-border/80'
                            }`}
                          >
                            <Gamepad2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-ds-accent'}`} />
                            <span>{g.title}</span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      placeholder="Or type other game title (e.g. Call of Duty, Mortal Kombat)..."
                      value={selectedGameTitle}
                      onChange={(e) => setSelectedGameTitle(e.target.value)}
                      className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-xs text-ds-text placeholder:text-ds-text-dim focus:border-ds-accent focus:outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Type game title (e.g. Tekken 8, FC 24)..."
                    value={selectedGameTitle}
                    onChange={(e) => setSelectedGameTitle(e.target.value)}
                    className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2.5 text-xs text-ds-text placeholder:text-ds-text-dim focus:border-ds-accent focus:outline-none"
                  />
                )}

                {selectedGameTitle && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Selected: <strong className="text-white font-semibold">{selectedGameTitle}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── RIGHT COLUMN: DURATION, CUSTOMER INFO, PAYMENT (5 COLS) ─── */}
          <div className="lg:col-span-5 space-y-4">
            {/* 4. Session Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black text-ds-ice uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">
                  {isConsoleStation ? '4' : '3'}
                </span>
                <span>Session Duration</span>
              </label>
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
                    className={`py-2.5 rounded-xl text-xs font-heading font-bold uppercase transition-all border ${
                      durationMinutes === d.min
                        ? 'bg-ds-accent text-white border-ds-accent shadow-md shadow-ds-accent/20 ring-1 ring-ds-accent'
                        : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Customer Details (Name, Phone, optional Email) */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black text-ds-ice uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">
                  {isConsoleStation ? '5' : '4'}
                </span>
                <span>Gamer Information</span>
              </label>
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-ds-text-muted block">Gamer Name *</span>
                    <Input
                      placeholder="e.g. Rahul Verma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-ds-text-muted block">WhatsApp Phone *</span>
                    <Input
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-ds-text-muted block">
                    Email ID <span className="text-ds-text-dim lowercase">(optional)</span>
                  </span>
                  <Input
                    type="email"
                    placeholder="gamer@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 6. Desk Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-black text-ds-ice uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-ds-accent/20 border border-ds-accent text-ds-accent text-[11px] flex items-center justify-center font-mono">
                  {isConsoleStation ? '6' : '5'}
                </span>
                <span>Desk Payment Received</span>
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

            {/* UPI QR Display if selected */}
            {paymentMethod === 'UPI' && (
              <div className="p-3.5 rounded-xl bg-ds-surface/80 border border-emerald-500/40 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-heading font-bold text-xs">
                    <QrCode className="w-4 h-4" />
                    <span>Scan & Pay via UPI</span>
                  </div>
                  <Badge variant="success" size="sm" className="font-mono text-[10px]">
                    Collect ₹{(totalFeePaise / 100).toFixed(0)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3.5 bg-ds-dark/90 p-2.5 rounded-xl border border-ds-border">
                  <div className="w-24 h-24 bg-white p-1.5 rounded-lg shadow-md shrink-0 flex items-center justify-center">
                    {displayQrCode ? (
                      <img
                        src={displayQrCode}
                        alt="Counter UPI QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Official Payee</span>
                    <span className="font-heading font-bold text-ds-text block truncate text-xs">
                      {upiPayeeName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="bg-ds-surface px-1.5 py-0.5 rounded text-ds-ice font-mono font-bold text-[10px] border border-ds-border truncate">
                        {upiId}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-[10px] font-mono text-ds-accent hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── BOTTOM ACTION STRIP (FULL WIDTH) ─── */}
        <div className="pt-4 mt-6 border-t border-ds-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="md" className="font-heading font-bold text-xs uppercase">
                {selectedStation?.name || 'No Station'}
              </Badge>
              {selectedGameTitle && (
                <Badge variant="default" size="md" className="font-mono text-xs text-ds-ice">
                  🎮 {selectedGameTitle}
                </Badge>
              )}
            </div>

            <div className="pl-3 border-l border-ds-border">
              <span className="text-[10px] uppercase font-mono text-ds-text-dim block">Total Collection</span>
              <span className="text-xl font-heading font-black text-ds-ice">
                ₹{(totalFeePaise / 100).toFixed(0)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="accent"
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 shadow-lg shadow-ds-accent/20"
            >
              {submitting ? 'Allocating Console...' : 'Confirm & Start Session'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
