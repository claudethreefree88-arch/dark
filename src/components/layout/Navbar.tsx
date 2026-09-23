'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Gamepad2,
  Calendar,
  Layers,
  Tag,
  Mail,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  // Scroll detection for enhanced glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Gaming Zones', href: '/facilities' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-ds-surface/90 backdrop-blur-md border-b border-ds-border shadow-lg shadow-black/40 py-3'
          : 'bg-gradient-to-b from-ds-dark/95 via-ds-dark/80 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-ds-accent/30 p-0.5 bg-ds-dark group-hover:border-ds-accent transition-all duration-300 shadow-glow">
              <Image
                src="/logo.png"
                alt="DARK SYNDICATE"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-ds-text leading-tight group-hover:text-ds-ice transition-colors">
                DARK <span className="gradient-text">SYNDICATE</span>
              </span>
              <span className="font-heading font-semibold text-[10px] text-ds-accent tracking-[0.2em] uppercase leading-none">
                Gaming World
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 rounded-lg font-heading text-sm uppercase tracking-wider font-semibold transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-ds-ice bg-ds-accent/10 border border-ds-accent/30 shadow-glow-sm'
                    : 'text-ds-text-muted hover:text-ds-text hover:bg-ds-border/50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Venue Status & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-heading font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>OPEN NOW</span>
            </div>

            {/* Authentication / User Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ds-surface border border-ds-border hover:border-ds-border-light text-ds-text transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-ds-primary flex items-center justify-center text-xs font-heading font-bold text-ds-ice">
                    {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-heading font-medium max-w-[100px] truncate">
                    {user.firstName || 'Player'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-ds-text-muted" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-ds-surface/95 backdrop-blur-xl border border-ds-border shadow-2xl p-1.5 z-50 animate-fade-in-down">
                    <div className="px-3 py-2 border-b border-ds-border/60 mb-1">
                      <p className="text-xs text-ds-text-muted">Signed in as</p>
                      <p className="text-sm font-semibold text-ds-text truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-heading font-bold uppercase bg-ds-accent/15 text-ds-ice">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ds-text-muted hover:text-ds-text hover:bg-ds-border/50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-ds-accent" />
                      <span>My Portal</span>
                    </Link>

                    <Link
                      href="/account/bookings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ds-text-muted hover:text-ds-text hover:bg-ds-border/50 rounded-lg transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-ds-ice" />
                      <span>My Bookings</span>
                    </Link>

                    {['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role) && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Staff Panel</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-ds-border/60" />

                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/booking">
                  <Button variant="accent" size="sm" className="shadow-glow-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Book Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/booking">
              <Button variant="accent" size="sm" className="text-xs px-2.5 py-1">
                Book
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-ds-surface border border-ds-border text-ds-text-muted hover:text-ds-text"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ds-dark/95 backdrop-blur-2xl border-b border-ds-border px-4 py-5 space-y-3 animate-fade-in-down">
          {/* Live Status indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-ds-border/60 text-xs">
            <span className="text-ds-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-ds-accent" /> Hours: 10 AM – 12 AM
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Open Now
            </span>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-3 py-2.5 rounded-lg font-heading text-base uppercase tracking-wider font-semibold ${
                  isActive(link.href)
                    ? 'text-ds-ice bg-ds-accent/15 border border-ds-accent/30'
                    : 'text-ds-text-muted hover:text-ds-text hover:bg-ds-border/40'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-ds-border/60 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-3 py-2 text-ds-text font-medium rounded-lg hover:bg-ds-border/40"
                >
                  <User className="w-4 h-4 text-ds-accent" />
                  <span>My Portal ({user.firstName || user.email})</span>
                </Link>
                <Link
                  href="/account/bookings"
                  className="flex items-center gap-2 px-3 py-2 text-ds-text font-medium rounded-lg hover:bg-ds-border/40"
                >
                  <Calendar className="w-4 h-4 text-ds-ice" />
                  <span>My Bookings</span>
                </Link>
                {['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2 text-amber-400 font-medium rounded-lg hover:bg-amber-500/10"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Staff Panel</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 font-medium rounded-lg hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="secondary" className="w-full text-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
