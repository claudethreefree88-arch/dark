'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Gamepad2,
  Calendar,
  Shield,
  Clock,
  Sparkles,
  Layers,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/staff', label: 'Live Station Grid', icon: Gamepad2 },
    { href: '/staff/bookings', label: "Today's Schedule", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-ds-darker text-ds-text flex flex-col selection:bg-ds-accent selection:text-white">
      {/* Top Staff Operations Bar */}
      <header className="sticky top-0 z-40 bg-ds-dark/95 backdrop-blur-md border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <Link href="/staff" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-ds-surface flex items-center justify-center border border-ds-accent/40 shadow-inner">
                <Image src="/logo.svg" alt="Dark Syndicate" width={22} height={22} className="object-contain" />
              </div>
              <div>
                <span className="font-heading font-black text-sm uppercase tracking-wider text-ds-text group-hover:text-ds-ice transition-colors">
                  DARK SYNDICATE
                </span>
                <span className="text-[9px] font-mono tracking-widest text-ds-accent uppercase block font-bold">
                  STAFF PORTAL
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block w-px h-6 bg-ds-border mx-2" />

            {/* Live Status indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ARENA ACTIVE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-ds-surface text-ds-ice border border-ds-accent/40 shadow-sm'
                      : 'text-ds-text-muted hover:text-white hover:bg-ds-surface/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            <span className="w-px h-5 bg-ds-border mx-1" />

            {/* Switch to Admin link */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-ds-accent hover:bg-ds-accent/10 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin Panel</span>
            </Link>
          </nav>

          {/* Right Clock, Notifications & User */}
          <div className="flex items-center gap-3">
            <NotificationBell role="STAFF" />

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ds-surface/60 border border-ds-border text-xs font-mono text-ds-text-dim">
              <Clock className="w-3.5 h-3.5 text-ds-accent" />
              <span>{timeStr || '10:00:00 AM'} IST</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-ds-accent/20 border border-ds-accent/40 flex items-center justify-center font-heading font-bold text-xs text-ds-ice">
                {user?.firstName?.[0] || 'S'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <p className="font-heading font-bold leading-tight">
                  {user?.firstName || 'Staff'} {user?.lastName || 'Operator'}
                </p>
                <p className="text-[10px] text-ds-text-dim uppercase font-mono">Shift Operator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Staff Content */}
      <main className="flex-1 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
