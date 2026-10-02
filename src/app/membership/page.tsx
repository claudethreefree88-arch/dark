'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Shield,
  Zap,
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  CreditCard,
  QrCode,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  tier: 'SILVER' | 'GOLD' | 'VIP';
  description: string;
  pricePaise: number;
  durationDays: number;
  discountPercent: number;
  freeHours: number;
  perks: string[];
  badgeColor?: string;
}

const getPassImage = (tier: string) => {
  if (tier === 'VIP') return '/passes/vip-black-card.jpg';
  if (tier === 'GOLD') return '/passes/gold-pass.jpg';
  return '/passes/silver-pass.jpg';
};

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'RAZORPAY' | 'CARD'>('UPI');
  const [purchasing, setPurchasing] = useState(false);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/membership/plans');
        const json = await res.json();
        if (json.success && json.data?.plans) {
          setPlans(json.data.plans);
        }
      } catch {
        toast.error('Failed to load membership plans');
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in or create an account to activate a Syndicate Pass');
      return;
    }
    if (!selectedPlan) return;

    setPurchasing(true);
    try {
      const res = await fetch('/api/customer/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod: paymentMethod === 'CARD' ? 'RAZORPAY' : paymentMethod,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.data.message || `Welcome to ${selectedPlan.name}!`);
        setSelectedPlan(null);
        window.location.href = '/account/membership';
      } else {
        toast.error(json.error?.message || 'Failed to activate pass');
      }
    } catch {
      toast.error('Network error during checkout');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-ds-darker text-ds-text flex flex-col selection:bg-ds-accent selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm" className="shadow-glow-sm">
            DARK SYNDICATE PASS
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight uppercase">
            PLAY MORE. <span className="gradient-text">SAVE EVERY HOUR.</span>
          </h1>
          <p className="text-ds-text-muted text-sm sm:text-base leading-relaxed">
            Unlock automatic hourly discounts across all PS5 consoles, racing rigs, and snooker tables.
            Receive free bonus gaming hours, priority reservations, and exclusive tournament entry privileges.
          </p>

          {!user ? (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 p-2.5 px-4 rounded-xl bg-ds-surface/70 border border-ds-accent/40 text-xs text-ds-text-muted shadow-glow-sm">
                <Sparkles className="w-4 h-4 text-ds-accent shrink-0" />
                <span>
                  New to Dark Syndicate?{' '}
                  <Link
                    href="/login?tab=signup&redirect=/membership"
                    className="text-ds-accent font-bold hover:underline"
                  >
                    Create a free gamer account
                  </Link>{' '}
                  or{' '}
                  <Link
                    href="/login?tab=signin&redirect=/membership"
                    className="text-ds-ice font-bold hover:underline"
                  >
                    Sign In
                  </Link>{' '}
                  to activate your pass instantly.
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Link
                href="/account/membership"
                className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-ds-ice hover:text-ds-accent transition-colors"
              >
                <span>View your active digital member pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Membership Tiers Grid */}
        {loading ? (
          <div className="p-20 text-center text-xs text-ds-text-dim flex flex-col items-center gap-3">
            <RotateCw className="w-6 h-6 animate-spin text-ds-accent" />
            <span>Loading Syndicate Passes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isGold = plan.tier === 'GOLD';
              const isVip = plan.tier === 'VIP';

              return (
                <Card
                  key={plan.id}
                  variant="glass"
                  className={`overflow-hidden p-0 flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] group ${
                    isGold
                      ? 'border-amber-500/60 shadow-xl shadow-amber-500/10'
                      : isVip
                      ? 'border-ds-accent/70 shadow-xl shadow-ds-accent/15'
                      : 'border-ds-border'
                  }`}
                >
                  {isGold && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-black text-[10px] font-heading font-black uppercase px-3.5 py-1 rounded-full shadow-lg font-mono">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {isVip && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-ds-accent text-white text-[10px] font-heading font-black uppercase px-3.5 py-1 rounded-full shadow-glow font-mono">
                        PRO GAMER ELITE
                      </span>
                    </div>
                  )}

                  <div>
                    {/* 3D Cybernetic Pass Showcase Banner */}
                    <div className="relative w-full h-52 sm:h-56 bg-ds-dark overflow-hidden">
                      <Image
                        src={getPassImage(plan.tier)}
                        alt={plan.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ds-surface/95 via-transparent to-black/40" />

                      <div className="absolute top-3.5 left-3.5">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 font-bold text-white shadow-sm">
                          {plan.tier} TIER
                        </span>
                      </div>

                      <div className="absolute top-3.5 right-3.5">
                        {isVip ? (
                          <div className="p-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/40 text-ds-ice shadow-sm">
                            <Crown className="w-4 h-4" />
                          </div>
                        ) : isGold ? (
                          <div className="p-1.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-400 shadow-sm">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-black/75 backdrop-blur-md border border-slate-400/40 text-slate-300 shadow-sm">
                            <Shield className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Header */}
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-heading font-extrabold text-ds-text group-hover:text-ds-ice transition-colors">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-ds-text-muted leading-relaxed min-h-[36px]">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price Tag */}
                      <div className="p-4 rounded-2xl bg-ds-dark/70 border border-ds-border">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-heading font-black text-ds-text">
                            ₹{(plan.pricePaise / 100).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-mono text-ds-text-dim">
                            /{plan.durationDays} Days
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="accent" size="sm">
                            {plan.discountPercent}% OFF EVERY HOUR
                          </Badge>
                          {plan.freeHours > 0 && (
                            <Badge variant="success" size="sm">
                              +{plan.freeHours} FREE HRS
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Perks List */}
                      <div className="space-y-3 pt-1">
                        <span className="text-[10px] font-mono uppercase text-ds-text-dim tracking-wider block">
                          Included Privileges:
                        </span>
                        <ul className="space-y-2.5 text-xs text-ds-text-muted">
                          {plan.perks?.map((perk, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  isGold
                                    ? 'text-amber-400'
                                    : isVip
                                    ? 'text-ds-ice'
                                    : 'text-emerald-400'
                                }`}
                              />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="p-6 sm:p-8 pt-0">
                    <Button
                      variant={isGold ? 'primary' : isVip ? 'accent' : 'outline'}
                      className="w-full font-heading font-bold tracking-wider"
                      onClick={() => {
                        if (!user) {
                          window.location.href = '/login?tab=signup&redirect=/membership';
                          return;
                        }
                        setSelectedPlan(plan);
                      }}
                    >
                      <span>{user ? `Join ${plan.name}` : `Get ${plan.name}`}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Venue Advantage Banner */}
        <Card variant="glass" className="p-8 sm:p-10 border-ds-accent/30 bg-gradient-to-r from-ds-dark via-ds-surface/60 to-ds-dark">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-ds-accent/20 border border-ds-accent flex items-center justify-center text-ds-ice shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Automatic Checkout
                </h4>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  No coupons needed. Discounts apply instantly whenever you book online or visit the counter.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Digital Syndicate Pass
                </h4>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  Scan your member QR at the front desk for instant recognition, bonus hours, and free refreshments.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Break-Even Fast
                </h4>
                <p className="text-xs text-ds-text-muted mt-0.5">
                  Play just 6 to 8 hours a month and your pass pays for itself through hourly savings.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </main>

      <Footer />

      {/* Checkout Modal */}
      {selectedPlan && (
        <Modal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          title={`Activate ${selectedPlan.name}`}
          size="md"
        >
          <div className="space-y-6 text-xs">
            {/* Plan summary */}
            <div className="p-4 rounded-xl bg-ds-dark border border-ds-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 rounded-lg overflow-hidden relative shrink-0 border border-ds-border bg-ds-surface">
                  <Image
                    src={getPassImage(selectedPlan.tier)}
                    alt={selectedPlan.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ds-text-dim block">
                    Selected Pass
                  </span>
                  <h4 className="font-heading font-bold text-base text-ds-text">
                    {selectedPlan.name}
                  </h4>
                  <span className="text-xs text-emerald-400">
                    {selectedPlan.discountPercent}% OFF • {selectedPlan.durationDays} Days Validity
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-ds-text-dim block">
                  Amount Due
                </span>
                <span className="text-xl font-heading font-black text-ds-ice">
                  ₹{(selectedPlan.pricePaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method selector */}
            <div className="space-y-2">
              <label className="text-ds-text-dim block font-heading font-bold uppercase text-[10px]">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'Instant UPI', desc: 'GPay / PhonePe / Paytm' },
                  { id: 'CARD', label: 'Debit / Card', desc: 'Visa / Mastercard' },
                  { id: 'RAZORPAY', label: 'Net Banking', desc: 'All Indian Banks' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === pm.id
                        ? 'bg-ds-accent/20 border-ds-accent text-white shadow-glow-sm'
                        : 'bg-ds-surface/50 border-ds-border text-ds-text-muted hover:text-white'
                    }`}
                  >
                    <span className="font-heading font-bold text-xs">{pm.label}</span>
                    <span className="text-[10px] text-ds-text-dim mt-1">{pm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Immediate Activation notice */}
            <div className="p-3.5 rounded-xl bg-ds-surface/40 border border-ds-border text-ds-text-muted space-y-1">
              <span className="text-ds-text font-bold block">Instant Syndicate Activation:</span>
              <p>
                Your pass will be activated immediately upon payment. All hourly rates on your account will
                automatically discount by {selectedPlan.discountPercent}%.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setSelectedPlan(null)} disabled={purchasing}>
                Cancel
              </Button>
              <Button variant="accent" type="button" onClick={handleSubscribe} isLoading={purchasing}>
                <span>Pay ₹{(selectedPlan.pricePaise / 100).toLocaleString('en-IN')} & Activate</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
