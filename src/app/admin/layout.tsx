'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Gamepad2,
  Calendar,
  Users,
  Tag,
  CreditCard,
  Shield,
  UserCog,
  MonitorPlay,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  Sparkles,
  BarChart3,
  Globe,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Executive Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Financial Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Station Inventory', href: '/admin/stations', icon: Gamepad2 },
    { name: 'All Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Customer Directory', href: '/admin/customers', icon: Users },
    { name: 'Promo Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Payments Ledger', href: '/admin/payments', icon: CreditCard },
    { name: 'Website CMS & Venue', href: '/admin/cms', icon: Globe },
    { name: 'Broadcast Alerts', href: '/admin/notifications', icon: Bell },
    { name: 'System Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Staff Accounts', href: '/admin/staff', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-ds-darker text-ds-text flex selection:bg-ds-accent selection:text-white">
      {/* Left Sidebar */}
      <aside className="w-64 bg-ds-dark/95 border-r border-ds-border flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 border-b border-ds-border">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-ds-surface flex items-center justify-center border border-ds-accent/40 shadow-inner">
                <Image src="/logo.svg" alt="Dark Syndicate" width={26} height={26} className="object-contain" />
              </div>
              <div>
                <span className="font-heading font-black text-sm uppercase tracking-wider text-ds-text group-hover:text-ds-ice transition-colors">
                  DARK SYNDICATE
                </span>
                <span className="text-[9px] font-mono tracking-widest text-ds-accent uppercase block font-bold">
                  COMMAND CENTER
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-ds-text-dim block mb-2">
              Management
            </span>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-ds-accent text-white shadow-md shadow-ds-accent/20'
                      : 'text-ds-text-muted hover:text-white hover:bg-ds-surface/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-ds-border/60 space-y-1.5">
              <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-ds-text-dim block mb-2">
                Operations & Front
              </span>
              <Link
                href="/staff"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ds-ice hover:bg-ds-surface/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <MonitorPlay className="w-4 h-4" />
                  <span className="font-heading font-bold uppercase">Staff Console Grid</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                href="/"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ds-text-dim hover:text-white hover:bg-ds-surface/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Public Arena Website</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </nav>

          {/* User Profile Badge */}
          <div className="p-4 border-t border-ds-border bg-ds-surface/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ds-accent/20 border border-ds-accent/40 text-ds-ice flex items-center justify-center font-heading font-bold text-xs">
                  {user?.firstName?.[0] || 'A'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-heading font-bold text-ds-text leading-tight">
                    {user?.firstName || 'System'} {user?.lastName || 'Admin'}
                  </p>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase">Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-ds-dark/80 backdrop-blur-md border-b border-ds-border px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="md:hidden font-heading font-black text-xs uppercase tracking-wider text-ds-text">
              DARK SYNDICATE
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-ds-text-dim">LIVE SYNDICATE NETWORK</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell role="ADMIN" />
            <Link
              href="/staff"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ds-surface border border-ds-accent/30 text-xs font-heading font-bold text-ds-ice hover:bg-ds-accent/20 transition-all"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Staff Floor View</span>
            </Link>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
