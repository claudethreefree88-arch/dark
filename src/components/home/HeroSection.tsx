'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, CirclePlay, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const zones = [
  { name: 'PS5 Arena', tag: '4K 120Hz OLED', image: '/ps5-station.jpg', href: '/booking' },
  { name: 'PC Gaming', tag: 'High-FPS Rigs', image: '/dd1.png', href: '/facilities' },
  { name: 'Snooker Lounge', tag: 'Italian Slate', image: '/snooker-table.jpg', href: '/booking' },
  { name: 'Café & Lounge', tag: 'Food & Vibes', image: '/DD.png', href: '/contact' },
];

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[100dvh] lg:h-[100dvh] lg:min-h-[640px] lg:max-h-[960px] overflow-hidden bg-ds-dark pt-20 sm:pt-24 lg:pt-24 pb-4 sm:pb-6 lg:pb-7 flex flex-col justify-between">
      {/* Background Image & Cyber Overlays */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center lg:bg-[center_top]"
        style={{ backgroundImage: "url('/DD.png')" }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,7,13,0.97)_0%,rgba(2,7,13,0.88)_35%,rgba(2,7,13,0.4)_65%,rgba(2,7,13,0.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#02070d] via-[#02070d]/80 to-transparent" />

      {/* Main Content Container */}
      <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col justify-between px-4 sm:px-8 lg:px-10">
        {/* Top Text & CTA Block */}
        <div className="max-w-2xl pt-2 sm:pt-4 lg:pt-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ds-accent/10 border border-ds-accent/30 text-ds-ice text-[11px] sm:text-xs font-heading font-semibold tracking-wider uppercase backdrop-blur-sm mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-ds-accent animate-pulse" />
            <span>Next-Gen Gaming & Snooker Arena</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-black uppercase tracking-tight text-white drop-shadow-2xl leading-[0.94]">
            <span className="block">Play</span>
            <span className="block bg-gradient-to-r from-[#3299ff] via-[#18d6ea] to-[#58e0ef] bg-clip-text text-transparent">
              Beyond
            </span>
            <span className="block">Reality</span>
          </h1>

          {/* Tagline */}
          <p className="mt-3 sm:mt-4 font-heading text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-ds-text-muted">
            Consoles <span className="px-1.5 text-ds-accent">·</span> PC Gaming <span className="px-1.5 text-ds-accent">·</span> Snooker <span className="px-1.5 text-ds-accent">·</span> Good Vibes
          </p>

          {/* Divider */}
          <div className="mt-3.5 h-0.5 w-24 bg-gradient-to-r from-ds-accent via-ds-accent/40 to-transparent" />

          {/* Action CTAs */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/booking">
              <Button
                size="lg"
                variant="accent"
                className="rounded-full px-6 py-3 text-sm font-heading font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(41,186,255,0.35)] hover:shadow-[0_0_36px_rgba(41,186,255,0.55)] transition-all"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Book Your Slot
                <ArrowRight className="ml-2 h-4 w-4 rounded-full bg-ds-dark/60 p-0.5 text-ds-ice" />
              </Button>
            </Link>

            <Link
              href="/facilities"
              className="inline-flex items-center gap-2 rounded-full border border-ds-border-light/70 bg-ds-dark/60 px-5 py-3 font-heading text-sm font-semibold text-ds-text backdrop-blur-md transition hover:border-ds-accent hover:text-ds-ice hover:bg-ds-surface/70"
            >
              <CirclePlay className="h-4 w-4 text-ds-accent" />
              Explore the arena
            </Link>
          </div>
        </div>

        {/* Bottom Zone Cards - Perfectly Framed Above The Fold */}
        <div className="pt-6 sm:pt-8 lg:pt-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4 lg:gap-4">
            {zones.map((zone) => (
              <Link
                key={zone.name}
                href={zone.href}
                className="group relative h-20 sm:h-24 lg:h-28 overflow-hidden rounded-xl sm:rounded-2xl border border-ds-border-light/50 bg-ds-dark/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-ds-accent/70 hover:shadow-[0_0_20px_rgba(41,186,255,0.2)]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-45 transition duration-500 group-hover:scale-110 group-hover:opacity-65"
                  style={{ backgroundImage: `url('${zone.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02070d] via-[#02070d]/60 to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-end p-2.5 sm:p-3.5">
                  <span className="text-[10px] font-heading font-medium uppercase tracking-wider text-ds-accent line-clamp-1">
                    {zone.tag}
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-heading text-xs sm:text-sm lg:text-base font-extrabold uppercase tracking-wide text-white group-hover:text-ds-ice transition-colors truncate">
                      {zone.name}
                    </span>
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-ds-accent/50 text-ds-ice transition group-hover:bg-ds-accent group-hover:text-ds-dark group-hover:scale-105">
                      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
