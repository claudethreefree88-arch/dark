'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  Sparkles,
  Users,
  Tv,
  Headphones,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Station {
  id: string;
  name: string;
  stationType: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DEACTIVATED';
  pricePerHourPaise: number;
  capacity: number;
  specs: string;
  games: string[];
}

interface Facility {
  id: string;
  name: string;
  description: string;
  stations: Station[];
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PS5' | 'POOL_TABLE'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch('/api/facilities');
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setFacilities(data);
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFacilities();
  }, []);

  const allStations = facilities.flatMap((f) =>
    f.stations.map((s) => ({ ...s, facilityName: f.name }))
  );

  const filteredStations = allStations.filter((station) => {
    if (selectedCategory === 'ALL') return true;
    return station.stationType === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-ds-dark text-ds-text selection:bg-ds-accent selection:text-ds-dark flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ds-surface border border-ds-accent/30 text-xs font-heading font-bold uppercase tracking-[0.2em] text-ds-ice">
              <Layers className="w-3.5 h-3.5 text-ds-accent" />
              Arena Stations & Tables
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold tracking-tight uppercase">
              GAMING <span className="gradient-text">ZONES & FACILITIES</span>
            </h1>
            <p className="text-ds-text-muted text-base sm:text-lg">
              Explore our fleet of PlayStation 5 Pro consoles, tournament-grade billiards tables, and luxury VIP lounges. All stations feature real-time live availability.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-5 py-2.5 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-ds-accent text-ds-dark shadow-glow'
                  : 'bg-ds-surface border border-ds-border text-ds-text-muted hover:text-ds-text'
              }`}
            >
              All Zones ({allStations.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('PS5')}
              className={`px-5 py-2.5 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedCategory === 'PS5'
                  ? 'bg-ds-accent text-ds-dark shadow-glow'
                  : 'bg-ds-surface border border-ds-border text-ds-text-muted hover:text-ds-text'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              PlayStation 5 Pro
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('POOL_TABLE')}
              className={`px-5 py-2.5 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedCategory === 'POOL_TABLE'
                  ? 'bg-ds-accent text-ds-dark shadow-glow'
                  : 'bg-ds-surface border border-ds-border text-ds-text-muted hover:text-ds-text'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Tournament Pool Tables
            </button>
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStations.map((station) => (
              <Card
                key={station.id}
                hover
                glass
                className="p-6 flex flex-col justify-between border-ds-border hover:border-ds-accent/50 transition-all relative group"
              >
                <div className="space-y-4">
                  {/* Status & Price Pill */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        station.status === 'AVAILABLE'
                          ? 'success'
                          : station.status === 'OCCUPIED'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {station.status === 'AVAILABLE' ? '🟢 Available' : '🟡 In Session'}
                    </Badge>
                    <div className="text-right">
                      <span className="text-xl font-heading font-extrabold text-ds-ice">
                        ₹{(station.pricePerHourPaise / 100).toFixed(0)}
                      </span>
                      <span className="text-xs text-ds-text-dim"> / hour</span>
                    </div>
                  </div>

                  {/* Station Title */}
                  <div>
                    <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent">
                      {station.facilityName}
                    </span>
                    <h3 className="text-xl font-heading font-bold text-ds-text group-hover:text-ds-ice transition-colors mt-0.5">
                      {station.name}
                    </h3>
                  </div>

                  {/* Specs */}
                  <div className="p-3 rounded-lg bg-ds-dark/60 border border-ds-border/60 text-xs text-ds-text-muted space-y-1.5">
                    <p className="font-semibold text-ds-text">Hardware & Setup:</p>
                    <p className="leading-relaxed">{station.specs}</p>
                  </div>

                  {/* Features / Details */}
                  <div className="flex items-center gap-4 text-xs text-ds-text-dim">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-ds-accent" />
                      {station.capacity} Player{station.capacity > 1 ? 's' : ''} Capacity
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ds-accent" />
                      Hourly or Passes
                    </span>
                  </div>

                  {/* Popular Games on this station */}
                  {station.games && station.games.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
                        Featured Games:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {station.games.slice(0, 4).map((game) => (
                          <span
                            key={game}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-ds-border/50 text-ds-text-muted"
                          >
                            {game}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="pt-6 mt-4 border-t border-ds-border/60">
                  <Link href={`/booking?stationId=${station.id}`} className="block w-full">
                    <Button
                      variant={station.status === 'AVAILABLE' ? 'accent' : 'secondary'}
                      className="w-full justify-center"
                    >
                      <span>Book This Station</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Amenities Callout */}
          <section className="mt-16 p-8 rounded-2xl bg-ds-surface/40 border border-ds-border">
            <h3 className="text-xl font-heading font-bold text-ds-text uppercase mb-6 text-center">
              Standard Amenities Included With Every Booking
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-sm">
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h5 className="font-heading font-bold text-ds-text">High-Speed LAN</h5>
                <p className="text-xs text-ds-text-muted">Gigabit low-latency connectivity</p>
              </div>
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h5 className="font-heading font-bold text-ds-text">Sanitised Gear</h5>
                <p className="text-xs text-ds-text-muted">Controllers wiped after every session</p>
              </div>
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h5 className="font-heading font-bold text-ds-text">Refreshment Bar</h5>
                <p className="text-xs text-ds-text-muted">Snacks & drinks served directly to seat</p>
              </div>
              <div className="space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h5 className="font-heading font-bold text-ds-text">Air Conditioned</h5>
                <p className="text-xs text-ds-text-muted">Climate-controlled arena all year round</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
