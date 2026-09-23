import Image from 'next/image';
import Link from 'next/link';
import {
  Gamepad2,
  Sparkles,
  Calendar,
  Clock,
  Shield,
  Award,
  ChevronRight,
  Flame,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Tv,
  Headphones,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const flagshipGames = [
    { name: 'EA Sports FC 24', genre: 'Sports / Soccer', players: '1-4 Players', tag: 'Top Played' },
    { name: 'Tekken 8', genre: 'Fighting / Versus', players: '1-2 Players', tag: 'Tournament' },
    { name: 'Marvel’s Spider-Man 2', genre: 'Action / Adventure', players: '1 Player', tag: 'Story Pick' },
    { name: 'God of War Ragnarök', genre: 'Mythic Action', players: '1 Player', tag: '4K 120Hz' },
    { name: 'Mortal Kombat 1', genre: 'Versus Fighter', players: '1-2 Players', tag: 'Competitive' },
    { name: 'Gran Turismo 7', genre: 'Racing Simulator', players: '1 Player', tag: 'Wheel Rig' },
  ];

  const testimonials = [
    {
      name: 'Aditya Verma',
      tag: 'Competitive Gamer',
      comment:
        'The PS5 Pro setup with 4K 120Hz OLEDs is mindblowing. Zero input lag, insane graphics, and the best venue for FIFA tournaments in town!',
      rating: 5,
    },
    {
      name: 'Siddharth Rao',
      tag: 'Pool Enthusiast',
      comment:
        'The pool tables are genuine tournament grade. Italian slate, Simonis cloth, and the LED canopy lighting makes cueing flawless.',
      rating: 5,
    },
    {
      name: 'Kavya & Group',
      tag: 'Weekend Squad',
      comment:
        'We booked the 4-player lounge for 3 hours. Seamless online booking, instant QR check-in, and great snacks service right at our station.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-ds-dark text-ds-text selection:bg-ds-accent selection:text-ds-dark flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero Section ────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center justify-center pt-32 sm:pt-36 pb-16 px-4 overflow-hidden">
          {/* Futuristic Background Gradients & Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-ds-primary/20 rounded-full blur-[160px]" />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-ds-accent/15 rounded-full blur-[140px]" />
            <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-ds-secondary/25 rounded-full blur-[180px]" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #79BDE9 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative max-w-5xl mx-auto text-center z-10 space-y-6">
            {/* Brand Logo with Glow Halo */}
            <div className="inline-flex items-center justify-center p-2 rounded-3xl bg-ds-surface/60 backdrop-blur-xl border border-ds-accent/40 shadow-glow animate-fade-in-down mb-2">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-ds-dark/90 p-2 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="DARK SYNDICATE Logo"
                  width={128}
                  height={128}
                  priority
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(97,173,223,0.6)]"
                />
              </div>
            </div>

            {/* Sub-pill */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ds-surface border border-ds-accent/30 text-xs sm:text-sm font-heading font-bold uppercase tracking-[0.2em] text-ds-ice shadow-glow-sm">
                <Flame className="w-4 h-4 text-ds-accent animate-pulse" />
                Premier Esports & Billiards Arena
              </span>
            </div>

            {/* Brand Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight uppercase leading-none">
              <span className="text-ds-text">DARK </span>
              <span className="gradient-text text-glow">SYNDICATE</span>
              <span className="block text-2xl sm:text-3xl md:text-4xl text-ds-text-muted font-heading font-medium tracking-[0.25em] mt-2">
                GAMING WORLD
              </span>
            </h1>

            {/* Iconic Tagline */}
            <p className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-ds-ice tracking-widest uppercase">
              ENTER THE GAME. OWN THE NIGHT.
            </p>

            <p className="text-ds-text-muted text-base sm:text-lg max-w-2xl mx-auto font-body leading-relaxed">
              Step into an icy-dark, high-voltage gaming sanctum. Ultra-smooth 4K 120Hz PlayStation 5 Pro battle stations, championship slate pool tables, and elite esports competition.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/booking" className="w-full sm:w-auto">
                <Button size="lg" variant="accent" className="w-full sm:w-auto text-base px-8 py-6 shadow-glow">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Book Your Session
                </Button>
              </Link>
              <Link href="/facilities" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Explore Gaming Zones
                </Button>
              </Link>
            </div>

            {/* Highlights ticker */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ds-text-muted font-heading uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant QR Check-in
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-ds-accent" /> 4K 120Hz OLED Displays
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-ds-ice" /> Zero Double-Booking Guarantee
              </span>
            </div>
          </div>
        </section>

        {/* ─── Live Stats Bar ──────────────────────────────────────── */}
        <section className="relative py-10 bg-ds-surface/50 border-y border-ds-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '8+', label: 'PS5 Pro Consoles', sub: 'Custom Gaming Rigs' },
                { value: '3', label: 'Tournament Pool Tables', sub: 'Simonis 860 Cloth' },
                { value: '4K @ 120Hz', label: 'OLED Refresh Rate', sub: 'Zero Motion Blur' },
                { value: '250+', label: 'Digital AAA Library', sub: 'Latest Released Titles' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-ds-dark/40 border border-ds-border/60">
                  <div className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-sm font-heading font-bold text-ds-text uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-ds-text-dim mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Gaming Zones ───────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-heading font-bold uppercase tracking-[0.25em] text-ds-accent">
              World-Class Facilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-ds-text uppercase">
              CHOOSE YOUR <span className="gradient-text">BATTLEGROUND</span>
            </h2>
            <p className="text-ds-text-muted text-base">
              Engineered for competitive players and relaxed friend hangouts alike. Each station is equipped with benchmark-setting hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Zone 1: PS5 Pro Arena */}
            <Card hover glass className="p-8 border-ds-accent/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gamepad2 className="w-36 h-36 text-ds-accent" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">PlayStation 5</Badge>
                  <span className="text-lg font-heading font-bold text-ds-ice">From ₹200 / hr</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-ds-text">
                    PS5 Pro Battle Stations
                  </h3>
                  <p className="text-ds-text-muted text-sm mt-2 leading-relaxed">
                    Flagship Sony PlayStation 5 consoles paired with high-end 55-inch LG OLED TVs running at pure 4K 120FPS with ray-tracing enabled.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-ds-text-muted">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-ds-accent" />
                    <span>55" 4K 120Hz OLEDs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-ds-accent" />
                    <span>DualSense Wireless</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-ds-accent" />
                    <span>SteelSeries 3D Audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ds-accent" />
                    <span>1 to 4 Players / Station</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link href="/facilities">
                    <Button variant="outline" size="sm">
                      View Stations
                    </Button>
                  </Link>
                  <Link href="/booking">
                    <Button variant="accent" size="sm">
                      Book PS5 Zone <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Zone 2: Billiards & Pool */}
            <Card hover glass className="p-8 border-ds-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-36 h-36 text-ds-ice" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Billiards & Pool</Badge>
                  <span className="text-lg font-heading font-bold text-ds-ice">From ₹250 / hr</span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-ds-text">
                    Championship Pool Lounge
                  </h3>
                  <p className="text-ds-text-muted text-sm mt-2 leading-relaxed">
                    Tournament-certified 8ft Italian slate pool tables fitted with authentic Simonis tournament cloth and Belgian Aramith billiard balls.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-ds-text-muted">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-ds-ice" />
                    <span>Italian Slate Bed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ds-ice" />
                    <span>Aramith Pro Balls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-ds-ice" />
                    <span>Shadowless LED Canopy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ds-ice" />
                    <span>Up to 6 Players / Table</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link href="/facilities">
                    <Button variant="outline" size="sm">
                      View Tables
                    </Button>
                  </Link>
                  <Link href="/booking">
                    <Button variant="secondary" size="sm">
                      Book Pool Table <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ─── Flagship Games Grid ─────────────────────────────────── */}
        <section className="py-16 bg-ds-surface/30 border-y border-ds-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-heading font-bold uppercase tracking-[0.25em] text-ds-accent">
                  Latest Releases
                </span>
                <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-ds-text uppercase mt-1">
                  POPULAR <span className="gradient-text">TITLES IN ROTATION</span>
                </h2>
              </div>
              <p className="text-sm text-ds-text-muted max-w-md">
                Over 250+ PlayStation 5 titles installed and ready to launch instantly with cloud saves enabled.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {flagshipGames.map((game) => (
                <div
                  key={game.name}
                  className="p-5 rounded-xl bg-ds-dark/70 border border-ds-border hover:border-ds-accent/40 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-ds-accent">
                        {game.genre}
                      </span>
                      <h4 className="text-lg font-heading font-bold text-ds-text group-hover:text-ds-ice transition-colors mt-0.5">
                        {game.name}
                      </h4>
                    </div>
                    <Badge variant="accent" size="sm">
                      {game.tag}
                    </Badge>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ds-border/60 flex items-center justify-between text-xs text-ds-text-dim">
                    <span>{game.players}</span>
                    <span className="text-ds-ice font-medium">Ready on all stations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-heading font-bold uppercase tracking-[0.25em] text-ds-accent">
              Frictionless Experience
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-ds-text uppercase">
              HOW IT <span className="gradient-text">WORKS</span>
            </h2>
            <p className="text-ds-text-muted text-sm sm:text-base">
              Reserve your gaming station in 4 effortless steps with instant digital verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Pick Station',
                desc: 'Select PS5 Pro console, Pool Table, or Private VIP Lounge.',
                icon: Gamepad2,
              },
              {
                step: '02',
                title: 'Select Time Slot',
                desc: 'Choose date, start time, and session duration with live availability.',
                icon: Calendar,
              },
              {
                step: '03',
                title: 'Receive QR Pass',
                desc: 'Instant booking reference and digital check-in QR pass sent to your portal.',
                icon: Sparkles,
              },
              {
                step: '04',
                title: 'Walk In & Game',
                desc: 'Scan your QR pass at the entrance counter and jump straight into action.',
                icon: Award,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-ds-surface/60 border border-ds-border hover:border-ds-accent/40 relative overflow-hidden group transition-all"
              >
                <div className="text-4xl font-heading font-black text-ds-border/70 group-hover:text-ds-accent/30 transition-colors">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 text-ds-accent mt-3 mb-4" />
                <h4 className="text-xl font-heading font-bold text-ds-text uppercase">{item.title}</h4>
                <p className="text-ds-text-muted text-xs sm:text-sm mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Customer Testimonials ──────────────────────────────── */}
        <section className="py-20 bg-ds-surface/40 border-t border-ds-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="text-xs font-heading font-bold uppercase tracking-[0.25em] text-ds-accent">
                Player Reviews
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-ds-text uppercase">
                TESTED BY THE <span className="gradient-text">COMMUNITY</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <Card key={t.name} glass className="p-6 space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-ds-text-muted text-sm italic leading-relaxed">
                    "{t.comment}"
                  </p>
                  <div className="pt-2 border-t border-ds-border/60">
                    <h5 className="font-heading font-bold text-ds-text text-sm">{t.name}</h5>
                    <span className="text-xs text-ds-accent font-medium">{t.tag}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Location & Hours Callout ────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-ds-surface via-ds-surface/80 to-ds-dark border border-ds-accent/30 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-ds-accent/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge variant="accent">Arena Operations</Badge>
                <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-ds-text uppercase">
                  READY TO ENTER <span className="gradient-text">THE SYNDICATE?</span>
                </h3>
                <p className="text-ds-text-muted text-sm sm:text-base leading-relaxed">
                  Located conveniently in the central gaming district. Walk-ins are always welcome, but advance online reservations guarantee your preferred console and table slot.
                </p>

                <div className="space-y-2 text-sm pt-2">
                  <div className="flex items-center gap-2 text-ds-text">
                    <Clock className="w-4 h-4 text-ds-accent" />
                    <span>Open 7 Days: 10:00 AM – 12:00 AM Midnight</span>
                  </div>
                  <div className="flex items-center gap-2 text-ds-text">
                    <MapPin className="w-4 h-4 text-ds-accent" />
                    <span>Dark Syndicate Arena, Main Commercial Hub</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Link href="/booking">
                    <Button variant="accent" size="lg">
                      Book Now Online
                    </Button>
                  </Link>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
                    <Button variant="outline" size="lg">
                      <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                      WhatsApp Quick Chat
                    </Button>
                  </a>
                </div>
              </div>

              {/* Quick Hours Summary Card */}
              <div className="p-6 rounded-2xl bg-ds-dark/80 border border-ds-border space-y-4">
                <h4 className="font-heading font-bold text-lg text-ds-ice uppercase">
                  Arena Timetable & Rates
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-ds-border/60">
                    <span className="text-ds-text-muted">Happy Hours (Mon-Thu 11 AM-4 PM)</span>
                    <span className="text-emerald-400 font-bold">15% OFF</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-ds-border/60">
                    <span className="text-ds-text-muted">PS5 Pro Hourly</span>
                    <span className="text-ds-text font-bold">₹200 / hr</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-ds-border/60">
                    <span className="text-ds-text-muted">Championship Pool Table</span>
                    <span className="text-ds-text font-bold">₹250 / hr</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-ds-text-muted">All-Night LAN Pass (6 Hours)</span>
                    <span className="text-ds-ice font-bold">₹900 Flat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
