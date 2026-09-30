'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Calendar,
  CreditCard,
  LogOut,
  Gamepad2,
  ChevronRight,
  Shield,
  Sparkles,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/shared/NotificationBell';

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
    { name: 'Dashboard Overview', shortName: 'Overview', href: '/account', icon: Gamepad2 },
    { name: 'Syndicate Member Pass', shortName: 'Member Pass', href: '/account/membership', icon: Shield },
    { name: 'My Bookings & QR', shortName: 'Bookings & QR', href: '/account/bookings', icon: Calendar },
    { name: 'Notifications & Alerts', shortName: 'Alerts', href: '/account/notifications', icon: Bell },
    { name: 'Profile & Security', shortName: 'Profile', href: '/account/profile', icon: User },
    { name: 'Payment History', shortName: 'Payments', href: '/account/payments', icon: CreditCard },
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
      {/* ─── Dedicated Player Portal Header (Replaces marketing Navbar) ─── */}
      <header className="sticky top-0 z-30 bg-ds-dark/95 backdrop-blur-xl border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Top Bar */}
          <div className="flex lg:hidden items-center justify-between h-14">
            {/* User Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ds-primary to-ds-accent flex items-center justify-center text-xs font-heading font-extrabold text-ds-text shadow-glow-sm shrink-0">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'P'}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-heading font-bold text-ds-text truncate leading-tight">
                  {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'Player Portal'}
                </h1>
                <span className="text-[10px] font-mono text-ds-accent uppercase tracking-wider block leading-none">
                  Syndicate Member
                </span>
              </div>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-1.5">
              <NotificationBell role={user?.role} />

              <Link
                href="/"
                className="p-2 rounded-xl text-ds-text-dim hover:text-ds-ice hover:bg-ds-surface/60 transition-colors"
                title="Return to Public Website"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors shrink-0"
                title="Sign out of your account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Top Bar */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-ds-accent uppercase font-bold block">
                  SYNDICATE PLAYER HUB
                </span>
                <h1 className="text-lg font-heading font-bold text-ds-text">
                  Welcome back, {user?.firstName || 'Player'}
                </h1>
              </div>
              <Link
                href="/"
                className="text-xs text-ds-text-dim hover:text-ds-ice flex items-center gap-1 font-mono transition-colors pl-4 border-l border-ds-border/60"
              >
                <span>← Public Arena Website</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/booking"
                className="inline-flex px-3.5 py-1.5 rounded-xl bg-ds-accent hover:bg-ds-ice text-ds-dark font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow-glow-sm items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Book Station
              </Link>

              <NotificationBell role={user?.role} />

              <div className="flex items-center gap-2.5 pl-3 border-l border-ds-border/60">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ds-primary to-ds-accent flex items-center justify-center text-xs font-heading font-extrabold text-ds-text shadow-glow-sm shrink-0">
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'P'}
                </div>
                <div className="text-left text-xs min-w-0 max-w-[130px]">
                  <p className="font-heading font-bold text-ds-text truncate leading-tight">
                    {user?.firstName || 'Player'}
                  </p>
                  <p className="text-[10px] text-ds-text-dim truncate leading-none mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Horizontal Sub-Navigation Tabs (< lg) ─── */}
      <div className="lg:hidden sticky top-14 z-20 bg-ds-dark/95 backdrop-blur-md border-b border-ds-border/60 py-2.5 px-4 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold tracking-wide whitespace-nowrap transition-all shrink-0 active:scale-[0.98] ${
                active
                  ? 'bg-ds-accent text-ds-dark shadow-glow-sm'
                  : 'bg-ds-surface/70 border border-ds-border text-ds-text-muted hover:text-ds-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.shortName}</span>
            </Link>
          );
        })}
        {user?.role && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role) && (
          <Link
            href="/staff"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold tracking-wide whitespace-nowrap transition-all shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-400"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </Link>
        )}
      </div>

      {/* ─── Main Content Canvas ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-3 sticky top-24">
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

              {user?.role && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role) && (
                <Link
                  href="/staff"
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

          {/* Subpage Content */}
          <div className="w-full lg:col-span-9 min-w-0">
            {children}

            {/* Mobile Assistance Banner (At the bottom of content) */}
            <div className="mt-8 mb-4 lg:hidden p-4 rounded-2xl bg-ds-surface/40 border border-ds-border/60 text-xs flex items-center justify-between gap-3 text-ds-text-muted">
              <div>
                <p className="font-heading font-bold text-ds-text uppercase">Need Assistance?</p>
                <p className="text-[11px] text-ds-text-dim">Front desk hotline (10 AM – 12 AM)</p>
              </div>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-heading font-bold text-xs hover:bg-emerald-500/20 shrink-0"
              >
                WhatsApp Help →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
