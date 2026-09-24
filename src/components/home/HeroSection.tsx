'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Gamepad2,
  Tv,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Headphones,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CYCLING_PHRASES = [
  '4K 120Hz PlayStation 5 Pro Arena',
  'Championship Slate Billiards Tables',
  'High-Voltage Tournament Esports',
  'All-Night LAN Showdown Passes',
  'Zero Double-Booking Guarantee',
];

export function HeroSection() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  // Infinite animated cycling text loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % CYCLING_PHRASES.length);
        setFadeState('in');
      }, 350);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const scrollToExplore = () => {
    const target = document.getElementById('live-stats');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-32 sm:pt-36 pb-20 px-4 overflow-hidden">
      {/* ─── Looping Cinematic Video Background ──────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-bg-poster.jpg"
          className="w-full h-full object-cover scale-105 filter brightness-[0.42] contrast-[1.15] saturate-[1.2]"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Ambient Dark Cyan Cyber Gradients & Vignette for Maximum Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-ds-dark/90 via-ds-dark/75 to-ds-dark/95" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-ds-dark/40 to-ds-dark" />

        {/* Ambient Cyan Laser Horizon Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-ds-accent/35 to-transparent blur-[1px]" />
      </div>

      {/* ─── Main Hero Content ───────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto text-center z-10 space-y-6">
        {/* Live Operational Status Telemetry Banner */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-ds-surface/80 border border-ds-accent/40 backdrop-blur-xl shadow-glow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-emerald-400">
            ARENA ONLINE
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-ds-ice flex items-center gap-1">
            <Activity className="w-3 h-3 text-ds-accent animate-pulse" /> 4ms ULTRA-LOW LATENCY
          </span>
          <span className="hidden sm:inline text-ds-border-light">•</span>
          <span className="hidden sm:inline text-[11px] font-heading font-medium tracking-wider text-ds-text-dim">
            10 AM – 12 AM
          </span>
        </div>

        {/* Infinite Cycling Dynamic Headline Highlight */}
        <div className="h-8 flex items-center justify-center">
          <div
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-bold uppercase tracking-[0.25em] text-ds-accent transition-all duration-350 transform ${
              fadeState === 'in'
                ? 'opacity-100 translate-y-0 filter blur-0'
                : 'opacity-0 -translate-y-2 filter blur-sm'
            }`}
          >
            <Flame className="w-4 h-4 text-ds-accent animate-pulse" />
            <span>{CYCLING_PHRASES[currentPhraseIndex]}</span>
            <span className="w-1.5 h-4 bg-ds-accent/80 animate-pulse rounded-xs" />
          </div>
        </div>

        {/* Grand Brand Heading with Cyber Neon Refraction */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight uppercase leading-none select-none drop-shadow-2xl">
          <span className="text-ds-text hover:text-white transition-colors duration-300">
            DARK{' '}
          </span>
          <span className="gradient-text text-glow drop-shadow-[0_0_35px_rgba(97,173,223,0.6)]">
            SYNDICATE
          </span>
          <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl text-ds-text-muted font-heading font-medium tracking-[0.3em] mt-3">
            GAMING WORLD
          </span>
        </h1>

        {/* Iconic Tagline with Cyber Laser Underline */}
        <div className="relative inline-block mx-auto">
          <p className="text-lg sm:text-2xl md:text-3xl font-heading font-bold text-ds-ice tracking-widest uppercase">
            ENTER THE GAME. OWN THE NIGHT.
          </p>
          <div className="mt-2 h-[2px] w-full bg-gradient-to-r from-transparent via-ds-accent to-transparent" />
        </div>

        {/* Subtitle Description */}
        <p className="text-ds-text-muted text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-body leading-relaxed drop-shadow">
          Step into an icy-dark, high-voltage gaming sanctum. Ultra-smooth 4K 120Hz PlayStation 5 Pro battle stations, championship Italian slate pool tables, and elite esports competition.
        </p>

        {/* Action Call-To-Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <Link href="/booking" prefetch={true} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="accent"
              className="w-full sm:w-auto text-base px-9 py-6 shadow-glow relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
              <Sparkles className="w-5 h-5 mr-2 text-white animate-spin-slow" />
              Book Your Session
            </Button>
          </Link>
          <Link href="/facilities" prefetch={true} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8 py-6 backdrop-blur-xl hover:border-ds-accent hover:shadow-glow-sm transition-all duration-200"
            >
              <Gamepad2 className="w-5 h-5 mr-2 text-ds-accent" />
              Explore Gaming Zones
            </Button>
          </Link>
        </div>

        {/* Capability Feature Ticker */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-ds-text-muted font-heading uppercase tracking-wider">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/70 border border-ds-border/80 backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant QR Pass
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/70 border border-ds-border/80 backdrop-blur-md">
            <Tv className="w-3.5 h-3.5 text-ds-accent" /> 4K 120Hz OLEDs
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/70 border border-ds-border/80 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-ds-ice" /> Zero Double-Booking
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/70 border border-ds-border/80 backdrop-blur-md">
            <Headphones className="w-3.5 h-3.5 text-ds-accent" /> SteelSeries 3D Audio
          </span>
        </div>

        {/* Animated Scroll Down Indicator Button */}
        <div className="pt-8">
          <button
            type="button"
            onClick={scrollToExplore}
            className="group inline-flex flex-col items-center gap-1 text-ds-text-dim hover:text-ds-ice transition-colors duration-300 focus:outline-none"
            aria-label="Scroll to explore live stats"
          >
            <span className="text-[10px] font-heading font-bold uppercase tracking-[0.25em] text-ds-text-dim group-hover:text-ds-accent transition-colors">
              Scroll To Explore
            </span>
            <div className="w-5 h-8 rounded-full border-2 border-ds-border-light group-hover:border-ds-accent flex items-start justify-center p-1 transition-colors">
              <span className="w-1 h-2 rounded-full bg-ds-accent animate-bounce" />
            </div>
            <ChevronDown className="w-4 h-4 text-ds-accent animate-pulse -mt-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
