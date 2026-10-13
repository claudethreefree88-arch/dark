'use client';

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  Banknote,
  QrCode,
  Crown,
  X,
  Search,
} from 'lucide-react';
import { ARENA_GAMES, lookupGame, GameCatalogItem } from '@/lib/gameCatalog';

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
  gameDetails?: GameCatalogItem[];
}

interface TimeSlot {
  time: string;
  endTime: string;
  label: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  available: boolean;
  reason?: string;
  availableStationIds?: string[];
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

  // Streamlined 3-Step Flow:
  // Step 1: Experience & Schedule (Zone, Date, Players, Duration, Time Slot, Assigned Station)
  // Step 2: Player Information (Name, WhatsApp Phone, Email, Special Requests)
  // Step 3: Pass & Pay (Payment preference, Review & Finalize)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  const goToStep = (step: number) => {
    setIsSummaryOpen(false);
    setCurrentStep(step);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const el = document.getElementById('booking-stepper-header');
        if (el) {
          const navOffset = 85;
          const y = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // Stations & Zone State
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedZone, setSelectedZone] = useState<'PS5' | 'POOL_TABLE'>('PS5');
  const [isChangingStation, setIsChangingStation] = useState<boolean>(false);

  // Date, Duration & Players State
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

  // Gamer Info Validation State & Helpers
  const [formErrors, setFormErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }>({});
  const [formTouched, setFormTouched] = useState<{
    customerName?: boolean;
    customerPhone?: boolean;
    customerEmail?: boolean;
  }>({});

  const validateCustomerName = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return 'Name contains invalid characters';
    return undefined;
  };

  const validateCustomerPhone = (val: string): string | undefined => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) return 'WhatsApp phone number is required';
    const digits = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (digits.length !== 10) return 'Must be a 10-digit mobile number';
    if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8, or 9';
    return undefined;
  };

  const validateCustomerEmail = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return undefined; // Optional field
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  // Optional Game Pre-selection Modal
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showGameModal, setShowGameModal] = useState<boolean>(false);
  const [gameSearchQuery, setGameSearchQuery] = useState<string>('');

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

  // Fetch active user membership (if logged in)
  const [activeMembership, setActiveMembership] = useState<{
    planNameSnapshot: string;
    tierSnapshot: string;
    discountPercent: number;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setActiveMembership(null);
      return;
    }
    async function loadUserMembership() {
      try {
        const res = await fetch('/api/customer/membership');
        const json = await res.json();
        if (json.success && json.data?.activeMembership) {
          setActiveMembership(json.data.activeMembership);
        }
      } catch (err) {
        console.error('Failed to load user membership:', err);
      }
    }
    loadUserMembership();
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
            setSelectedZone(matched.stationType === 'POOL_TABLE' ? 'POOL_TABLE' : 'PS5');
            setPlayerCount(matched.stationType === 'POOL_TABLE' ? 4 : 1);
            return;
          }
        }

        // Default: pick first PS5 station
        const firstPs5 = allStations.find((s) => s.stationType === 'PS5' && s.status === 'AVAILABLE') || allStations[0];
        if (firstPs5) {
          setSelectedStation(firstPs5);
          setSelectedZone(firstPs5.stationType === 'POOL_TABLE' ? 'POOL_TABLE' : 'PS5');
        }
      } catch (err) {
        console.error('Failed to load stations:', err);
      }
    }
    loadStations();
  }, [preselectedStationId]);

  // Filter stations belonging to the selected zone
  const zoneStations = useMemo(() => {
    return stations.filter(
      (s) => s.stationType === selectedZone && s.status !== 'DEACTIVATED'
    );
  }, [stations, selectedZone]);

  // Fetch real-time slots whenever zone, date, or duration changes
  useEffect(() => {
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        // Query by zone so slots represent real-time aggregated availability of all stations in this zone
        const res = await fetch(
          `/api/bookings/availability?zone=${selectedZone}&date=${selectedDate}&duration=${durationMinutes}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          const fetchedSlots: TimeSlot[] = json.data.slots || [];
          setSlots(fetchedSlots);

          // Validate or re-sync selected slot
          if (selectedSlot) {
            const matchingSlot = fetchedSlots.find(
              (s) => s.time === selectedSlot.time && s.available
            );
            if (!matchingSlot) {
              setSelectedSlot(null);
            } else {
              setSelectedSlot(matchingSlot);
              // Ensure assigned station is valid for this slot
              if (
                matchingSlot.availableStationIds &&
                matchingSlot.availableStationIds.length > 0
              ) {
                if (
                  !selectedStation ||
                  !matchingSlot.availableStationIds.includes(selectedStation.id)
                ) {
                  const freeStation = stations.find(
                    (s) => s.id === matchingSlot.availableStationIds![0]
                  );
                  if (freeStation) setSelectedStation(freeStation);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedZone, selectedDate, durationMinutes, stations]);

  // Handle slot selection with smart station auto-assignment
  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);

    // Auto-assign first available station for this slot
    if (slot.availableStationIds && slot.availableStationIds.length > 0) {
      if (selectedStation && slot.availableStationIds.includes(selectedStation.id)) {
        // Current selected station is already free for this slot
        return;
      }
      const assigned = stations.find((s) => slot.availableStationIds!.includes(s.id));
      if (assigned) {
        setSelectedStation(assigned);
      }
    } else {
      // Fallback
      if (!selectedStation || selectedStation.stationType !== selectedZone) {
        const fallbackStation = zoneStations.find((s) => s.status === 'AVAILABLE') || zoneStations[0];
        if (fallbackStation) setSelectedStation(fallbackStation);
      }
    }
  };

  // Handle Zone Toggle
  const handleToggleZone = (newZone: 'PS5' | 'POOL_TABLE') => {
    if (newZone === selectedZone) return;
    setSelectedZone(newZone);
    setSelectedSlot(null);
    setIsChangingStation(false);
    setSelectedGame(null);

    const newZoneStations = stations.filter(
      (s) => s.stationType === newZone && s.status !== 'DEACTIVATED'
    );
    const defaultStation = newZoneStations.find((s) => s.status === 'AVAILABLE') || newZoneStations[0];
    if (defaultStation) setSelectedStation(defaultStation);

    if (newZone === 'PS5') {
      setPlayerCount(1);
    } else {
      setPlayerCount(4);
    }
  };

  // Resolved list of available games for current station
  const stationAvailableGames: GameCatalogItem[] = useMemo(() => {
    if (!selectedStation) return [];

    if (selectedStation.gameDetails && selectedStation.gameDetails.length > 0) {
      return selectedStation.gameDetails.map((g: any) => {
        const meta = lookupGame(g.title);
        return {
          slug: g.slug || meta?.slug || g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: g.title,
          platform: (g.platform || meta?.platform || selectedStation.stationType) as any,
          genre: g.genre || meta?.genre || 'Esports',
          description: g.description || meta?.description || 'Installed and ready to launch on this station.',
          coverImage:
            g.coverImage ||
            meta?.coverImage ||
            (selectedStation.stationType === 'PS5' ? '/ps5-station.jpg' : '/snooker-table.jpg'),
          maxPlayers: g.maxPlayers || meta?.maxPlayers || (selectedStation.stationType === 'PS5' ? 2 : 4),
        };
      });
    }

    if (selectedStation.games && selectedStation.games.length > 0) {
      return selectedStation.games.map((title) => {
        const meta = lookupGame(title);
        if (meta) return meta;
        return {
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          platform: selectedStation.stationType as any,
          genre: selectedStation.stationType === 'PS5' ? 'Console Game' : 'Billiards',
          description: 'Installed and fully optimized for low-latency tournament gameplay.',
          coverImage:
            selectedStation.stationType === 'PS5' ? '/ps5-station.jpg' : '/snooker-table.jpg',
          maxPlayers: selectedStation.stationType === 'PS5' ? 2 : 4,
        };
      });
    }

    return ARENA_GAMES.filter(
      (g) => g.platform === (selectedStation.stationType === 'PS5' ? 'PS5' : 'POOL_TABLE')
    );
  }, [selectedStation]);

  const displayedGames = useMemo(() => {
    if (!gameSearchQuery.trim()) return stationAvailableGames;
    const q = gameSearchQuery.toLowerCase();
    return stationAvailableGames.filter(
      (g) => g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q)
    );
  }, [stationAvailableGames, gameSearchQuery]);

  // Hourly Rate Calculation (Exact to venue illuminated rate board)
  const getHourlyRatePaise = () => {
    const isSnooker =
      selectedZone === 'POOL_TABLE' ||
      selectedStation?.stationType === 'POOL_TABLE' ||
      selectedStation?.name.toUpperCase().includes('SNOOKER') ||
      selectedStation?.name.toUpperCase().includes('POOL');

    if (isSnooker) {
      // Snooker: Flat ₹250/hr per table/frame (max 4 players) + ₹50/hr each extra
      if (playerCount <= 4) return 25000;
      return 25000 + (playerCount - 4) * 5000;
    }

    // PlayStation 5:
    if (playerCount === 1) return 15000; // Single Player: ₹150/hr
    if (playerCount === 2) return 20000; // Two Player: ₹200/hr
    return 25000; // Multi Player (3 & 4 Players): ₹250/hr
  };

  const hourlyRatePaise = getHourlyRatePaise();
  const hours = durationMinutes / 60;
  const subtotalPaise = Math.round(hourlyRatePaise * hours);

  // Multi-hour discount: 3+ hours gives 10%
  const multiHourDiscountPaise = durationMinutes >= 180 ? Math.round(subtotalPaise * 0.1) : 0;

  // Coupon discount
  const couponDiscountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;

  // Syndicate Member discount
  const membershipDiscountPercent = activeMembership?.discountPercent || 0;
  const membershipDiscountPaise =
    membershipDiscountPercent > 0
      ? Math.round((subtotalPaise * membershipDiscountPercent) / 100)
      : 0;

  const totalDiscountPaise = multiHourDiscountPaise + couponDiscountPaise + membershipDiscountPaise;
  const finalPricePaise = Math.max(0, subtotalPaise - totalDiscountPaise);

  // Coupon Handlers
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
        toast.success(
          `Coupon ${json.data.code} applied! Saved ₹${(json.data.discountPaise / 100).toFixed(0)}`
        );
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

  // Generate 14 days list
  const dateList = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const dayName =
      idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return { dateStr, dayName, dayNum, month };
  });

  // Filtered slots by period tab
  const filteredSlots = slots.filter((slot) => {
    if (slotPeriod === 'ALL') return true;
    return slot.period === slotPeriod;
  });

  // Handle Booking Submission
  const handleConfirmBooking = async () => {
    if (!selectedZone) {
      toast.error('Please select a gaming zone');
      goToStep(1);
      return;
    }

    if (!selectedSlot) {
      toast.error('Please pick an available time slot');
      goToStep(1);
      return;
    }

    if (!selectedStation) {
      toast.error('Please select a gaming station');
      goToStep(1);
      return;
    }

    const nameErr = validateCustomerName(customerName);
    const phoneErr = validateCustomerPhone(customerPhone);
    const emailErr = validateCustomerEmail(customerEmail);

    if (nameErr || phoneErr || emailErr) {
      setFormTouched({ customerName: true, customerPhone: true, customerEmail: true });
      setFormErrors({
        customerName: nameErr,
        customerPhone: phoneErr,
        customerEmail: emailErr,
      });
      toast.error(nameErr || phoneErr || emailErr || 'Please check your player details');
      goToStep(2);
      return;
    }

    const rawDigits = customerPhone.replace(/\D/g, '');
    const cleanPhone =
      rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;

    setSubmitting(true);
    try {
      const combinedNotes = [
        selectedGame ? `Requested Game: ${selectedGame}` : null,
        notes?.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      // Ensure the station being booked is 100% free for the chosen slot
      let targetStation = selectedStation;
      if (
        selectedSlot?.availableStationIds &&
        selectedSlot.availableStationIds.length > 0 &&
        !selectedSlot.availableStationIds.includes(targetStation.id)
      ) {
        const freeStation = stations.find((s) => selectedSlot.availableStationIds!.includes(s.id));
        if (freeStation) {
          targetStation = freeStation;
          setSelectedStation(freeStation);
        }
      }

      const bookingPayload = {
        stationId: targetStation.id,
        date: selectedDate,
        startTime: selectedSlot.time,
        durationMinutes,
        playerCount,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: cleanPhone,
        gameTitle: selectedGame || undefined,
        notes: combinedNotes || undefined,
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
          toast.error(
            json.error?.message ||
              'This slot was just booked by another player. Please pick another available time slot.'
          );
          goToStep(1);
          // Refresh real-time slots
          const reloadRes = await fetch(
            `/api/bookings/availability?zone=${selectedZone}&date=${selectedDate}&duration=${durationMinutes}`
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

      // Desk Payment: redirect straight to confirmation pass
      if (paymentOption === 'COUNTER') {
        toast.success('Booking confirmed! Show your QR code at the reception desk.');
        router.push(`/booking/confirmation/${booking.id || booking.bookingRef}`);
        return;
      }

      // Online UPI Pass
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
        toast.error('Payment verification completed with desk hold.');
        router.push(`/booking/confirmation/${booking.id || booking.bookingRef}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile Sticky Navigation Handlers
  const isMobileBackDisabled = currentStep === 1 || submitting;

  const handleMobileBack = () => {
    setIsSummaryOpen(false);
    if (currentStep === 1) return;
    goToStep(currentStep - 1);
  };

  const handleMobileContinue = () => {
    setIsSummaryOpen(false);
    if (currentStep === 1) {
      if (!selectedSlot) {
        toast.error('Please pick an available time slot to continue');
        return;
      }
      goToStep(2);
      return;
    }
    if (currentStep === 2) {
      const nameErr = validateCustomerName(customerName);
      const phoneErr = validateCustomerPhone(customerPhone);
      const emailErr = validateCustomerEmail(customerEmail);

      setFormTouched({ customerName: true, customerPhone: true, customerEmail: true });
      setFormErrors({
        customerName: nameErr,
        customerPhone: phoneErr,
        customerEmail: emailErr,
      });

      if (nameErr || phoneErr || emailErr) {
        toast.error(nameErr || phoneErr || emailErr || 'Please check your player details');
        return;
      }
      goToStep(3);
      return;
    }
    if (currentStep === 3) {
      handleConfirmBooking();
      return;
    }
  };

  const getMobileContinueText = () => {
    if (submitting) return 'Processing...';
    if (currentStep === 1) return selectedSlot ? 'Player Details' : 'Pick a Slot';
    if (currentStep === 2) return 'Proceed to Checkout';
    if (currentStep === 3) {
      return paymentOption === 'ONLINE'
        ? `Pay ₹${(finalPricePaise / 100).toFixed(0)}`
        : 'Reserve Desk';
    }
    return 'Continue';
  };

  return (
    <div className="min-h-screen bg-ds-darker text-ds-text flex flex-col selection:bg-ds-accent selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-32 pb-36 lg:pb-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/10 border border-ds-accent/30 text-ds-ice mb-2 sm:mb-3">
              <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
              <span>Real-Time Reservation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight uppercase text-ds-text">
              Book Your <span className="text-ds-ice">Gaming Session</span>
            </h1>
            <p className="mt-2 sm:mt-3 text-ds-text-muted text-xs sm:text-sm md:text-base leading-relaxed">
              Reserve your PS5 Pro arena or Championship Pool table in 3 streamlined steps. Guaranteed instant station lock & digital QR pass.
            </p>
          </div>

          {/* Stepper Progress Bar (Clean 3-Step Industry Standard) */}
          <div id="booking-stepper-header" className="max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 relative">
              {[
                { step: 1, title: 'Experience & Schedule', icon: Gamepad2 },
                { step: 2, title: 'Player Details', icon: UserIcon },
                { step: 3, title: 'Pass & Pay', icon: CreditCard },
              ].map(({ step, title, icon: Icon }) => {
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;

                return (
                  <button
                    key={step}
                    onClick={() => {
                      if (step < currentStep) {
                        goToStep(step);
                      } else if (step === 2 && selectedSlot) {
                        goToStep(2);
                      } else if (
                        step === 3 &&
                        selectedSlot &&
                        !validateCustomerName(customerName) &&
                        !validateCustomerPhone(customerPhone)
                      ) {
                        goToStep(3);
                      }
                    }}
                    className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl transition-all duration-200 border cursor-pointer ${
                      isActive
                        ? 'bg-ds-surface border-ds-accent text-ds-ice shadow-lg shadow-ds-accent/10 ring-1 ring-ds-accent/40'
                        : isCompleted
                        ? 'bg-ds-surface/50 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
                        : 'bg-ds-surface/20 border-ds-border text-ds-text-dim cursor-not-allowed opacity-75'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-1 transition-all ${
                        isActive
                          ? 'bg-ds-accent text-white shadow-md shadow-ds-accent/30'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-ds-border/40 text-ds-text-dim'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider">
                      Step {step}
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium truncate max-w-[90px] sm:max-w-none">
                      {title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Wizard Canvas */}
          <div id="booking-step-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Selection Panels */}
            <div className="lg:col-span-8 space-y-8 min-h-[640px]">
              {/* STEP 1: EXPERIENCE & SCHEDULE (UNIFIED) */}
              {currentStep === 1 && (
                <Card
                  glass
                  className="p-4 sm:p-6 md:p-8 border-ds-border space-y-6 sm:space-y-8 min-h-[580px] flex flex-col justify-between"
                >
                  <div className="space-y-6 sm:space-y-7">
                    {/* Step Title Header */}
                    <div className="border-b border-ds-border pb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/15 border border-ds-accent/30 text-ds-ice mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
                        <span>Step 1 of 3: Experience & Schedule</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-heading font-black uppercase text-ds-text">
                        Choose Zone, Time & Station
                      </h2>
                      <p className="text-xs text-ds-text-muted mt-0.5">
                        Pick your arena, select date and duration, and reserve an available time slot.
                      </p>
                    </div>

                    {/* 1. Zone Toggle Switcher (Top of Step 1) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                          Select Gaming Zone
                        </span>
                        <span className="text-[11px] text-ds-ice font-mono font-medium">
                          {selectedZone === 'PS5' ? 'PlayStation 5 Pro Arena' : 'Championship Snooker Lounge'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option A: PS5 Arena */}
                        <button
                          type="button"
                          onClick={() => handleToggleZone('PS5')}
                          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                            selectedZone === 'PS5'
                              ? 'bg-ds-surface border-ds-accent text-ds-ice ring-2 ring-ds-accent/40 shadow-lg shadow-ds-accent/15'
                              : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-ds-accent/15 border border-ds-accent/30 flex items-center justify-center text-xl shrink-0">
                                🎮
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-heading font-black text-sm sm:text-base text-ds-text uppercase whitespace-nowrap">
                                    PlayStation 5
                                  </h4>
                                  {selectedZone === 'PS5' && (
                                    <Badge variant="accent" size="sm" className="text-[9px] py-0 px-1.5 shrink-0">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className="font-mono font-bold text-[11px] sm:text-xs text-ds-ice bg-ds-dark/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-ds-border/60 whitespace-nowrap inline-block">
                                From ₹150/hr
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-ds-border/40 flex items-center justify-between text-[11px] text-ds-text-dim w-full">
                            <span className="truncate">4K 120Hz OLED Displays • DualSense Edge</span>
                          </div>
                        </button>

                        {/* Option B: Snooker Lounge */}
                        <button
                          type="button"
                          onClick={() => handleToggleZone('POOL_TABLE')}
                          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                            selectedZone === 'POOL_TABLE'
                              ? 'bg-ds-surface border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/15'
                              : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                                🎱
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-heading font-black text-sm sm:text-base text-ds-text uppercase whitespace-nowrap">
                                    Snooker Lounge
                                  </h4>
                                  {selectedZone === 'POOL_TABLE' && (
                                    <Badge variant="success" size="sm" className="text-[9px] py-0 px-1.5 shrink-0">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className="font-mono font-bold text-[11px] sm:text-xs text-emerald-400 bg-ds-dark/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-ds-border/60 whitespace-nowrap inline-block">
                                ₹250/hr Table
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-ds-border/40 flex items-center justify-between text-[11px] text-ds-text-dim w-full">
                            <span className="truncate">Championship Slate Tables • Premium Cues</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. Date Selection Carousel */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-ds-accent" />
                          <span>Choose Date</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => scrollDates('left')}
                            className="p-1 rounded-lg bg-ds-surface border border-ds-border hover:border-ds-accent text-ds-text-muted hover:text-white transition-colors"
                            aria-label="Scroll dates left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollDates('right')}
                            className="p-1 rounded-lg bg-ds-surface border border-ds-border hover:border-ds-accent text-ds-text-muted hover:text-white transition-colors"
                            aria-label="Scroll dates right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div
                        ref={dateScrollRef}
                        className="flex gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pb-1"
                      >
                        {dateList.map(({ dateStr, dayName, dayNum, month }) => {
                          const isSelected = selectedDate === dateStr;
                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setSelectedSlot(null);
                              }}
                              className={`shrink-0 w-16 sm:w-20 p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-md shadow-ds-accent/20'
                                  : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                              }`}
                            >
                              <span className="text-[10px] font-mono uppercase block">{dayName}</span>
                              <span className="text-base sm:text-lg font-heading font-black block my-0.5">
                                {dayNum}
                              </span>
                              <span className="text-[10px] text-ds-text-dim uppercase block">{month}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Player Count & Duration Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Player Count */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-ds-accent" />
                            <span>Players</span>
                          </label>
                          <span className="text-[11px] font-mono font-bold text-ds-accent">
                            {selectedZone === 'PS5'
                              ? playerCount === 1
                                ? 'Single (₹150/hr)'
                                : playerCount === 2
                                ? 'Two Players (₹200/hr)'
                                : 'Multi 3-4P (₹250/hr)'
                              : 'Per Frame Max 4P (₹250/hr)'}
                          </span>
                        </div>

                        {selectedZone === 'PS5' ? (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { count: 1, label: 'Single', sub: '1 Player', rate: '₹150/hr' },
                              { count: 2, label: 'Two Player', sub: '2 Players', rate: '₹200/hr' },
                              { count: 4, label: 'Squad', sub: '3-4 Players', rate: '₹250/hr' },
                            ].map((opt) => (
                              <button
                                key={opt.count}
                                type="button"
                                onClick={() => setPlayerCount(opt.count)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  playerCount === opt.count
                                    ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-sm'
                                    : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                                }`}
                              >
                                <div className="text-xs font-heading font-bold">{opt.label}</div>
                                <span className="text-[10px] text-ds-text-dim block mt-0.5">{opt.sub}</span>
                                <span className="text-[10px] text-ds-accent font-mono font-bold block mt-1">
                                  {opt.rate}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { count: 1, label: 'Practice', sub: 'Solo', rate: '₹250/hr' },
                              { count: 2, label: '1v1 Duel', sub: '2 Players', rate: '₹250/hr' },
                              { count: 4, label: 'Per Frame', sub: 'Up to 4P', rate: '₹250/hr' },
                            ].map((opt) => (
                              <button
                                key={opt.count}
                                type="button"
                                onClick={() => setPlayerCount(opt.count)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  playerCount === opt.count
                                    ? 'bg-ds-surface border-emerald-500 text-emerald-400 ring-1 ring-emerald-500 shadow-sm'
                                    : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                                }`}
                              >
                                <div className="text-xs font-heading font-bold">{opt.label}</div>
                                <span className="text-[10px] text-ds-text-dim block mt-0.5">{opt.sub}</span>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-1">
                                  {opt.rate}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Session Duration */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ds-accent" />
                          <span>Session Length</span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                          {DURATION_OPTIONS.map((opt) => {
                            const isSelected = durationMinutes === opt.minutes;
                            return (
                              <button
                                key={opt.minutes}
                                type="button"
                                onClick={() => setDurationMinutes(opt.minutes)}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-ds-surface border-ds-accent text-ds-ice ring-1 ring-ds-accent shadow-sm'
                                    : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:border-ds-border hover:text-white'
                                }`}
                              >
                                <div className="text-xs font-heading font-bold">{opt.label}</div>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${
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
                    </div>

                    {/* 4. Real-Time Slot Matrix */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim flex items-center gap-2">
                          <Clock className="w-4 h-4 text-ds-accent" />
                          <span>Available Starting Times</span>
                        </label>

                        {/* Period Filter Tabs */}
                        <div className="flex gap-1 bg-ds-surface p-1 rounded-lg border border-ds-border text-[11px] overflow-x-auto no-scrollbar max-w-full">
                          {['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSlotPeriod(p)}
                              className={`px-2.5 py-1 rounded font-semibold transition-all uppercase whitespace-nowrap ${
                                slotPeriod === p
                                  ? 'bg-ds-accent text-white shadow-sm'
                                  : 'text-ds-text-muted hover:text-white'
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
                          <span className="text-xs text-ds-text-muted">
                            Scanning real-time arena schedule for {selectedZone === 'PS5' ? 'PS5 consoles' : 'Snooker tables'}...
                          </span>
                        </div>
                      ) : filteredSlots.length === 0 ? (
                        <div className="p-8 text-center bg-ds-surface/30 rounded-xl border border-dashed border-ds-border text-xs text-ds-text-muted">
                          No available slots for the selected period. Please try a different date or period.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                          {filteredSlots.map((slot) => {
                            const isSelected = selectedSlot?.time === slot.time;
                            const freeCount = slot.availableStationIds?.length || 0;

                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => handleSelectSlot(slot)}
                                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-ds-accent text-white border-ds-accent shadow-lg shadow-ds-accent/20 ring-2 ring-white/20'
                                    : slot.available
                                    ? 'bg-ds-surface border-ds-border text-ds-text hover:border-ds-accent/60 hover:text-ds-ice active:scale-95'
                                    : 'bg-ds-dark/40 border-ds-border/40 text-ds-text-dim opacity-40 cursor-not-allowed line-through'
                                }`}
                              >
                                <div className="text-sm font-heading font-extrabold">{slot.label}</div>
                                <span className="text-[10px] block opacity-85 mt-0.5">
                                  {slot.available
                                    ? freeCount > 1
                                      ? `${freeCount} Stations Free`
                                      : 'Available'
                                    : slot.reason || 'Booked'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 5. Assigned Station with Minimal Station Switcher */}
                    <div className="rounded-xl border border-ds-border bg-ds-surface/60 p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-ds-accent/15 border border-ds-accent/30 flex items-center justify-center text-xl shrink-0">
                            {selectedZone === 'PS5' ? '🎮' : '🎱'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-ds-text-dim">
                                Assigned Station
                              </span>
                              <Badge variant="success" size="sm" className="text-[9px] py-0 px-1.5">
                                Guaranteed Free
                              </Badge>
                            </div>
                            <p className="font-heading font-black text-base sm:text-lg text-ds-text">
                              {selectedStation?.name || 'Auto-assigning Station...'}
                            </p>
                            <p className="text-xs text-ds-text-dim">
                              {selectedStation?.specs ||
                                (selectedZone === 'PS5'
                                  ? '4K 120Hz OLED Display • Low Latency'
                                  : 'Tournament Slate Bed • Premium Cues')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                          {selectedZone === 'PS5' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowGameModal(true)}
                              className="text-xs py-1.5 px-3"
                            >
                              <Gamepad2 className="w-3.5 h-3.5 mr-1 text-ds-cyan" />
                              <span>{selectedGame ? selectedGame : 'Pre-load Game (Optional)'}</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsChangingStation((prev) => !prev)}
                            className="text-xs py-1.5 px-3 border border-ds-border hover:border-ds-accent"
                          >
                            <span>{isChangingStation ? 'Hide Stations' : 'Change Station'}</span>
                            {isChangingStation ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-1" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expandable Station Switcher Grid */}
                      {isChangingStation && (
                        <div className="pt-3 border-t border-ds-border/60 animate-in fade-in duration-200">
                          <p className="text-[11px] text-ds-text-dim mb-2.5">
                            Choose your preferred station in {selectedZone === 'PS5' ? 'PlayStation 5 Arena' : 'Snooker Lounge'}:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {zoneStations.map((station) => {
                              const isSelected = selectedStation?.id === station.id;
                              const isAvailableForSlot = selectedSlot?.availableStationIds
                                ? selectedSlot.availableStationIds.includes(station.id)
                                : station.status === 'AVAILABLE';

                              return (
                                <button
                                  key={station.id}
                                  type="button"
                                  disabled={!isAvailableForSlot}
                                  onClick={() => {
                                    setSelectedStation(station);
                                    setIsChangingStation(false);
                                    toast.success(`Assigned to ${station.name}`);
                                  }}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? 'bg-ds-surface border-ds-accent ring-1 ring-ds-accent text-ds-ice shadow-md'
                                      : isAvailableForSlot
                                      ? 'bg-ds-surface/40 border-ds-border hover:border-ds-accent/60 text-ds-text hover:bg-ds-surface/80'
                                      : 'bg-ds-dark/40 border-ds-border/30 opacity-40 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-heading font-bold text-xs truncate max-w-[140px]">
                                      {station.name}
                                    </span>
                                    <Badge
                                      variant={isSelected ? 'accent' : isAvailableForSlot ? 'success' : 'outline'}
                                      size="sm"
                                      className="text-[9px] py-0 px-1.5"
                                    >
                                      {isSelected ? 'Selected ✓' : isAvailableForSlot ? 'Free' : 'In Use'}
                                    </Badge>
                                  </div>
                                  <span className="text-[10px] text-ds-text-dim block mt-1 truncate">
                                    {station.specs}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Desktop Bottom Navigation */}
                  <div className="space-y-3 pt-4 border-t border-ds-border mt-4">
                    {selectedSlot && (
                      <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-ds-surface/50 border border-ds-border/60">
                        <span className="text-[10px] text-ds-text-dim uppercase font-mono">
                          Selected Slot & Station
                        </span>
                        <span className="text-xs font-bold text-ds-ice font-heading">
                          {selectedStation?.name} • {selectedSlot.label}
                        </span>
                      </div>
                    )}

                    <div className="hidden lg:flex items-center gap-2 sm:gap-3 w-full justify-end">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => {
                          if (selectedSlot) goToStep(2);
                          else toast.error('Please pick an available time slot');
                        }}
                        disabled={!selectedSlot}
                        className="text-xs sm:text-sm py-2 px-5 shadow-md shadow-ds-accent/20"
                      >
                        <span>Continue to Gamer Details</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* STEP 2: GAMER DETAILS */}
              {currentStep === 2 && (
                <Card
                  glass
                  className="p-4 sm:p-6 md:p-8 border-ds-border space-y-6 min-h-[580px] flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="border-b border-ds-border pb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/15 border border-ds-accent/30 text-ds-ice mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
                        <span>Step 2 of 3: Gamer Details</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-heading font-black uppercase text-ds-text">
                        Player Information & Pass Delivery
                      </h2>
                      <p className="text-xs text-ds-text-muted mt-0.5">
                        Your digital check-in pass and QR code will be delivered under these details.
                      </p>
                    </div>

                    {isAuthenticated ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <div className="flex items-center gap-2">
                          {activeMembership && (
                            <Badge variant="accent" size="sm" className="text-[10px]">
                              👑 {activeMembership.planNameSnapshot} ({activeMembership.discountPercent}% OFF)
                            </Badge>
                          )}
                          <Badge variant="success" size="sm">
                            Verified Gamer
                          </Badge>
                        </div>
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
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            if (formTouched.customerName) {
                              setFormErrors((prev) => ({
                                ...prev,
                                customerName: validateCustomerName(e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => {
                            setFormTouched((prev) => ({ ...prev, customerName: true }));
                            setFormErrors((prev) => ({
                              ...prev,
                              customerName: validateCustomerName(customerName),
                            }));
                          }}
                          error={formTouched.customerName ? formErrors.customerName : undefined}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-ds-text-muted uppercase">
                          WhatsApp Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="+91 98765 43210"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            if (formTouched.customerPhone) {
                              setFormErrors((prev) => ({
                                ...prev,
                                customerPhone: validateCustomerPhone(e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => {
                            setFormTouched((prev) => ({ ...prev, customerPhone: true }));
                            setFormErrors((prev) => ({
                              ...prev,
                              customerPhone: validateCustomerPhone(customerPhone),
                            }));
                          }}
                          error={formTouched.customerPhone ? formErrors.customerPhone : undefined}
                          required
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-ds-text-muted uppercase">
                          Email Address (For Digital Pass & Receipt)
                        </label>
                        <Input
                          type="email"
                          placeholder="alex@example.com"
                          value={customerEmail}
                          onChange={(e) => {
                            setCustomerEmail(e.target.value);
                            if (formTouched.customerEmail) {
                              setFormErrors((prev) => ({
                                ...prev,
                                customerEmail: validateCustomerEmail(e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => {
                            setFormTouched((prev) => ({ ...prev, customerEmail: true }));
                            setFormErrors((prev) => ({
                              ...prev,
                              customerEmail: validateCustomerEmail(customerEmail),
                            }));
                          }}
                          error={formTouched.customerEmail ? formErrors.customerEmail : undefined}
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-ds-text-muted uppercase">
                            Special Requests / Pre-load Note (Optional)
                          </label>
                          {selectedGame && (
                            <span className="text-xs text-ds-cyan font-medium flex items-center gap-1">
                              <Gamepad2 className="w-3.5 h-3.5 text-ds-cyan" />
                              Game: <strong>{selectedGame}</strong>
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-text-dim text-sm focus:outline-none focus:border-ds-accent transition-colors"
                          placeholder="e.g. Please connect two DualSense controllers with Tekken 8 ready."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Desktop Bottom Navigation */}
                  <div className="hidden lg:flex items-center gap-2 sm:gap-3 w-full sm:justify-between pt-4 border-t border-ds-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToStep(1)}
                      className="flex-1 sm:flex-initial text-xs sm:text-sm py-2 px-3 sm:px-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      <span>Back to Schedule</span>
                    </Button>

                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        const nameErr = validateCustomerName(customerName);
                        const phoneErr = validateCustomerPhone(customerPhone);
                        const emailErr = validateCustomerEmail(customerEmail);

                        setFormTouched({ customerName: true, customerPhone: true, customerEmail: true });
                        setFormErrors({
                          customerName: nameErr,
                          customerPhone: phoneErr,
                          customerEmail: emailErr,
                        });

                        if (nameErr || phoneErr || emailErr) {
                          toast.error(nameErr || phoneErr || emailErr || 'Please check the highlighted errors');
                          return;
                        }
                        goToStep(3);
                      }}
                      className="flex-[1.5] sm:flex-initial text-xs sm:text-sm py-2 px-4 sm:px-5 shadow-md shadow-ds-accent/20"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* STEP 3: PASS & PAY (REVIEW & PAYMENT SELECTION) */}
              {currentStep === 3 && (
                <Card
                  glass
                  className="p-4 sm:p-6 md:p-8 border-ds-border space-y-6 min-h-[580px] flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="border-b border-ds-border pb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ds-accent/15 border border-ds-accent/30 text-ds-ice mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-ds-accent" />
                        <span>Step 3 of 3: Pass & Pay</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-heading font-black uppercase text-ds-text">
                        Review & Confirm Reservation
                      </h2>
                      <p className="text-xs text-ds-text-muted mt-0.5">
                        Select your preferred payment method to lock your spot and issue your QR pass.
                      </p>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                        Select Payment Preference
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div
                          onClick={() => setPaymentOption('ONLINE')}
                          className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all ${
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
                          className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all ${
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

                    {/* Inline Review Summary for Mobile (< lg) */}
                    <div className="lg:hidden p-3.5 sm:p-4 rounded-xl bg-ds-surface/60 border border-ds-border space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ds-text-dim">Reservation</span>
                        <span className="font-heading font-bold text-ds-text truncate max-w-[200px]">
                          {selectedStation?.name} • {durationMinutes / 60}hr
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ds-text-dim">Date & Slot</span>
                        <span className="text-ds-ice font-mono font-semibold">
                          {selectedDate} • {selectedSlot?.label}
                        </span>
                      </div>
                      {couponDiscountPaise > 0 && (
                        <div className="flex items-center justify-between text-xs text-emerald-400">
                          <span>Promo Code ({appliedCoupon?.code})</span>
                          <span>-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-ds-border/60">
                        <span className="text-xs font-heading font-bold uppercase text-ds-text">Total Payable</span>
                        <span className="text-xl font-heading font-black text-ds-ice">
                          ₹{(finalPricePaise / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Syndicate Guarantee Banner */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-ds-surface/40 border border-ds-border text-xs text-ds-text-dim space-y-2">
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
                  </div>

                  {/* Step 3 Desktop Bottom Navigation */}
                  <div className="hidden lg:flex items-center gap-2 sm:gap-3 w-full sm:justify-between pt-4 border-t border-ds-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToStep(2)}
                      disabled={submitting}
                      className="flex-1 sm:flex-initial text-xs sm:text-sm py-2 px-3 sm:px-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      <span>Back to Player Info</span>
                    </Button>

                    <Button
                      variant="accent"
                      size="sm"
                      onClick={handleConfirmBooking}
                      disabled={submitting}
                      className="flex-[1.8] sm:flex-initial text-xs sm:text-sm py-2 px-4 sm:px-6 shadow-md shadow-ds-accent/25"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Issuing Pass...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>
                            {paymentOption === 'ONLINE' ? 'Pay & Confirm Pass' : 'Reserve & Pay at Desk'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Sticky Order Summary (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              <Card glass className="p-4 sm:p-6 border-ds-border lg:sticky lg:top-24 space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-ds-border pb-4">
                  <h3 className="text-lg font-heading font-bold uppercase text-ds-text">Order Summary</h3>
                  <Badge variant="outline" size="sm">
                    {durationMinutes / 60} Hour{durationMinutes > 60 ? 's' : ''}
                  </Badge>
                </div>

                {/* Selected Details */}
                <div className="space-y-4 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ds-accent">Station & Arena</p>
                      <p className="font-heading font-bold text-sm text-ds-text">
                        {selectedStation?.name || (selectedZone === 'PS5' ? 'PlayStation 5 Console' : 'Snooker Table')}
                      </p>
                      <p className="text-ds-text-dim text-[11px]">
                        {selectedZone === 'PS5' ? 'PlayStation 5 Arena' : 'Championship Snooker Lounge'}
                      </p>
                      {selectedGame && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-ds-cyan font-medium">
                          <span>🎮 {selectedGame}</span>
                          <button
                            type="button"
                            onClick={() => setShowGameModal(true)}
                            className="text-[10px] text-ds-text-dim hover:text-white underline ml-1"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                    <Gamepad2 className="w-5 h-5 text-ds-ice mt-1" />
                  </div>

                  <div className="flex items-start justify-between pt-3 border-t border-ds-border/40">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ds-accent">Players</p>
                      <p className="font-heading font-bold text-sm text-ds-text">
                        {selectedZone === 'PS5'
                          ? playerCount === 1
                            ? 'Single Player (1P)'
                            : playerCount === 2
                            ? 'Two Player (2P)'
                            : 'Multi Player (3-4P)'
                          : 'Per Frame (Max 4P)'}
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
                        {selectedDate
                          ? new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
                          : '—'}
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

                {/* Price Breakdown */}
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

                  {membershipDiscountPaise > 0 && (
                    <div className="flex justify-between text-ds-cyan font-medium">
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-ds-cyan shrink-0" />
                        {activeMembership?.planNameSnapshot || 'Member Pass'} ({membershipDiscountPercent}% off)
                      </span>
                      <span className="font-mono">-₹{(membershipDiscountPaise / 100).toFixed(0)}</span>
                    </div>
                  )}

                  {couponDiscountPaise > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount</span>
                      <span>-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                    </div>
                  )}

                  {!activeMembership && (
                    <div className="py-2 px-2.5 rounded-lg bg-ds-dark/40 border border-ds-border/50 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-ds-text-dim">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Save up to 30% every hour</span>
                      </div>
                      <Link href="/membership" className="text-ds-cyan hover:underline font-semibold">
                        Get Pass →
                      </Link>
                    </div>
                  )}

                  <div className="flex justify-between text-ds-text-dim text-[11px]">
                    <span>GST (Included)</span>
                    <span>18%</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-ds-border">
                    <span className="text-sm font-heading font-bold text-ds-text uppercase">
                      Total Payable
                    </span>
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

        {/* MOBILE STICKY CHECKOUT BAR & EXPANDABLE DRAWER (< lg) */}
        <div className="lg:hidden">
          {isSummaryOpen && (
            <div
              onClick={() => setIsSummaryOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
            />
          )}

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F17]/95 backdrop-blur-2xl border-t border-ds-border shadow-[0_-12px_40px_rgba(0,0,0,0.85)] px-4 pt-2.5 pb-3">
            <div className="max-w-md mx-auto">
              <div
                onClick={() => setIsSummaryOpen((prev) => !prev)}
                className="w-12 h-1 bg-ds-border-light/60 hover:bg-ds-accent/80 rounded-full mx-auto mb-2 cursor-pointer transition-colors"
              />

              {isSummaryOpen && (
                <div className="border-b border-ds-border/80 pb-3 mb-3 max-h-[55vh] overflow-y-auto space-y-3 animate-in slide-in-from-bottom-4 duration-200">
                  <div className="flex items-center justify-between text-xs border-b border-ds-border/40 pb-2">
                    <span className="font-heading font-bold uppercase tracking-wider text-ds-ice text-[11px]">
                      Booking Details
                    </span>
                    <button
                      onClick={() => setIsSummaryOpen(false)}
                      className="text-[10px] text-ds-text-dim hover:text-white"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-ds-surface-2/70 border border-ds-border/60">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase font-mono text-ds-text-dim">Arena</p>
                        <p className="font-heading font-bold text-ds-text truncate">
                          {selectedZone === 'PS5' ? 'PlayStation 5' : 'Snooker Lounge'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-ds-surface-2/70 border border-ds-border/60">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase font-mono text-ds-text-dim">Station</p>
                        <p className="font-heading font-bold text-ds-text truncate">
                          {selectedStation?.name || 'Auto Assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-ds-surface-2/70 border border-ds-border/60">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase font-mono text-ds-text-dim">Date</p>
                        <p className="font-heading font-bold text-ds-text truncate">
                          {selectedDate
                            ? new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Today'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-ds-surface-2/70 border border-ds-border/60">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase font-mono text-ds-text-dim">Slot</p>
                        <p className="font-heading font-bold text-ds-text truncate">
                          {selectedSlot ? selectedSlot.label : `${durationMinutes / 60}hr Session`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Promo Input in Drawer */}
                  <div className="space-y-1.5 pt-1">
                    {appliedCoupon ? (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
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
                      <div className="flex gap-1.5">
                        <Input
                          placeholder="ENTER PROMO CODE"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="text-xs uppercase font-mono h-8"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading}
                          className="text-xs h-8 px-3"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Drawer Price Breakdown */}
                  <div className="p-2.5 rounded-xl bg-ds-darker/60 border border-ds-border/50 space-y-1 text-[11px]">
                    <div className="flex justify-between text-ds-text-dim">
                      <span>
                        Base Rate ({hours}h × ₹{(hourlyRatePaise / 100).toFixed(0)})
                      </span>
                      <span className="font-mono text-ds-text">₹{(subtotalPaise / 100).toFixed(0)}</span>
                    </div>
                    {multiHourDiscountPaise > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Multi-Hour Deal (10% off)</span>
                        <span className="font-mono">-₹{(multiHourDiscountPaise / 100).toFixed(0)}</span>
                      </div>
                    )}
                    {membershipDiscountPaise > 0 && (
                      <div className="flex justify-between text-ds-cyan">
                        <span>Member Pass ({membershipDiscountPercent}%)</span>
                        <span className="font-mono">-₹{(membershipDiscountPaise / 100).toFixed(0)}</span>
                      </div>
                    )}
                    {couponDiscountPaise > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Coupon Discount</span>
                        <span className="font-mono">-₹{(couponDiscountPaise / 100).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-ds-text-dim text-[10px] pt-1 border-t border-ds-border/40">
                      <span>Taxes & Hardware Amenities</span>
                      <span className="text-emerald-400 font-semibold">Included</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Drawer Bar: Total & Summary Toggle */}
              <div className="flex items-center justify-between pb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-ds-text-dim font-mono">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl font-heading font-black text-ds-ice tracking-tight">
                    ₹{(finalPricePaise / 100).toFixed(0)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSummaryOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ds-ice hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-ds-surface hover:bg-ds-surface-2 border border-ds-border/70 shadow-sm"
                >
                  <span>Summary</span>
                  {isSummaryOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-ds-accent transition-transform" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-ds-accent transition-transform" />
                  )}
                </button>
              </div>

              {/* Bottom Action Row: Back (30%) + Continue (70%) */}
              <div className="flex items-center gap-2 pb-0.5 w-full">
                <button
                  type="button"
                  onClick={handleMobileBack}
                  disabled={isMobileBackDisabled}
                  aria-label="Previous step"
                  className="w-[30%] shrink-0 h-10 rounded-lg bg-ds-surface border border-ds-border hover:border-ds-accent/60 flex items-center justify-center gap-1 text-xs font-heading font-bold text-ds-text hover:text-white active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-ds-text" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleMobileContinue}
                  disabled={submitting}
                  className="w-[70%] flex-1 h-10 rounded-lg bg-gradient-to-r from-ds-accent to-ds-ice hover:brightness-110 active:scale-[0.98] text-ds-darker font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-ds-accent/25 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 border-2 border-ds-darker border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>{getMobileContinueText()}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* OPTIONAL GAME SELECTION MODAL */}
        {showGameModal && selectedStation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
            onClick={() => setShowGameModal(false)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-ds-dark border border-ds-border shadow-2xl shadow-ds-accent/15 overflow-hidden animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-ds-border/60 bg-ds-surface/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-ds-accent/15 border border-ds-accent/30 flex items-center justify-center text-ds-cyan shrink-0">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-base sm:text-lg uppercase text-ds-text truncate">
                        Select Game
                      </h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-ds-accent/15 border border-ds-accent/30 text-ds-cyan font-bold tracking-wider shrink-0">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-ds-text-muted mt-0.5 truncate">
                      Installed on <span className="text-ds-ice font-semibold">{selectedStation.name}</span> • Pre-load or decide at venue
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="p-2 rounded-xl bg-ds-surface/80 hover:bg-ds-surface border border-ds-border hover:border-ds-accent text-ds-text-muted hover:text-white transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3.5 sm:p-4 border-b border-ds-border/40 bg-ds-darker/60 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-ds-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gameSearchQuery}
                    onChange={(e) => setGameSearchQuery(e.target.value)}
                    placeholder="Search games by title or genre (e.g. Tekken, FIFA, GTA)..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-ds-surface border border-ds-border text-xs sm:text-sm text-ds-text placeholder:text-ds-text-dim focus:outline-none focus:border-ds-accent transition-colors"
                  />
                  {gameSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGameSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-text-dim hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Games Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[58vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {displayedGames.map((game) => {
                  const isGameSelected = selectedGame === game.title;
                  return (
                    <div
                      key={game.slug}
                      onClick={() => setSelectedGame(game.title)}
                      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isGameSelected
                          ? 'border-ds-accent ring-2 ring-ds-accent/40 shadow-lg shadow-ds-accent/20 bg-ds-surface'
                          : 'border-ds-border hover:border-ds-accent/60 bg-ds-surface/40 hover:bg-ds-surface/70'
                      }`}
                    >
                      <div className="relative w-full h-36 overflow-hidden">
                        <Image
                          src={game.coverImage || '/ps5-station.jpg'}
                          alt={game.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ds-darker via-ds-darker/40 to-transparent" />
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-ds-darker/80 text-ds-ice border border-ds-border">
                            {game.genre}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <h4 className="font-heading font-black text-sm text-white truncate drop-shadow">
                            {game.title}
                          </h4>
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        <p className="text-[11px] text-ds-text-dim line-clamp-2 leading-relaxed">
                          {game.description}
                        </p>
                        <div className="pt-2 border-t border-ds-border/40 flex items-center justify-between">
                          <span className="text-[10px] text-ds-text-dim font-mono">
                            Up to {game.maxPlayers || 2}P
                          </span>
                          <span
                            className={`text-xs font-heading font-bold ${
                              isGameSelected ? 'text-ds-ice' : 'text-ds-text-muted group-hover:text-ds-ice'
                            }`}
                          >
                            {isGameSelected ? 'Selected ✓' : 'Choose Game'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-ds-border/60 bg-ds-surface/60 flex items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-ds-text-dim truncate">
                  {selectedGame ? (
                    <span>
                      Selected: <strong className="text-ds-ice">{selectedGame}</strong>
                    </span>
                  ) : (
                    <span>No game selected (decide at venue)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGame(null);
                      setShowGameModal(false);
                    }}
                    className="text-xs"
                  >
                    Clear Game
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    onClick={() => setShowGameModal(false)}
                    className="text-xs px-4"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
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
