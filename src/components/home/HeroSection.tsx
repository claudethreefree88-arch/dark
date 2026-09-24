'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, CirclePlay } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const zones = [
  { name: 'PS5 Arena', image: '/ps5-station.jpg', href: '/booking' },
  { name: 'PC Gaming', image: '/DD.png', href: '/facilities' },
  { name: 'Snooker Lounge', image: '/snooker-table.jpg', href: '/booking' },
  { name: 'Food & Lounge', image: '/DD.png', href: '/contact' },
];

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-ds-dark pt-28 sm:pt-32 lg:min-h-screen lg:pt-36">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center lg:bg-[center_top]"
        style={{ backgroundImage: "url('/DD.png')" }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,7,13,0.98)_0%,rgba(2,7,13,0.9)_29%,rgba(2,7,13,0.32)_62%,rgba(2,7,13,0.15)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[#02070d] via-[#02070d]/70 to-transparent" />

      <div className="mx-auto flex min-h-[650px] max-w-7xl flex-col justify-between px-5 pb-8 sm:px-8 lg:min-h-[calc(100vh-9rem)] lg:px-10">
        <div className="max-w-2xl pt-10 sm:pt-14 lg:pt-16">
          <h1 className="font-heading text-[clamp(4rem,9vw,8.75rem)] font-black uppercase leading-[0.76] tracking-[-0.07em] text-white drop-shadow-2xl">
            <span className="block">Play</span>
            <span className="block bg-gradient-to-r from-[#3299ff] via-[#18d6ea] to-[#58e0ef] bg-clip-text text-transparent">Beyond</span>
            <span className="block">Reality</span>
          </h1>

          <p className="mt-7 font-heading text-xs font-semibold uppercase tracking-[0.35em] text-ds-text-muted sm:text-sm">
            Consoles <span className="px-1.5 text-ds-accent">·</span> PC Gaming <span className="px-1.5 text-ds-accent">·</span> Snooker <span className="px-1.5 text-ds-accent">·</span> Good Vibes
          </p>
          <div className="mt-6 h-px w-32 bg-gradient-to-r from-ds-accent via-ds-accent/40 to-transparent" />

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/booking">
              <Button size="lg" variant="accent" className="rounded-full px-6 py-3 text-sm shadow-[0_0_28px_rgba(41,186,255,0.35)]">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Book Your Slot
                <ArrowRight className="ml-1.5 h-4 w-4 rounded-full bg-ds-dark p-0.5 text-ds-ice" />
              </Button>
            </Link>
            <Link href="/facilities" className="inline-flex items-center gap-2.5 rounded-full border border-ds-border-light/70 bg-ds-dark/45 px-5 py-3 font-heading text-sm font-semibold text-ds-text backdrop-blur-sm transition hover:border-ds-accent hover:text-ds-ice">
              <CirclePlay className="h-5 w-5 text-ds-accent" />
              Explore the arena
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-12 sm:grid-cols-4 sm:gap-4 lg:pt-0">
          {zones.map((zone) => (
            <Link key={zone.name} href={zone.href} className="group relative h-28 overflow-hidden rounded-2xl border border-ds-border-light/70 bg-ds-dark/70 shadow-2xl sm:h-36">
              <div className="absolute inset-0 bg-cover bg-center opacity-55 transition duration-500 group-hover:scale-110 group-hover:opacity-75" style={{ backgroundImage: `url('${zone.image}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02070d] via-[#02070d]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3.5">
                <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">{zone.name}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ds-accent/60 text-ds-ice transition group-hover:bg-ds-accent group-hover:text-ds-dark">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
