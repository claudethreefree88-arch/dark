import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-ds-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-ds-accent/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ds-secondary/5 rounded-full blur-[200px]" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {/* Logo */}
        <div className="animate-fade-in-down mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary shadow-glow-strong animate-pulse-glow">
            <Gamepad2 className="w-12 h-12 text-ds-accent" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="animate-fade-in-up text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-wider mb-4">
          <span className="text-ds-text">DARK </span>
          <span className="gradient-text text-glow">SYNDICATE</span>
        </h1>

        <p className="animate-fade-in-up delay-100 text-lg sm:text-xl md:text-2xl font-heading font-semibold text-ds-text-muted tracking-[0.15em] mb-2">
          GAMING WORLD
        </p>

        {/* Tagline */}
        <p className="animate-fade-in-up delay-200 text-xl sm:text-2xl md:text-3xl font-heading font-bold text-ds-ice tracking-widest mt-6 mb-3">
          ENTER THE GAME. OWN THE NIGHT.
        </p>

        <p className="animate-fade-in-up delay-300 text-base sm:text-lg text-ds-text-muted max-w-xl mx-auto mb-10">
          Premium gaming experience with PS5, pool tables, and more.
          Book your session and dominate the arena.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row gap-4">
          <Link href="/booking">
            <Button size="lg" variant="accent" className="text-lg px-8">
              Book Your Session
            </Button>
          </Link>
          <Link href="/facilities">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Explore Gaming Zones
            </Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce text-ds-text-dim">
          <div className="w-6 h-10 border-2 border-ds-border-light rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-ds-accent rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="relative py-12 border-t border-ds-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '6+', label: 'PS5 Stations' },
              { value: '3', label: 'Pool Tables' },
              { value: '4K', label: 'Gaming Displays' },
              { value: '24/7', label: 'Gaming Support' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-heading font-extrabold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-ds-text-muted font-body font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 border-t border-ds-border">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-center text-ds-text mb-4">
            HOW IT <span className="gradient-text">WORKS</span>
          </h2>
          <p className="text-center text-ds-text-muted mb-12 max-w-xl mx-auto">
            Book your gaming session in 4 simple steps
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Choose Your Game',
                desc: 'Select from PS5, pool tables, or other gaming options.',
              },
              {
                step: '02',
                title: 'Pick a Slot',
                desc: 'Choose your preferred date, time, and session duration.',
              },
              {
                step: '03',
                title: 'Confirm & Pay',
                desc: 'Secure your booking with online payment or pay at the venue.',
              },
              {
                step: '04',
                title: 'Play & Dominate',
                desc: 'Show your QR code at check-in and start your gaming session.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative glass rounded-xl p-6 text-center hover-lift animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <div className="text-5xl font-heading font-extrabold gradient-text opacity-30 mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-heading font-bold text-ds-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-ds-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-ds-text mb-4">
            READY TO <span className="gradient-text">PLAY?</span>
          </h2>
          <p className="text-ds-text-muted text-lg mb-8 max-w-xl mx-auto">
            Book your gaming session now and experience the ultimate
            entertainment at Dark Syndicate Gaming World.
          </p>
          <Link href="/booking">
            <Button size="lg" variant="accent" className="text-lg px-10">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ds-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-ds-accent" />
            <span className="font-heading font-bold text-ds-text tracking-wider">
              DARK SYNDICATE
            </span>
          </div>
          <p className="text-xs text-ds-text-dim">
            © {new Date().getFullYear()} Dark Syndicate Gaming World. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
