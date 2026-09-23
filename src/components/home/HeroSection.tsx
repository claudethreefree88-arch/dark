'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Gamepad2,
  Flame,
  CheckCircle2,
  ChevronDown,
  Tv,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function HeroSection() {
  const [isHoveredLogo, setIsHoveredLogo] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // GPU-Accelerated Scroll Parallax with Zero React Re-render Thrashing
  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY;
      if (!sectionRef.current) return;

      const heroTranslateY = Math.min(scrollY * 0.28, 140);
      const heroOpacity = Math.max(0, 1 - scrollY / 620);
      const heroScale = Math.max(0.93, 1 - scrollY * 0.0004);
      const bgTranslateY = scrollY * 0.15;

      sectionRef.current.style.setProperty('--hero-translate-y', `${heroTranslateY}px`);
      sectionRef.current.style.setProperty('--hero-opacity', `${heroOpacity}`);
      sectionRef.current.style.setProperty('--hero-scale', `${heroScale}`);
      sectionRef.current.style.setProperty('--bg-translate-y', `${bgTranslateY}px`);

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateParallax(); // Initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hardware-Accelerated Mouse Move Tracker via CSS Variables
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    sectionRef.current.style.setProperty('--mouse-x', x.toFixed(3));
    sectionRef.current.style.setProperty('--mouse-y', y.toFixed(3));
  };

  // Cyber Particle Web Canvas with Intersection-Observer Pause
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
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
    window.addEventListener('resize', handleResize, { passive: true });

    // Node count optimized for high FPS
    const particleCount = Math.min(40, Math.floor(width / 35));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        alphaSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      });
    }

    const render = () => {
      if (!isVisibleRef.current) return;
      ctx.clearRect(0, 0, width, height);

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha <= 0.1 || p.alpha >= 0.7) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(121, 189, 233, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with subtle cyber web filament
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.16;
            ctx.strokeStyle = `rgba(97, 173, 223, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause canvas animation when hero is off-screen to save CPU/GPU cycles
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(section);

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToNext = () => {
    const target = document.getElementById('live-stats');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[94vh] flex items-center justify-center pt-32 sm:pt-36 pb-20 px-4 overflow-hidden gpu-accelerate"
      style={{
        // Default CSS fallback variables
        ['--mouse-x' as any]: '0',
        ['--mouse-y' as any]: '0',
        ['--hero-translate-y' as any]: '0px',
        ['--hero-scale' as any]: '1',
        ['--hero-opacity' as any]: '1',
        ['--bg-translate-y' as any]: '0px',
      }}
    >
      {/* Interactive Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-60"
      />

      {/* Cyber Ambient Radial Glows with Hardware Accelerated Parallax Shift */}
      <div
        className="absolute inset-0 pointer-events-none z-0 gpu-accelerate"
        style={{
          transform: 'translate3d(0, var(--bg-translate-y, 0px), 0)',
          willChange: 'transform',
        }}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] bg-gradient-to-tr from-ds-primary/25 via-ds-secondary/20 to-ds-accent/15 rounded-full blur-[170px]" />
        <div className="absolute top-1/3 left-1/6 w-[450px] h-[450px] bg-ds-accent/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/6 w-[550px] h-[550px] bg-ds-secondary/25 rounded-full blur-[180px]" />

        {/* Cyberpunk Grid with Animated Background Scroll */}
        <div
          className="absolute inset-0 opacity-[0.035] animate-cyber-grid"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #79BDE9 1.5px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient Horizontal Horizon Laser Beam */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-ds-accent/25 to-transparent blur-[1px]" />
      </div>

      {/* Main Hero Dynamic Container with Smooth GPU-Accelerated Parallax */}
      <div
        className="relative max-w-6xl mx-auto text-center z-10 space-y-6 gpu-accelerate"
        style={{
          transform: 'translate3d(0, var(--hero-translate-y, 0px), 0) scale(var(--hero-scale, 1))',
          opacity: 'var(--hero-opacity, 1)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Symmetrical Command Center Row: Left Badge, Center Hologram, Right Badge */}
        <div className="flex items-center justify-center gap-4 lg:gap-8 xl:gap-12 mb-2">
          {/* Left Arena Badge (PS5 Pro) */}
          <div
            className="hidden md:flex items-center gap-3 p-3 rounded-2xl bg-ds-surface/80 backdrop-blur-xl border border-ds-accent/30 shadow-elevated hover:border-ds-accent transition-all duration-300 animate-float-slow text-left max-w-[220px] lg:max-w-[240px] group gpu-accelerate"
            style={{
              transform: 'translate3d(calc(var(--mouse-x, 0) * -10px), calc(var(--mouse-y, 0) * -10px), 0)',
              willChange: 'transform',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-ds-dark border border-ds-accent/40 flex items-center justify-center text-ds-accent shrink-0 group-hover:scale-105 group-hover:border-ds-accent transition-all duration-300 shadow-glow">
              <Gamepad2 className="w-5 h-5 text-ds-accent" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-emerald-400">
                  PS5 PRO ARENA
                </span>
              </div>
              <p className="text-xs font-bold text-ds-text leading-tight mt-0.5">4K 120Hz Rig</p>
              <p className="text-[10px] text-ds-text-dim">8 Units Online</p>
            </div>
          </div>

          {/* Holographic Logo Emblem with Rotating HUD Reticles */}
          <div
            className="relative inline-flex items-center justify-center p-3 cursor-pointer group"
            onMouseEnter={() => setIsHoveredLogo(true)}
            onMouseLeave={() => setIsHoveredLogo(false)}
          >
            {/* Outer Rotating HUD Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-ds-accent/35 animate-spin-slow pointer-events-none" />

            {/* Inner Counter-Rotating Reticle Ring */}
            <div
              className="absolute inset-1 rounded-full border border-ds-ice/20 pointer-events-none"
              style={{
                animation: 'spin-slow 15s linear infinite reverse',
              }}
            />

            {/* Glowing Aura Ring */}
            <div className="absolute inset-2 rounded-3xl bg-ds-accent/20 blur-xl group-hover:bg-ds-accent/35 transition-all duration-500" />

            {/* Cyber Corner HUD Crosshairs */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-ds-accent" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-ds-accent" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-ds-accent" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-ds-accent" />

            {/* Emblem Box */}
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-ds-dark/95 p-2.5 flex items-center justify-center border border-ds-accent/40 shadow-glow backdrop-blur-2xl transition-transform duration-300 group-hover:scale-105 gpu-accelerate"
              style={{
                transform: isHoveredLogo
                  ? 'perspective(600px) rotateY(calc(var(--mouse-x, 0) * 24deg)) rotateX(calc(var(--mouse-y, 0) * -24deg))'
                  : 'perspective(600px) rotateY(0deg) rotateX(0deg)',
                willChange: 'transform',
              }}
            >
              {/* Scanline Sweep */}
              <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-ds-accent/20 to-transparent animate-scanline pointer-events-none" />

              <Image
                src="/logo.png"
                alt="DARK SYNDICATE Logo"
                width={120}
                height={120}
                priority
                className="w-full h-full object-contain filter drop-shadow-[0_0_24px_rgba(97,173,223,0.7)]"
              />
            </div>
          </div>

          {/* Right Arena Badge (Championship Pool) */}
          <div
            className="hidden md:flex items-center gap-3 p-3 rounded-2xl bg-ds-surface/80 backdrop-blur-xl border border-ds-accent/30 shadow-elevated hover:border-ds-accent transition-all duration-300 animate-float-reverse text-left max-w-[220px] lg:max-w-[240px] group gpu-accelerate"
            style={{
              transform: 'translate3d(calc(var(--mouse-x, 0) * 10px), calc(var(--mouse-y, 0) * 10px), 0)',
              willChange: 'transform',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-ds-dark border border-ds-accent/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 group-hover:border-ds-accent transition-all duration-300 shadow-glow">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-cyan-400">
                  CHAMPIONSHIP POOL
                </span>
              </div>
              <p className="text-xs font-bold text-ds-text leading-tight mt-0.5">Simonis 860 Slate</p>
              <p className="text-[10px] text-ds-text-dim">3 Tables Ready</p>
            </div>
          </div>
        </div>

        {/* Dynamic Live Status HUD Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ds-surface/90 border border-ds-accent/40 text-xs sm:text-sm font-heading font-bold uppercase tracking-[0.2em] text-ds-ice shadow-glow-sm backdrop-blur-md">
            {/* Mini Equalizer Bars */}
            <div className="flex items-end gap-0.5 h-3.5">
              <span className="w-1 bg-ds-accent rounded-full equalizer-1" />
              <span className="w-1 bg-ds-ice rounded-full equalizer-2" />
              <span className="w-1 bg-ds-accent rounded-full equalizer-3" />
              <span className="w-1 bg-ds-ice rounded-full equalizer-4" />
            </div>

            <Flame className="w-4 h-4 text-ds-accent animate-pulse" />
            <span>Premier Esports & Billiards Arena</span>

            {/* Live Operational Indicator */}
            <span className="hidden sm:inline-flex items-center gap-1 pl-2 border-l border-ds-border text-[10px] text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ACTIVE
            </span>
          </div>
        </div>

        {/* Brand Title with Cyber Gradient & Light Refraction */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight uppercase leading-none select-none">
          <span className="text-ds-text transition-colors duration-300 hover:text-white">DARK </span>
          <span className="gradient-text text-glow drop-shadow-[0_0_35px_rgba(97,173,223,0.5)]">
            SYNDICATE
          </span>
          <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-ds-text-muted font-heading font-medium tracking-[0.3em] mt-3">
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

        <p className="text-ds-text-muted text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-body leading-relaxed">
          Step into an icy-dark, high-voltage gaming sanctum. Ultra-smooth 4K 120Hz PlayStation 5 Pro battle stations, championship slate pool tables, and elite esports competition.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <Link href="/booking" prefetch={true} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="accent"
              className="w-full sm:w-auto text-base px-8 py-6 shadow-glow relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200"
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
              className="w-full sm:w-auto text-base px-8 py-6 backdrop-blur-md hover:border-ds-accent hover:shadow-glow-sm transition-all duration-200"
            >
              <Gamepad2 className="w-5 h-5 mr-2 text-ds-accent" />
              Explore Gaming Zones
            </Button>
          </Link>
        </div>

        {/* Highlights Ticker */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-ds-text-muted font-heading uppercase tracking-wider">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/60 border border-ds-border">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant QR Pass
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/60 border border-ds-border">
            <Tv className="w-3.5 h-3.5 text-ds-accent" /> 4K 120Hz OLEDs
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/60 border border-ds-border">
            <Zap className="w-3.5 h-3.5 text-ds-ice" /> Zero Double-Booking
          </span>
        </div>

        {/* Animated Scroll Down Indicator Button */}
        <div className="pt-8">
          <button
            type="button"
            onClick={scrollToNext}
            className="group inline-flex flex-col items-center gap-1 text-ds-text-dim hover:text-ds-ice transition-colors duration-300 focus:outline-none"
            aria-label="Scroll to exploration stats"
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
