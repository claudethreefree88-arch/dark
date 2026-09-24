'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Gamepad2,
  Tv,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CYCLING_PHRASES = [
  'PlayStation 5 Gaming Arena • 4K 120Hz',
  'Championship Italian Slate Snooker',
  'PS5 Solo ₹150/hr • Duo ₹200/hr • Squad ₹250/hr',
  'Snooker Table ₹250/hr • 3-4 Players Included',
  'Instant Digital QR Pass • Zero Double-Booking',
];

// Minimal subtle constellation particle canvas
function MinimalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Keep particle count low for a clean, minimal aesthetic
    const particlesCount = Math.min(Math.floor(width / 45), 32);
    const particles = Array.from({ length: particlesCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.2 + 0.6,
      alpha: Math.random() * 0.35 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connection lines if particles are close
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.08;
            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(97, 173, 223, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-40 z-0"
    />
  );
}

export function HeroSection() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % CYCLING_PHRASES.length);
        setFadeState('in');
      }, 350);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const scrollToExplore = () => {
    const target = document.getElementById('live-stats');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-ds-dark">
      {/* ─── Minimal Ambient Aura (NO Background Image) ────────────── */}
      <MinimalCanvas />

      {/* Top soft spotlight aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.06),transparent_70%)] pointer-events-none z-0" />

      {/* Center soft blue radiance */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(97,173,223,0.04),transparent_65%)] pointer-events-none z-0" />

      {/* Subtle fine horizontal grid line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ds-border/40 to-transparent pointer-events-none" />

      {/* ─── Hero Content ─────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto text-center z-10 space-y-7">
        {/* Live Operational Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-ds-surface/50 border border-ds-border/80 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-emerald-400">
            ARENA ONLINE
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="text-[11px] font-heading font-medium tracking-wider text-ds-text-dim">
            3 PS5 STATIONS
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="text-[11px] font-heading font-medium tracking-wider text-ds-text-dim">
            3 SNOOKER TABLES
          </span>
        </div>

        {/* Dynamic Infinite Cycling Highlights */}
        <div className="h-6 flex items-center justify-center">
          <div
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-semibold uppercase tracking-[0.22em] text-ds-accent transition-all duration-350 transform ${
              fadeState === 'in'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1'
            }`}
          >
            <span className="w-3 h-px bg-ds-accent/40" />
            <span>{CYCLING_PHRASES[currentPhraseIndex]}</span>
            <span className="w-3 h-px bg-ds-accent/40" />
          </div>
        </div>

        {/* Minimal Main Brand Heading */}
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight uppercase leading-[0.92] select-none">
            <span className="text-white">DARK </span>
            <span className="bg-gradient-to-r from-ds-ice via-cyan-400 to-[#61ADDF] bg-clip-text text-transparent">
              SYNDICATE
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-ds-text-muted/70 font-heading font-medium tracking-[0.4em] uppercase pt-1">
            GAMING WORLD
          </p>
        </div>

        {/* Refined Minimalist Tagline */}
        <p className="text-ds-text-muted text-sm sm:text-base max-w-xl mx-auto font-body leading-relaxed font-normal">
          Next-generation esports sanctum and championship billiards lounge.
          Walk-in or reserve online — starting from <span className="text-ds-ice font-semibold">₹150/hr</span>.
        </p>

        {/* ─── Hero Dual Zone Preview Cards ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2 text-left">
          {/* Card 1: PlayStation 5 */}
          <div className="p-5 rounded-2xl bg-ds-surface/40 border border-ds-border/70 hover:border-ds-accent/50 backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_25px_rgba(0,240,255,0.08)] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-ds-accent/15 border border-ds-accent/30 flex items-center justify-center text-ds-ice">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text">
                    PS5 Arena
                  </span>
                </div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  3 Stations Ready
                </span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-white group-hover:text-ds-ice transition-colors">
                  PlayStation 5 Stations
                </h3>
                <p className="text-xs text-ds-text-dim mt-0.5">
                  55" 4K 120Hz OLEDs • DualSense Wireless • 3D Audio
                </p>
              </div>

              {/* Pricing breakdown */}
              <div className="pt-2 border-t border-ds-border/50 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-ds-text-dim block">Pricing Rates:</span>
                  <span className="font-heading font-bold text-ds-ice">
                    1P: ₹150 · 2P: ₹200 · 3-4P: ₹250 <span className="text-[10px] text-ds-text-dim">/hr</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-1 flex justify-end">
              <Link
                href="/booking?stationId=station-ps5-01"
                className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ds-accent hover:text-white transition-colors"
              >
                <span>Book PS5</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Championship Snooker */}
          <div className="p-5 rounded-2xl bg-ds-surface/40 border border-ds-border/70 hover:border-ds-accent/50 backdrop-blur-md transition-all duration-300 group hover:shadow-[0_0_25px_rgba(0,240,255,0.08)] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-ds-accent/15 border border-ds-accent/30 flex items-center justify-center text-ds-ice">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-text">
                    Snooker Lounge
                  </span>
                </div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  3 Tables Ready
                </span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-base text-white group-hover:text-ds-ice transition-colors">
                  Championship Snooker
                </h3>
                <p className="text-xs text-ds-text-dim mt-0.5">
                  Italian Slate Bed • Simonis 860 Cloth • Shadowless LED
                </p>
              </div>

              {/* Pricing breakdown */}
              <div className="pt-2 border-t border-ds-border/50 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-ds-text-dim block">Pricing Rates:</span>
                  <span className="font-heading font-bold text-ds-ice">
                    ₹250 / hr per table <span className="text-[10px] text-ds-text-dim">(3-4P · +₹50/extra)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-1 flex justify-end">
              <Link
                href="/booking?stationId=station-snooker-01"
                className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-ds-accent hover:text-white transition-colors"
              >
                <span>Book Snooker</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/booking" prefetch={true} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="accent"
              className="w-full sm:w-auto text-sm px-8 py-4 shadow-glow relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
              <Sparkles className="w-4 h-4 mr-2 text-white" />
              Reserve Your Station
            </Button>
          </Link>
          <Link href="/pricing" prefetch={true} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-sm px-7 py-4 hover:border-ds-accent/60 transition-all duration-200"
            >
              Explore Rates & Passes
            </Button>
          </Link>
        </div>

        {/* Minimal Trust / Feature Tags */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] text-ds-text-muted/60 font-heading uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Instant QR Pass
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="flex items-center gap-1.5">
            <Tv className="w-3 h-3 text-ds-accent" /> 4K 120Hz Displays
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-ds-ice" /> Zero Double-Booking
          </span>
          <span className="text-ds-border-light">•</span>
          <span className="flex items-center gap-1.5">
            <Award className="w-3 h-3 text-cyan-400" /> Italian Slate Tables
          </span>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-2">
          <button
            type="button"
            onClick={scrollToExplore}
            className="group inline-flex flex-col items-center gap-1 text-ds-text-dim/40 hover:text-ds-ice/70 transition-colors duration-300 focus:outline-none"
            aria-label="Scroll to explore"
          >
            <div className="w-4 h-7 rounded-full border border-ds-border/40 group-hover:border-ds-accent/50 flex items-start justify-center p-1 transition-colors">
              <span className="w-0.5 h-1.5 rounded-full bg-ds-accent/60 animate-bounce" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
