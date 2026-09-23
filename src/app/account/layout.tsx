'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Gamepad2,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  const navItems = [
    { name: 'Dashboard Overview', href: '/account', icon: Gamepad2 },
    { name: 'My Bookings & QR', href: '/account/bookings', icon: Calendar },
    { name: 'Notifications & Alerts', href: '/account/notifications', icon: Bell },
    { name: 'Profile & Security', href: '/account/profile', icon: User },
    { name: 'Payment History', href: '/account/payments', icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === '/account') return pathname === '/account';
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ds-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ds-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-dark text-ds-text selection:bg-ds-accent selection:text-ds-dark flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8 p-6 rounded-2xl bg-ds-surface/60 border border-ds-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ds-primary to-ds-accent flex items-center justify-center text-xl font-heading font-extrabold text-ds-text shadow-glow-sm">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'P'}
              </div>
              <div>
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-ds-accent">
                  Syndicate Member Portal
                </span>
                <h2 className="text-2xl font-heading font-bold text-ds-text">
                  Welcome back, {user?.firstName || 'Player'}
                </h2>
                <p className="text-xs text-ds-text-muted mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/booking"
                className="px-4 py-2 rounded-xl bg-ds-accent hover:bg-ds-ice text-ds-dark font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow-glow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Book Station
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-2">
              <nav className="p-2 rounded-2xl bg-ds-surface/50 border border-ds-border space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-heading font-semibold text-sm transition-all ${
                        isActive(item.href)
                          ? 'bg-ds-accent text-ds-dark shadow-glow-sm'
                          : 'text-ds-text-muted hover:text-ds-text hover:bg-ds-border/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60" />
                    </Link>
                  );
                })}

                {user && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role) && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between px-3.5 py-3 rounded-xl font-heading font-semibold text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4" />
                      <span>Staff Operations</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </Link>
                )}

                <div className="my-1 border-t border-ds-border/60" />

                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl font-heading font-semibold text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </nav>

              {/* Arena Info Box */}
              <div className="p-4 rounded-2xl bg-ds-dark/60 border border-ds-border text-xs space-y-2 text-ds-text-muted">
                <p className="font-heading font-bold text-ds-text uppercase">Need Assistance?</p>
                <p>Front desk hotline is active during all open hours (10 AM - 12 AM).</p>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-semibold block hover:underline"
                >
                  WhatsApp Help Desk →
                </a>
              </div>
            </aside>

            {/* Portal Content Area */}
            <div className="lg:col-span-9">{children}</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
