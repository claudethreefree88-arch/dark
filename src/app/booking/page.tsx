'use client';

import React, { useState, useEffect, useTransition, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import {
  Gamepad2,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  ChevronLeft,
  Banknote,
  QrCode,
} from 'lucide-react';

interface Station {
  id: string;
  name: string;
  stationType: string;
  facilityName: string;
  pricePerHourPaise: number;
  specs: string;
  capacity: number;
  status: string;
  games?: string[];
  gameDetails?: any[];
}

interface TimeSlot {
  time: string;
  endTime: string;
  label: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  available: boolean;
  reason?: string;
}

const DURATION_OPTIONS = [
  { minutes: 60, label: '1 Hour', tag: 'Standard' },
  { minutes: 120, label: '2 Hours', tag: 'Popular' },
  { minutes: 180, label: '3 Hours', tag: '10% OFF' },
  { minutes: 240, label: '4 Hours', tag: 'Pro Grind' },
  { minutes: 360, label: '6 Hours', tag: 'LAN Pass' },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const preselectedStationId = searchParams.get('stationId') || '';

  // Wizard Step (1: Station, 2: Date & Time, 3: Gamer Info, 4: Payment)
  const [currentStep, setCurrentStep] = useState<number>(preselectedStationId ? 2 : 1);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('booking-stepper-header') || document.getElementById('booking-step-container');
        if (el) {
          const navOffset = 90;
          const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // Ensure scroll is restored to top on step transitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('booking-stepper-header') || document.getElementById('booking-step-container');
      if (el) {
        const navOffset = 90;
        const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }, [currentStep]);


  // Stations State
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Date & Duration State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Slots State
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotPeriod, setSlotPeriod] = useState<string>('ALL');

  // Gamer Info State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Payment & Coupon State
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
    description: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [paymentOption, setPaymentOption] = useState<'ONLINE' | 'COUNTER'>('ONLINE');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Auto-fill user information if logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(`${user.firstName} ${user.lastName}`.trim());
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Fetch stations on mount
  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetch('/api/facilities');
        const json = await res.json();
        const data = json.data || [];

        const allStations: Station[] = [];
        data.forEach((fac: any) => {
          (fac.stations || []).forEach((st: any) => {
            allStations.push({
              id: st.id,
              name: st.name,
              stationType: st.stationType,
              facilityName: fac.name,
              pricePerHourPaise: st.pricePerHourPaise,
              specs: st.specs || 'High-performance battle station',
              capacity: st.capacity || (st.stationType === 'PS5' ? 2 : 4),
              status: st.status,
              games: st.games || [],
              gameDetails: st.gameDetails || [],
            });
          });
        });

        setStations(allStations);

        if (preselectedStationId) {
          const matched = allStations.find((s) => s.id === preselectedStationId);
          if (matched) {
            setSelectedStation(matched);
            setSelectedZone(matched.stationType);
            setCurrentStep(2);
          }
        }
      } catch (err) {
        console.error('Failed to load stations:', err);
      }
    }
    loadStations();
  }, [preselectedStationId]);

  // Fetch slots whenever station, date, or duration changes
  useEffect(() => {
    if (!selectedStation) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/bookings/availability?stationId=${selectedStation?.id}&date=${selectedDate}&duration=${durationMinutes}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setSlots(json.data.slots || []);
          // Clear selected slot if it is no longer available in new response
          if (selectedSlot) {
            const stillValid = (json.data.slots || []).find(
              (s: TimeSlot) => s.time === selectedSlot.time && s.available
            );
            if (!stillValid) setSelectedSlot(null);
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedStation?.id, selectedDate, durationMinutes]);

  // Calculate dynamic hourly rate based on station and player count
  const getHourlyRatePaise = () => {
    if (!selectedStation) return 15000;
    const isPs5 =
      selectedStation.stationType === 'PS5' ||
      selectedStation.name.toUpperCase().includes('PS5');
    const isSnooker =
      selectedStation.stationType === 'POOL_TABLE' ||
      selectedStation.name.toUpperCase().includes('SNOOKER') ||
      selectedStation.name.toUpperCase().includes('POOL');

    if (isPs5) {
      if (playerCount === 1) return 15000; // Single player: ₹150/hr
      if (playerCount === 2) return 20000; // 2 players: ₹200/hr
      return 25000; // 3-4 players: ₹250/hr
    }

    if (isSnooker) {
      // Snooker: ₹250/hr for 1-4 players per table, +₹50 per person beyond 4
      if (playerCount <= 4) return 25000;
      return 25000 + (playerCount - 4) * 5000;
    }

    return selectedStation.pricePerHourPaise;
  };

  const hourlyRatePaise = getHourlyRatePaise();
  const hours = durationMinutes / 60;
  const subtotalPaise = Math.round(hourlyRatePaise * hours);

  // Multi-hour discount: 3+ hours gives 10%
  const multiHourDiscountPaise = durationMinutes >= 180 ? Math.round(subtotalPaise * 0.1) : 0;

  // Coupon discount
  const couponDiscountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;

  const totalDiscountPaise = multiHourDiscountPaise + couponDiscountPaise;
  const finalPricePaise = Math.max(0, subtotalPaise - totalDiscountPaise);

  // Handle Coupon Apply
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotalPaise,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAppliedCoupon({
          code: json.data.code,
          discountPaise: json.data.discountPaise,
          description: json.data.description || `${json.data.code} Applied`,
        });
        setCouponCode(json.data.code);
        toast.success(`Coupon ${json.data.code} applied! Saved ₹${(json.data.discountPaise / 100).toFixed(0)}`);
      } else {
        toast.error(json.error?.message || 'Invalid or expired coupon code');
      }
    } catch {
      toast.error('Failed to validate coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  // Generate date list for the next 14 days
  const dateList = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return { dateStr, dayName, dayNum, month };
  });

  // Filtered slots by period
  const filteredSlots = slots.filter((slot) => {
    if (slotPeriod === 'ALL') return true;
    return slot.period === slotPeriod;
  });

  // Handle Booking Submission
  const handleConfirmBooking = async () => {
    if (!selectedStation) {
      toast.error('Please select a gaming station');
      goToStep(1);
      return;
    }

    if (!selectedSlot) {
      toast.error('Please pick an available time slot');
      goToStep(2);
      return;
    }

    if (!customerName || !customerPhone) {
      toast.error('Please provide your name and WhatsApp phone number');
      goToStep(3);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Booking Record
      const bookingPayload = {
        stationId: selectedStation.id,
        date: selectedDate,
        startTime: selectedSlot.time,
        durationMinutes,
        playerCount,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone,
        notes: notes || undefined,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        payAtCounter: paymentOption === 'COUNTER',
        paymentMethod: paymentOption === 'COUNTER' ? 'CASH' : 'UPI',
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 409) {
          toast.error('This time slot was just booked by another player. Please select another slot.');
          setCurrentStep(2);
          // Refresh slots
          const reloadRes = await fetch(
            `/api/bookings/availability?stationId=${selectedStation.id}&date=${selectedDate}&duration=${durationMinutes}`
          );
          const reloadJson = await reloadRes.json();
          if (reloadJson.success) setSlots(reloadJson.data.slots || []);
        } else {
          toast.error(json.error?.message || 'Failed to create booking');
        }
        setSubmitting(false);
        return;
      }

      const booking = json.data;

      // 2. If Paying at Desk, redirect straight to confirmation pass
      if (paymentOption === 'COUNTER') {
        toast.success('Booking confirmed! Show your QR code at the reception desk.');
        router.push(`/booking/confirmation/${booking.id || booking.bookingRef}`);
        return;
      }

      // 3. Online Checkout Simulation / Razorpay
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amountPaise: booking.totalPricePaise,
          method: 'UPI',
        }),
      });

      const orderJson = await orderRes.json();
      const orderData = orderJson.data;

      // Complete online payment verification
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentId: orderData?.paymentId,
          gatewayOrderId: orderData?.orderId,
          gatewayPaymentId: `pay_mock_${Date.now().toString().slice(-8)}`,
          method: 'UPI',
          isMock: true,
        }),
      });

      const verifyJson = await verifyRes.json();

      if (verifyJson.success) {
        toast.success('Payment verified! Your session pass has been issued.');
        router.push(`/booking/confirmation/${booking.id || booking.bookingRef}`);
      } else {
        toast.error('Payment verification failed, please check with reception.');
        router.push(`/booking/confirmation/${booking.id || booking.bookingRef}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ds-darker text-ds-text flex flex-col selection:bg-ds-accent selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 sm:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/10 border border-ds-accent/30 text-ds-ice mb-3">
              <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
              <span>Real-Time Reservation Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight uppercase text-ds-text">
              Book Your <span className="text-ds-ice">Gaming Session</span>
            </h1>
            <p className="mt-3 text-ds-text-muted text-sm sm:text-base">
              Reserve your PS5 Pro arena or Championship Pool table in 4 simple steps. Instant confirmation & QR check-in pass.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div id="booking-stepper-header" className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
              {[
                { step: 1, title: 'Arena & Station', icon: Gamepad2 },
                { step: 2, title: 'Date & Slot', icon: CalendarIcon },
                { step: 3, title: 'Player Details', icon: UserIcon },
                { step: 4, title: 'Pass & Pay', icon: CreditCard },
              ].map(({ step, title, icon: Icon }) => {
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;

                return (
                  <button
                    key={step}
                    onClick={() => {
                      if (step < currentStep || (step === 2 && selectedStation)) {
                        goToStep(step);
                      }
                    }}
                    className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl transition-all duration-200 border ${
                      isActive
                        ? 'bg-ds-surface border-ds-accent text-ds-ice shadow-lg shadow-ds-accent/10'
                        : isCompleted
                        ? 'bg-ds-surface/50 border-emerald-500/50 text-emerald-400 cursor-pointer hover:border-emerald-400'
                        : 'bg-ds-surface/20 border-ds-border text-ds-text-dim cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1.5 transition-all ${
                        isActive
                          ? 'bg-ds-accent text-white shadow-md shadow-ds-accent/30'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-ds-border/40 text-ds-text-dim'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider">
                      Step {step}
                    </span>
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline truncate max-w-[120px]">
                      {title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wizard Step Content */}
          <div id="booking-step-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Form / Stepper Canvas */}
            <div className="lg:col-span-8 space-y-8 min-h-[640px]">
              {/* STEP 1: ARENA ZONE & STATION SELECTION */}
              {currentStep === 1 && (
                <Card glass className="p-6 sm:p-8 border-ds-border space-y-6 min-h-[600px] flex flex-col justify-between">
                  {/* ─── STAGE 1: ONLY SHOW ARENA ZONE IMAGE CARDS INITIALLY ─── */}
                  {!selectedZone ? (
                    <div className="space-y-6">
                      <div className="border-b border-ds-border pb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/15 border border-ds-accent/30 text-ds-ice mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
                          <span>Step 1: Choose Your Zone</span>
                        </div>
                        <h2 className="text-2xl font-heading font-black uppercase text-ds-text">
                          Choose Your Gaming Zone
                        </h2>
                        <p className="text-xs sm:text-sm text-ds-text-muted mt-1">
                          Tap an arena below to explore available gaming consoles and championship snooker tables.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. PlayStation 5 Arena Card */}
                        <div
                          onClick={() => {
                            setSelectedZone('PS5');
                            setSelectedStation(null);
                          }}
                          className="group relative rounded-2xl overflow-hidden border-2 border-ds-border hover:border-ds-accent transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-ds-accent/20 bg-ds-dark flex flex-col justify-between"
                        >
                          <div className="relative w-full h-52 sm:h-60 overflow-hidden">
                            <Image
                              src="/ps5-station.jpg"
                              alt="PlayStation 5 Gaming Station"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ds-dark via-ds-dark/40 to-transparent" />
                            <div className="absolute top-3 right-3">
                              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/90 text-white shadow-md backdrop-blur-sm">
                                {stations.filter((s) => s.stationType === 'PS5' && s.status === 'AVAILABLE').length} Consoles Ready
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🎮</span>
                                <h3 className="font-heading font-black text-lg text-ds-text uppercase group-hover:text-ds-ice transition-colors">
                                  PlayStation 5 Arena
                                </h3>
                              </div>
                              <span className="text-ds-ice font-mono font-bold text-xs bg-ds-surface px-2.5 py-1 rounded-lg border border-ds-border">
                                From ₹150/hr
                              </span>
                            </div>

                            <p className="text-xs text-ds-text-muted leading-relaxed">
                              Sony PS5 4K 120Hz OLED displays, DualSense wireless controllers, and top titles (FC 24, Tekken 8, Spider-Man 2, GTA V).
                            </p>

                            <div className="pt-2 flex items-center justify-between border-t border-ds-border/60">
                              <span className="text-[11px] font-mono text-ds-text-dim">Single, Duo & Squad</span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ds-ice group-hover:text-ds-accent group-hover:translate-x-1 transition-all">
                                <span>Explore PS5 Consoles</span>
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Snooker Lounge Card */}
                        <div
                          onClick={() => {
                            setSelectedZone('POOL_TABLE');
                            setSelectedStation(null);
                          }}
                          className="group relative rounded-2xl overflow-hidden border-2 border-ds-border hover:border-emerald-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 bg-ds-dark flex flex-col justify-between"
                        >
                          <div className="relative w-full h-52 sm:h-60 overflow-hidden">
                            <Image
                              src="/snooker-table.jpg"
                              alt="Championship Snooker Table"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-ds-dark via-ds-dark/40 to-transparent" />
                            <div className="absolute top-3 right-3">
                              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/90 text-white shadow-md backdrop-blur-sm">
                                {stations.filter((s) => s.stationType === 'POOL_TABLE' && s.status === 'AVAILABLE').length} Tables Ready
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl">🎱</span>
                                <h3 className="font-heading font-black text-lg text-ds-text uppercase group-hover:text-emerald-400 transition-colors">
                                  Snooker Lounge
                                </h3>
                              </div>
                              <span className="text-ds-ice font-mono font-bold text-xs bg-ds-surface px-2.5 py-1 rounded-lg border border-ds-border">
                                ₹250/hr (Table)
                              </span>
                            </div>

                            <p className="text-xs text-ds-text-muted leading-relaxed">
                              Full-size championship English snooker tables, shadowless canopy lighting, premium Ashwood cues & tournament Aramith balls.
                            </p>

                            <div className="pt-2 flex items-center justify-between border-t border-ds-border/60">
                              <span className="text-[11px] font-mono text-ds-text-dim">Up to 4 Players Included</span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-emerald-400 group-hover:translate-x-1 transition-all">
                                <span>Explore Snooker Tables</span>
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ─── STAGE 2: DISPLAY SPECIFIC STATIONS ONCE ZONE IS CLICKED ─── */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ds-border pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedZone(null);
                                setSelectedStation(null);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ds-ice hover:text-white bg-ds-surface px-2.5 py-1 rounded-lg border border-ds-border hover:border-ds-accent transition-colors"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>All Arenas</span>
                            </button>
                            <span className="text-ds-text-dim">•</span>
                            <span className="text-xs font-mono uppercase text-ds-accent font-bold">
                              {selectedZone === 'PS5' ? 'PlayStation 5' : 'Snooker & Pool'}
                            </span>
                          </div>
                          <h2 className="text-xl font-heading font-black uppercase text-ds-text">
                            {selectedZone === 'PS5'
                              ? 'Choose Your PlayStation 5 Station'
                              : 'Choose Your Snooker Table'}
                          </h2>
                          <p className="text-xs text-ds-text-muted mt-0.5">
                            Click a station to select it for your session.
                          </p>
                        </div>

                        {/* Quick Zone Toggle Pills */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZone('PS5');
                              setSelectedStation(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all border flex items-center gap-1.5 ${
                              selectedZone === 'PS5'
                                ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                                : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                            }`}
                          >
                            <span>🎮</span>
                            <span>PS5 Arena</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZone('POOL_TABLE');
                              setSelectedStation(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all border flex items-center gap-1.5 ${
                              selectedZone === 'POOL_TABLE'
                                ? 'bg-ds-accent text-white border-ds-accent shadow-sm'
                                : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:text-white'
                            }`}
                          >
                            <span>🎱</span>
                            <span>Snooker</span>
                          </button>
                        </div>
                      </div>

                      {/* Stations Grid for Selected Zone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stations
                          .filter((st) => st.stationType === selectedZone)
                          .map((station) => {
                            const isSelected = selectedStation?.id === station.id;
                            const isAvailable = station.status === 'AVAILABLE';

                            return (
                              <div
                                key={station.id}
                                onClick={() => {
                                  if (isAvailable) {
                                    setSelectedStation(station);
                                  } else {
                                    toast.error(`${station.name} is currently occupied`);
                                  }
                                }}
                                className={`rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden group ${
                                  isSelected
                                    ? 'bg-ds-surface border-ds-accent shadow-lg shadow-ds-accent/20 ring-2 ring-ds-accent'
                                    : isAvailable
                                    ? 'bg-ds-surface/50 border-ds-border hover:border-ds-accent/40 hover:bg-ds-surface/80'
                                    : 'bg-ds-surface/20 border-ds-border/40 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <div>
                                  {/* Station Image Banner */}
                                  <div className="relative w-full h-36 bg-ds-dark overflow-hidden">
                                    <Image
                                      src={station.stationType === 'PS5' ? '/ps5-station.jpg' : '/snooker-table.jpg'}
                                      alt={station.name}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-ds-surface via-transparent to-black/50" />
                                    <div className="absolute top-2.5 left-2.5">
                                      <Badge
                                        variant={isAvailable ? 'success' : 'warning'}
                                        size="sm"
                                        className="backdrop-blur-md shadow-md"
                                      >
                                        {isAvailable ? '🟢 Ready' : '🟡 In Use'}
                                      </Badge>
                                    </div>
                                    <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[10px] text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-mono">
                                      <span>{station.capacity} Max Players</span>
                                    </div>
                                  </div>

                                  <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-accent">
                                        {station.facilityName}
                                      </span>
                                      <span className="text-ds-ice font-bold text-xs">
                                        {station.stationType === 'PS5' ? 'From ₹150 / hr' : '₹250 / hr'}
                                      </span>
                                    </div>

                                    <h3 className="text-base font-heading font-extrabold text-ds-text group-hover:text-ds-ice transition-colors">
                                      {station.name}
                                    </h3>

                                    <div className="text-[11px] text-ds-text-dim px-2.5 py-1.5 rounded-lg bg-ds-dark/60 border border-ds-border/40">
                                      {station.stationType === 'PS5'
                                        ? 'Single: ₹150 · Duo: ₹200 · Squad: ₹250'
                                        : '3-4 players included · +₹50/extra player'}
                                    </div>

                                    {/* Available Games on Station (Consoles only) */}
                                    {station.games && station.games.length > 0 && (
                                      <div className="pt-2 border-t border-ds-border/40 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-accent flex items-center gap-1">
                                            <Gamepad2 className="w-3 h-3 text-ds-accent" />
                                            <span>Installed Games ({station.games.length}):</span>
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {station.games.slice(0, 3).map((g: string, i: number) => (
                                            <span
                                              key={i}
                                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-ds-dark border border-ds-border/70 text-ds-text-dim"
                                            >
                                              {g}
                                            </span>
                                          ))}
                                          {station.games.length > 3 && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-ds-accent/10 text-ds-ice border border-ds-accent/30">
                                              +{station.games.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="p-4 pt-0">
                                  <div className="pt-3 flex justify-end border-t border-ds-border/30">
                                    <span
                                      className={`text-xs font-semibold inline-flex items-center gap-1 ${
                                        isSelected ? 'text-ds-ice font-bold' : 'text-ds-text-dim'
                                      }`}
                                    >
                                      {isSelected ? 'Selected ✓' : 'Click to Select'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Bottom Navigation */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-ds-border mt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedZone(null);
                            setSelectedStation(null);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1.5" />
                          <span>Change Arena</span>
                        </Button>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          {selectedStation && (
                            <div className="text-right hidden sm:block">
                              <span className="text-[10px] text-ds-text-dim uppercase font-mono block">Selected</span>
                              <span className="text-xs font-bold text-ds-ice font-heading">{selectedStation.name}</span>
                            </div>
                          )}
                          <Button
                            variant="accent"
                            onClick={() => {
                              if (selectedStation) goToStep(2);
                              else toast.error('Please select a station or table to continue');
                            }}
                            disabled={!selectedStation}
                            className="w-full sm:w-auto px-6 py-2.5 shadow-lg shadow-ds-accent/20"
                          >
                            <span>Continue to Date & Slot</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* STEP 2: DATE, DURATION & TIME SLOT */}
              {currentStep === 2 && (
                <Card glass className="p-6 sm:p-8 border-ds-border space-y-8 min-h-[600px] flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-ds-border pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold uppercase text-ds-text">
                        2. Pick Date & Session Duration
                      </h2>
                      <p className="text-xs text-ds-text-muted mt-0.5">
                        Selected: <span className="text-ds-ice font-semibold">{selectedStation?.name}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => goToStep(1)}
                      className="text-xs text-ds-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      Change Station
                    </button>
                  </div>

                  {/* 1. Date Selector Carousel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-ds-accent" />
                          <span>Select Date (Next 14 Days)</span>
                        </label>
                        {selectedDate && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-ds-accent/10 text-ds-ice border border-ds-accent/25">
                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Navigation Chevrons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => scrollDates('left')}
                          className="w-7 h-7 rounded-lg border border-ds-border bg-ds-surface/80 hover:bg-ds-surface hover:border-ds-accent/60 text-ds-text-dim hover:text-ds-ice flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Previous dates"
                          aria-label="Previous dates"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollDates('right')}
                          className="w-7 h-7 rounded-lg border border-ds-border bg-ds-surface/80 hover:bg-ds-surface hover:border-ds-accent/60 text-ds-text-dim hover:text-ds-ice flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Next dates"
                          aria-label="Next dates"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={dateScrollRef}
                      onWheel={(e) => {
                        if (e.deltaY !== 0 && dateScrollRef.current) {
                          e.currentTarget.scrollLeft += e.deltaY;
                        }
                      }}
                      className="flex gap-2.5 overflow-x-auto py-1.5 scroll-smooth no-scrollbar select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {dateList.map((item) => {
                        const isSelected = selectedDate === item.dateStr;
                        return (
                          <button
                            key={item.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(item.dateStr)}
                            className={`flex-shrink-0 w-20 py-3 rounded-xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-ds-accent text-white border-ds-accent shadow-lg shadow-ds-accent/25 scale-[1.03] ring-2 ring-ds-accent/40 font-bold'
                                : 'bg-ds-surface/60 border-ds-border text-ds-text-muted hover:border-ds-accent/40 hover:text-white hover:bg-ds-surface'
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-ds-text-dim'}`}>
                              {item.dayName}
                            </span>
                            <span className="text-xl font-heading font-extrabold my-0.5">{item.dayNum}</span>
                            <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-white/90' : 'text-ds-text-muted'}`}>
                              {item.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                    {/* 2. Player Count Selector */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                        <span>Number of Players</span>
                        <span className="text-ds-ice font-semibold">
                          {selectedStation?.stationType === 'PS5'
                            ? playerCount === 1
                              ? '1 Player (₹150/hr)'
                              : playerCount === 2
                              ? '2 Players (₹200/hr)'
                              : '3-4 Players (₹250/hr)'
                            : playerCount <= 4
                            ? '3-4 Players (₹250/hr)'
                            : `${playerCount} Players (₹${250 + (playerCount - 4) * 50}/hr)`}
                        </span>
                      </div>
                      {selectedStation?.stationType === 'PS5' ? (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { count: 1, label: 'Single Player', rate: '₹150 / hr' },
                            { count: 2, label: 'Duo (2 Players)', rate: '₹200 / hr' },
                            { count: 4, label: 'Squad (3-4 Players)', rate: '₹250 / hr' },
                          ].map((opt) => (
                            <button
                              key={opt.count}
                              type="button"
                              onClick={() => setPlayerCount(opt.count)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                playerCount === opt.count
                                  ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-md'
                                  : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-heading font-bold">{opt.label}</div>
                              <span className="text-[10px] text-ds-accent block mt-0.5">{opt.rate}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { count: 4, label: '3-4 Players', rate: 'Standard Table (₹250/hr)' },
                            { count: 5, label: '5 Players', rate: '+₹50 extra (₹300/hr)' },
                            { count: 6, label: '6 Players', rate: '+₹100 extra (₹350/hr)' },
                            { count: 8, label: '7-8 Players', rate: '+₹150+ (₹400/hr)' },
                          ].map((opt) => (
                            <button
                              key={opt.count}
                              type="button"
                              onClick={() => setPlayerCount(opt.count)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                playerCount === opt.count
                                  ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-md'
                                  : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                              }`}
                            >
                              <div className="text-xs font-heading font-bold">{opt.label}</div>
                              <span className="text-[10px] text-ds-accent block mt-0.5">{opt.rate}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Duration Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                      Session Length
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {DURATION_OPTIONS.map((opt) => {
                        const isSelected = durationMinutes === opt.minutes;
                        return (
                          <button
                            key={opt.minutes}
                            onClick={() => setDurationMinutes(opt.minutes)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isSelected
                                ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-md'
                                : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                            }`}
                          >
                            <div className="text-sm font-heading font-bold">{opt.label}</div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded mt-1 inline-block ${
                                opt.tag.includes('OFF')
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : opt.tag.includes('Popular')
                                  ? 'bg-ds-accent/20 text-ds-ice'
                                  : 'bg-ds-border/40 text-ds-text-dim'
                              }`}
                            >
                              {opt.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Slot Matrix */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-2">
                        <Clock className="w-4 h-4 text-ds-accent" />
                        Available Starting Times
                      </label>

                      {/* Period Filter Tabs */}
                      <div className="flex gap-1 bg-ds-surface p-1 rounded-lg border border-ds-border text-[11px]">
                        {['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map((p) => (
                          <button
                            key={p}
                            onClick={() => setSlotPeriod(p)}
                            className={`px-2.5 py-1 rounded font-semibold transition-all uppercase ${
                              slotPeriod === p ? 'bg-ds-accent text-white' : 'text-ds-text-muted hover:text-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {loadingSlots ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-ds-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-ds-text-muted">Scanning real-time arena schedule...</span>
                      </div>
                    ) : filteredSlots.length === 0 ? (
                      <div className="p-8 text-center bg-ds-surface/30 rounded-xl border border-dashed border-ds-border text-xs text-ds-text-muted">
                        No available slots for the selected period. Please try a different date or period.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {filteredSlots.map((slot) => {
                          const isSelected = selectedSlot?.time === slot.time;

                          return (
                            <button
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'bg-ds-accent text-white border-ds-accent shadow-lg shadow-ds-accent/20 ring-2 ring-white/20'
                                  : slot.available
                                  ? 'bg-ds-surface border-ds-border text-ds-text hover:border-ds-accent/60 hover:text-ds-ice'
                                  : 'bg-ds-dark/40 border-ds-border/40 text-ds-text-dim opacity-40 cursor-not-allowed line-through'
                              }`}
                            >
                              <div className="text-sm font-heading font-extrabold">{slot.label}</div>
                              <span className="text-[10px] block opacity-80 mt-0.5">
                                {slot.available ? 'Available' : slot.reason || 'Booked'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-ds-border">
                    <Button
                      variant="outline"
                      onClick={() => goToStep(1)}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>Back to Stations</span>
                    </Button>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {selectedSlot && (
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-ds-text-dim uppercase font-mono block">Selected Time</span>
                          <span className="text-xs font-bold text-ds-ice font-heading">{selectedSlot.label}</span>
                        </div>
                      )}
                      <Button
                        variant="accent"
                        onClick={() => {
                          if (selectedSlot) goToStep(3);
                          else toast.error('Please pick an available time slot');
                        }}
                        disabled={!selectedSlot}
                        className="w-full sm:w-auto px-6 py-2.5 shadow-lg shadow-ds-accent/20"
                      >
                        <span>Proceed to Gamer Info</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* STEP 3: GAMER DETAILS */}
              {currentStep === 3 && (
                <Card glass className="p-6 sm:p-8 border-ds-border space-y-6 min-h-[600px] flex flex-col justify-between">
                  <div className="border-b border-ds-border pb-4">
                    <h2 className="text-xl font-heading font-bold uppercase text-ds-text">
                      3. Player Information
                    </h2>
                    <p className="text-xs text-ds-text-muted mt-0.5">
                      Your digital check-in pass and QR code will be registered under these details.
                    </p>
                  </div>

                  {isAuthenticated ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-heading font-bold">
                          {user?.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-heading font-bold text-ds-text">
                            Logged in as {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-ds-text-muted">{user?.email}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Verified Gamer
                      </Badge>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-ds-accent/10 border border-ds-accent/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-ds-text-muted">
                        <Info className="w-4 h-4 text-ds-accent flex-shrink-0" />
                        <span>Have an account? Sign in for loyalty perks and saved history.</span>
                      </div>
                      <Link
                        href="/login?redirect=/booking"
                        className="inline-flex items-center justify-center font-heading font-semibold tracking-wide rounded-lg px-3 py-1.5 text-xs border border-ds-border text-ds-text hover:border-ds-accent hover:text-ds-accent transition-all active:scale-[0.98] shrink-0"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-ds-text-muted uppercase">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="Alex Mercer"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-ds-text-muted uppercase">
                        WhatsApp Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-ds-text-muted uppercase">
                        Email Address (For Receipt & Pass)
                      </label>
                      <Input
                        type="email"
                        placeholder="alex@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-ds-text-muted uppercase">
                        Special Requests / Game Pre-install Note (Optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-text-dim text-sm focus:outline-none focus:border-ds-accent transition-colors"
                        placeholder="e.g. Please connect two DualSense controllers with Tekken 8 ready."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-ds-border">
                    <Button
                      variant="outline"
                      onClick={() => goToStep(2)}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>Back to Date & Slot</span>
                    </Button>

                    <Button
                      variant="accent"
                      onClick={() => {
                        if (!customerName || !customerPhone) {
                          toast.error('Please enter your full name and phone number');
                          return;
                        }
                        goToStep(4);
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 shadow-lg shadow-ds-accent/20"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 4: REVIEW & PAYMENT SELECTION */}
              {currentStep === 4 && (
                <Card glass className="p-6 sm:p-8 border-ds-border space-y-6 min-h-[600px] flex flex-col justify-between">
                  <div className="border-b border-ds-border pb-4">
                    <h2 className="text-xl font-heading font-bold uppercase text-ds-text">
                      4. Review & Confirm Booking
                    </h2>
                    <p className="text-xs text-ds-text-muted mt-0.5">
                      Choose your payment preference and finalize your spot.
                    </p>
                  </div>

                  {/* Payment Method Cards */}
                  <div className="space-y-3">
                    <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                      Select Payment Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setPaymentOption('ONLINE')}
                        className={`p-5 rounded-xl border cursor-pointer transition-all ${
                          paymentOption === 'ONLINE'
                            ? 'bg-ds-surface border-ds-accent ring-1 ring-ds-accent shadow-lg shadow-ds-accent/10'
                            : 'bg-ds-surface/50 border-ds-border hover:border-ds-accent/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-ds-ice" />
                            <span className="font-heading font-bold text-ds-text">Instant Online Pass</span>
                          </div>
                          <Badge variant="accent" size="sm">
                            Fast Track
                          </Badge>
                        </div>
                        <p className="text-xs text-ds-text-muted">
                          Pay instantly via UPI (GPay, PhonePe, Paytm), Card or Netbanking. Station is locked instantly.
                        </p>
                      </div>

                      <div
                        onClick={() => setPaymentOption('COUNTER')}
                        className={`p-5 rounded-xl border cursor-pointer transition-all ${
                          paymentOption === 'COUNTER'
                            ? 'bg-ds-surface border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10'
                            : 'bg-ds-surface/50 border-ds-border hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-emerald-400" />
                            <span className="font-heading font-bold text-ds-text">Pay at Reception Desk</span>
                          </div>
                          <Badge variant="outline" size="sm">
                            Cash / UPI
                          </Badge>
                        </div>
                        <p className="text-xs text-ds-text-muted">
                          Reserve now, pay in cash or UPI at the front desk when you arrive. Hold released 10 mins post-slot.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Policies */}
                  <div className="p-4 rounded-xl bg-ds-surface/40 border border-ds-border text-xs text-ds-text-dim space-y-2">
                    <div className="flex items-center gap-2 text-ds-text font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Syndicate Booking Guarantee</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Free cancellation up to 2 hours before your scheduled session.</li>
                      <li>Please arrive 5-10 minutes early to check in with your QR pass.</li>
                      <li>Extra controllers and refreshments are available on demand at the arena.</li>
                    </ul>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-ds-border">
                    <Button
                      variant="outline"
                      onClick={() => goToStep(3)}
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>Back to Gamer Info</span>
                    </Button>

                    <Button
                      variant="accent"
                      onClick={handleConfirmBooking}
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3 text-base shadow-lg shadow-ds-accent/25"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Issuing Your Pass...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{paymentOption === 'ONLINE' ? 'Pay & Confirm Pass' : 'Reserve & Pay at Desk'}</span>
                          <ArrowRight className="w-5 h-5 ml-1" />
                        </div>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Booking Receipt / Summary Sticky Card */}
            <div className="lg:col-span-4 space-y-6">
              <Card glass className="p-6 border-ds-border sticky top-24 space-y-6">
                <div className="flex items-center justify-between border-b border-ds-border pb-4">
                  <h3 className="text-lg font-heading font-bold uppercase text-ds-text">Order Summary</h3>
                  <Badge variant="outline" size="sm">
                    {durationMinutes / 60} Hour{durationMinutes > 60 ? 's' : ''}
                  </Badge>
                </div>

                {/* Selected Item Details */}
                <div className="space-y-4 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ds-accent">Station</p>
                      <p className="font-heading font-bold text-sm text-ds-text">
                        {selectedStation?.name || (selectedZone ? 'Choose a station on left' : 'Select a zone to begin')}
                      </p>
                      <p className="text-ds-text-dim text-[11px]">
                        {selectedStation?.facilityName || (selectedZone ? (selectedZone === 'PS5' ? 'PlayStation 5 Arena' : 'Snooker Lounge') : 'No Arena Selected')}
                      </p>
                    </div>
                    <Gamepad2 className="w-5 h-5 text-ds-ice mt-1" />
                  </div>

                  <div className="flex items-start justify-between pt-3 border-t border-ds-border/40">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ds-accent">Players</p>
                      <p className="font-heading font-bold text-sm text-ds-text">
                        {selectedStation?.stationType === 'PS5'
                          ? playerCount === 1
                            ? 'Single Player (1P)'
                            : playerCount === 2
                            ? 'Duo (2P)'
                            : 'Squad (3-4P)'
                          : playerCount <= 4
                          ? 'Up to 4 Players'
                          : `${playerCount} Players`}
                      </p>
                      <p className="text-ds-ice font-semibold text-[11px]">
                        ₹{(hourlyRatePaise / 100).toFixed(0)} / hr
                      </p>
                    </div>
                    <UserIcon className="w-5 h-5 text-ds-text-dim mt-1" />
                  </div>

                  <div className="flex items-start justify-between pt-3 border-t border-ds-border/40">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ds-accent">Date & Window</p>
                      <p className="font-heading font-bold text-ds-text">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                      </p>
                      <p className="text-ds-ice font-semibold text-[11px]">
                        {selectedSlot ? selectedSlot.label : 'Slot not chosen'}
                      </p>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-ds-text-dim mt-1" />
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-2 pt-3 border-t border-ds-border/40">
                  <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-ds-accent" />
                    Promo Code
                  </label>

                  {appliedCoupon ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-emerald-400">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-300/80">{appliedCoupon.description}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-rose-400 hover:underline text-[11px] font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. WELCOME10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="text-xs uppercase font-mono"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading}
                        className="text-xs"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  )}

                  {/* Promo quick buttons */}
                  {!appliedCoupon && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => handleApplyCoupon('WELCOME10')}
                        className="text-[10px] px-2 py-0.5 rounded bg-ds-border/50 text-ds-text-dim hover:text-ds-ice hover:bg-ds-border"
                      >
                        WELCOME10 (10% off)
                      </button>
                      <button
                        onClick={() => handleApplyCoupon('SYNDICATE20')}
                        className="text-[10px] px-2 py-0.5 rounded bg-ds-border/50 text-ds-text-dim hover:text-ds-ice hover:bg-ds-border"
                      >
                        SYNDICATE20 (20% off)
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Calculation Table */}
                <div className="space-y-2 pt-4 border-t border-ds-border text-xs">
                  <div className="flex justify-between text-ds-text-muted">
                    <span>
                      Base Hourly Rate (₹{(hourlyRatePaise / 100).toFixed(0)} × {hours} hr)
                    </span>
                    <span>₹{(subtotalPaise / 100).toFixed(0)}</span>
                  </div>

                  {multiHourDiscountPaise > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Multi-Hour Deal (10% off)</span>
                      <span>-₹{(multiHourDiscountPaise / 100).toFixed(0)}</span>
                    </div>
                  )}

                  {couponDiscountPaise > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount</span>
                      <span>-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-ds-text-dim text-[11px]">
                    <span>GST (Included)</span>
                    <span>18%</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-ds-border">
                    <span className="text-sm font-heading font-bold text-ds-text uppercase">Total Payable</span>
                    <div className="text-right">
                      <span className="text-2xl font-heading font-black text-ds-ice">
                        ₹{(finalPricePaise / 100).toFixed(0)}
                      </span>
                      <span className="text-[10px] text-ds-text-dim block">Taxes & Amenities Included</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ds-darker flex items-center justify-center text-ds-ice">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-ds-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-heading tracking-wider uppercase">Loading Syndicate Booking...</span>
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
