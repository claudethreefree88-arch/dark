'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Modal } from '@/components/ui/Modal';

interface StationGameDetail {
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
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DEACTIVATED';
  pricePerHourPaise: number;
  capacity: number;
  specs: string;
  games: string[];
  gameDetails?: StationGameDetail[];
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
  const [viewingStationGames, setViewingStationGames] = useState<Station | null>(null);

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

      <main className="flex-1 pt-32 sm:pt-36 pb-20">
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
              Explore our 3 PlayStation 5 battle stations and 3 championship snooker tables. All stations feature real-time live availability.
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
              Snooker Tables
            </button>
          </div>

          {/* Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStations.map((station) => (
              <Card
                key={station.id}
                hover
                glass
                className="overflow-hidden flex flex-col justify-between border-ds-border hover:border-ds-accent/50 transition-all relative group p-0"
              >
                <div>
                  {/* Top Image Banner */}
                  <div className="relative w-full h-52 bg-ds-dark overflow-hidden">
                    <Image
                      src={station.stationType === 'PS5' ? '/ps5-station.jpg' : '/snooker-table.jpg'}
                      alt={station.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ds-surface via-black/20 to-black/60" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={
                          station.status === 'AVAILABLE'
                            ? 'success'
                            : station.status === 'OCCUPIED'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                        className="backdrop-blur-md shadow-md"
                      >
                        {station.status === 'AVAILABLE' ? '🟢 Available' : '🟡 In Session'}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md border border-white/20 text-ds-ice shadow-sm">
                        {station.stationType === 'PS5' ? 'PlayStation 5' : 'Snooker Table'}
                      </span>
                    </div>

                    {/* Bottom image overlay specs info: Capacity & Hourly */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                      <span className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                        <Users className="w-3.5 h-3.5 text-ds-accent" />
                        <span>{station.capacity} Player{station.capacity > 1 ? 's' : ''} Max</span>
                      </span>
                      <span className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-medium">
                        <Clock className="w-3.5 h-3.5 text-ds-accent" />
                        <span>Hourly Booking</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Details Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Station Title & Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-accent block">
                          {station.facilityName}
                        </span>
                        <h3 className="text-xl font-heading font-extrabold text-ds-text group-hover:text-ds-ice transition-colors mt-0.5">
                          {station.name}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-heading font-black text-ds-ice">
                          {station.stationType === 'PS5' ? 'From ₹150' : '₹250'}
                        </span>
                        <span className="text-xs text-ds-text-dim"> / hr</span>
                      </div>
                    </div>

                    {/* Rate Tier Strip */}
                    <div className="px-3.5 py-2 rounded-xl bg-ds-dark/70 border border-ds-border/60 text-xs flex items-center justify-between text-ds-text-muted">
                      <span className="font-mono text-[11px] text-ds-text font-medium">
                        {station.stationType === 'PS5'
                          ? '1P: ₹150 · 2P: ₹200 · 3-4P: ₹250'
                          : '3-4 players included · +₹50/extra person'}
                      </span>
                    </div>

                    {/* Installed Games on this station */}
                    {station.games && station.games.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-ds-border/40">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent flex items-center gap-1.5">
                            <Gamepad2 className="w-3.5 h-3.5 text-ds-accent" />
                            <span>Installed Games ({station.games.length}):</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setViewingStationGames(station)}
                            className="text-[11px] font-mono font-medium text-ds-ice hover:text-ds-accent underline cursor-pointer"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {station.games.slice(0, 4).map((game) => (
                            <span
                              key={game}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-ds-dark border border-ds-border/70 text-ds-text"
                            >
                              {game}
                            </span>
                          ))}
                          {station.games.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setViewingStationGames(station)}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-ds-accent/15 border border-ds-accent/40 text-ds-ice hover:bg-ds-accent/25 transition-colors cursor-pointer"
                            >
                              +{station.games.length - 4} more
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-5 sm:p-6 pt-0">
                  <Link href={`/booking?stationId=${station.id}`} className="block w-full">
                    <Button
                      variant={station.status === 'AVAILABLE' ? 'accent' : 'secondary'}
                      className="w-full justify-center py-2.5 font-heading font-bold uppercase tracking-wider text-xs"
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

      {/* Station Games Inspection Modal */}
      <Modal
        isOpen={!!viewingStationGames}
        onClose={() => setViewingStationGames(null)}
        title={`Games Library: ${viewingStationGames?.name || 'Station'}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-ds-dark border border-ds-border">
            <div>
              <span className="text-xs font-mono uppercase text-ds-accent font-bold">
                {viewingStationGames?.stationType === 'PS5' ? 'PlayStation 5 Console' : 'Championship Table'}
              </span>
              <p className="text-xs text-ds-text-muted mt-0.5">
                {viewingStationGames?.games.length || 0} titles ready to play on this station.
              </p>
            </div>
            <Link href={`/booking?stationId=${viewingStationGames?.id}`} onClick={() => setViewingStationGames(null)}>
              <Button variant="accent" size="sm">
                <span>Book This Station</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {viewingStationGames?.gameDetails && viewingStationGames.gameDetails.length > 0 ? (
              viewingStationGames.gameDetails.map((game) => (
                <div
                  key={game.id}
                  className="p-3 rounded-xl bg-ds-dark/70 border border-ds-border hover:border-ds-accent/40 transition-colors flex gap-3 items-center"
                >
                  <div className="w-14 h-16 rounded-lg bg-ds-surface overflow-hidden shrink-0">
                    {game.coverImage ? (
                      <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ds-text-dim">
                        <Gamepad2 className="w-6 h-6 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase text-ds-accent font-bold">
                        {game.genre || 'Game'}
                      </span>
                      {game.isFeatured && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-xs text-ds-text truncate">{game.title}</h4>
                    <p className="text-[10px] text-ds-text-dim flex items-center gap-1">
                      <Users className="w-3 h-3 text-ds-accent" />
                      <span>{game.maxPlayers === 1 ? '1 Player' : `Up to ${game.maxPlayers} Players`}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              (viewingStationGames?.games || []).map((gameTitle, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-ds-dark/70 border border-ds-border flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-ds-accent/10 border border-ds-accent/30 flex items-center justify-center text-ds-accent shrink-0">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-xs text-ds-text truncate">{gameTitle}</h4>
                    <span className="text-[10px] font-mono text-emerald-400">Ready to play</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 flex justify-end border-t border-ds-border/60">
            <Button variant="outline" size="sm" onClick={() => setViewingStationGames(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
