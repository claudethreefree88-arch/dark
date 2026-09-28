'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  Volume2,
  VolumeX,
  X,
  PlusCircle,
  Square,
  Gamepad2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExtendSessionModal } from '@/components/staff/ExtendSessionModal';
import { EndSessionModal, type EndSessionTarget } from '@/components/staff/EndSessionModal';

export interface ActiveSessionData {
  stationId: string;
  stationName: string;
  pricePerHourPaise: number;
  sessionId: string;
  bookingId?: string;
  bookingRef?: string;
  customerName: string;
  customerPhone?: string;
  scheduledEndAt: string;
}

export interface SessionAlert {
  id: string; // `${stationId}-${stage}`
  session: ActiveSessionData;
  stage: '15m' | '10m' | '5m' | 'extra';
  remainingSeconds: number;
  extraMinutes: number;
  createdAt: number;
}

// ─── Pure Web Audio API Chime (Zero external assets needed) ─────────────────
function playAlertChime(stage: '15m' | '10m' | '5m' | 'extra') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (stage === 'extra') {
      // 3 urgent alert beeps for Extra Time
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (stage === '5m') {
      // 2 sharp beeps for 5 min final warning
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Gentle chime for 15m / 10m reminder
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.14);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Autoplay restrictions handle gracefully
  }
}

export function SessionExpiryAlertManager() {
  const [activeSessions, setActiveSessions] = useState<ActiveSessionData[]>([]);
  const [alerts, setAlerts] = useState<SessionAlert[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ds_staff_alerts_muted') === 'true';
    }
    return false;
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Modals controlled directly from alerts
  const [extendStation, setExtendStation] = useState<any | null>(null);
  const [endSessionTarget, setEndSessionTarget] = useState<EndSessionTarget | null>(null);

  // Track which milestones have been triggered to prevent duplicate alerts
  const triggeredMilestones = useRef<Map<string, Set<string>>>(new Map());
  const dismissedAlertIds = useRef<Set<string>>(new Set());

  // Toggle Mute
  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ds_staff_alerts_muted', String(next));
      }
      return next;
    });
  };

  // Poll for active stations every 10 seconds
  const fetchActiveSessions = async () => {
    try {
      const res = await fetch('/api/staff/overview');
      const json = await res.json();
      if (json.success && json.data?.stations) {
        const list: ActiveSessionData[] = [];
        for (const st of json.data.stations) {
          if (st.status === 'OCCUPIED' && st.activeSession) {
            list.push({
              stationId: st.id,
              stationName: st.name,
              pricePerHourPaise: st.pricePerHourPaise || 15000,
              sessionId: st.activeSession.id,
              bookingId: st.activeSession.bookingId,
              bookingRef: st.activeSession.bookingRef,
              customerName: st.activeSession.customerName || 'Player',
              customerPhone: st.activeSession.customerPhone,
              scheduledEndAt: st.activeSession.scheduledEndAt,
            });
          }
        }
        setActiveSessions(list);
      }
    } catch {
      // Ignore background errors
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1-second live countdown evaluator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const newAlerts: SessionAlert[] = [];

      for (const session of activeSessions) {
        if (!session.scheduledEndAt) continue;
        const endTime = new Date(session.scheduledEndAt).getTime();
        const diffMs = endTime - now;
        const remainingSec = Math.floor(diffMs / 1000);

        let stage: '15m' | '10m' | '5m' | 'extra' | null = null;
        let extraMins = 0;

        if (diffMs <= 0) {
          stage = 'extra';
          extraMins = Math.max(1, Math.floor(Math.abs(diffMs) / 60000));
        } else if (remainingSec <= 5 * 60) {
          stage = '5m';
        } else if (remainingSec <= 10 * 60) {
          stage = '10m';
        } else if (remainingSec <= 15 * 60) {
          stage = '15m';
        }

        if (stage) {
          const alertId = `${session.sessionId || session.stationId}-${stage}`;
          const isDismissed = dismissedAlertIds.current.has(alertId);

          if (!isDismissed) {
            // Check if we already played sound for this stage
            let stationMilestones = triggeredMilestones.current.get(session.sessionId || session.stationId);
            if (!stationMilestones) {
              stationMilestones = new Set();
              triggeredMilestones.current.set(session.sessionId || session.stationId, stationMilestones);
            }

            if (!stationMilestones.has(stage)) {
              stationMilestones.add(stage);
              if (!isMuted) {
                playAlertChime(stage);
              }
            }

            newAlerts.push({
              id: alertId,
              session,
              stage,
              remainingSeconds: Math.max(0, remainingSec),
              extraMinutes: extraMins,
              createdAt: now,
            });
          }
        }
      }

      setAlerts(newAlerts);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSessions, isMuted]);

  // Dismiss a specific alert
  const handleDismiss = (alertId: string) => {
    dismissedAlertIds.current.add(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Open Extend Modal from Alert
  const handleOpenExtend = (alert: SessionAlert) => {
    setExtendStation({
      id: alert.session.stationId,
      name: alert.session.stationName,
      pricePerHourPaise: alert.session.pricePerHourPaise,
      activeSession: {
        id: alert.session.sessionId,
        bookingId: alert.session.bookingId,
        customerName: alert.session.customerName,
        bookingRef: alert.session.bookingRef,
        scheduledEndAt: alert.session.scheduledEndAt,
      },
    });
  };

  // Open End Session Modal from Alert
  const handleOpenEndSession = (alert: SessionAlert) => {
    setEndSessionTarget({
      sessionId: alert.session.sessionId,
      stationId: alert.session.stationId,
      stationName: alert.session.stationName,
      bookingId: alert.session.bookingId,
      customerName: alert.session.customerName,
      bookingRef: alert.session.bookingRef,
      scheduledEndAt: alert.session.scheduledEndAt,
      pricePerHourPaise: alert.session.pricePerHourPaise,
    });
  };

  if (alerts.length === 0) {
    return (
      <>
        {/* Modals mount even if no alert */}
        <ExtendSessionModal
          isOpen={Boolean(extendStation)}
          onClose={() => setExtendStation(null)}
          station={extendStation}
          onSuccess={() => {
            setExtendStation(null);
            fetchActiveSessions();
          }}
        />
        <EndSessionModal
          isOpen={Boolean(endSessionTarget)}
          onClose={() => setEndSessionTarget(null)}
          target={endSessionTarget}
          onSuccess={() => {
            setEndSessionTarget(null);
            fetchActiveSessions();
          }}
        />
      </>
    );
  }

  // Count by urgency
  const extraCount = alerts.filter((a) => a.stage === 'extra').length;
  const criticalCount = alerts.filter((a) => a.stage === '5m').length;

  return (
    <>
      {/* Floating Alert HUD in Bottom-Right Corner */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-none">
        {/* Header Ribbon for Multiple Alerts */}
        <div className="pointer-events-auto bg-ds-dark/95 border border-ds-border/90 backdrop-blur-md rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  extraCount > 0
                    ? 'bg-rose-500'
                    : criticalCount > 0
                    ? 'bg-orange-500'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  extraCount > 0
                    ? 'bg-rose-500'
                    : criticalCount > 0
                    ? 'bg-orange-500'
                    : 'bg-amber-400'
                }`}
              />
            </span>
            <span className="font-heading font-bold text-ds-text uppercase text-[11px] tracking-wider">
              Floor Session Alerts ({alerts.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'border-ds-border text-ds-text-dim hover:text-white'
                  : 'border-ds-accent/40 bg-ds-accent/10 text-ds-ice hover:bg-ds-accent/20'
              }`}
              title={isMuted ? 'Unmute alert sound' : 'Mute alert sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-ds-text-dim" /> : <Volume2 className="w-3.5 h-3.5 text-ds-accent" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg border border-ds-border text-ds-text-dim hover:text-white hover:bg-ds-surface transition-colors"
              title={isMinimized ? 'Expand alerts' : 'Minimize alerts'}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Alerts Cards Stack */}
        {!isMinimized && (
          <div className="flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
            {alerts.map((alert) => {
              const isExtra = alert.stage === 'extra';
              const is5m = alert.stage === '5m';
              const is10m = alert.stage === '10m';
              const mins = Math.floor(alert.remainingSeconds / 60);
              const secs = alert.remainingSeconds % 60;
              const formattedRemaining = `${mins}:${secs.toString().padStart(2, '0')}`;

              const overtimeCharge = isExtra
                ? Math.max(10, Math.round((alert.extraMinutes / 60) * (alert.session.pricePerHourPaise / 100)))
                : 0;

              return (
                <div
                  key={alert.id}
                  className={`pointer-events-auto rounded-2xl p-4 shadow-2xl backdrop-blur-xl border-2 transition-all animate-fade-in-up ${
                    isExtra
                      ? 'bg-rose-950/90 border-rose-500/80 shadow-rose-900/30'
                      : is5m
                      ? 'bg-orange-950/90 border-orange-500/80 shadow-orange-900/30'
                      : 'bg-amber-950/90 border-amber-500/80 shadow-amber-900/30'
                  }`}
                >
                  {/* Card Header: Station, Player & Close */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isExtra ? 'bg-rose-500/20 text-rose-300' : is5m ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {isExtra ? <AlertCircle className="w-4 h-4 animate-bounce" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-heading font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span>{alert.session.stationName}</span>
                          <span className="text-[10px] text-white/50 font-normal">•</span>
                          <span className="text-[11px] text-white/90 font-bold">{alert.session.customerName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/60 block">
                          Slot End: {new Date(alert.session.scheduledEndAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={isExtra ? 'danger' : 'warning'}
                        size="sm"
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                          isExtra
                            ? 'bg-rose-500 text-white animate-pulse'
                            : is5m
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-400 text-black'
                        }`}
                      >
                        {isExtra
                          ? `🚨 EXTRA TIME (+${alert.extraMinutes}m)`
                          : is5m
                          ? `⏱️ 5 MIN WARNING`
                          : is10m
                          ? `⏱️ 10 MIN WARNING`
                          : `⏱️ 15 MIN WARNING`}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleDismiss(alert.id)}
                        className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Message Body */}
                  <div className="py-2.5 text-xs text-white/90 space-y-1">
                    {isExtra ? (
                      <div className="space-y-1">
                        <p className="font-medium text-rose-200 text-[11px] leading-snug">
                          ⚠️ Session slot has ended! The player is currently running in{' '}
                          <strong className="text-white font-black underline">
                            EXTRA TIME (+{alert.extraMinutes} minutes)
                          </strong>.
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-rose-300">
                          <span>Estimated Overtime Fee:</span>
                          <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-rose-500/40">
                            ₹{overtimeCharge}
                          </span>
                        </div>
                      </div>
                    ) : is5m ? (
                      <p className="font-medium text-orange-200 text-[11px] leading-snug">
                        🚨 Final <strong className="text-white font-bold">{formattedRemaining}</strong> left for{' '}
                        {alert.session.customerName}! Time is ending in 5 minutes — check for session extension or station wrap-up.
                      </p>
                    ) : is10m ? (
                      <p className="font-medium text-amber-200 text-[11px] leading-snug">
                        ⚠️ Only <strong className="text-white font-bold">{formattedRemaining}</strong> left for{' '}
                        {alert.session.customerName}! Session time will end in 10 minutes.
                      </p>
                    ) : (
                      <p className="font-medium text-amber-200 text-[11px] leading-snug">
                        ⏰ <strong className="text-white font-bold">{formattedRemaining}</strong> remaining for{' '}
                        {alert.session.customerName}! Session time will end in 15 minutes.
                      </p>
                    )}
                  </div>

                  {/* Quick Operational Buttons */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(alert.id)}
                      className="text-[10px] py-1 px-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Dismiss
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenExtend(alert)}
                      className="text-[11px] py-1 px-2.5 font-bold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      <PlusCircle className="w-3 h-3 text-cyan-300" />
                      <span>Extend</span>
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenEndSession(alert)}
                      className="text-[11px] py-1 px-2.5 font-bold flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      <Square className="w-3 h-3" />
                      <span>End Session</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Modals for Quick Actions from any alert */}
      <ExtendSessionModal
        isOpen={Boolean(extendStation)}
        onClose={() => setExtendStation(null)}
        station={extendStation}
        onSuccess={() => {
          setExtendStation(null);
          fetchActiveSessions();
        }}
      />

      <EndSessionModal
        isOpen={Boolean(endSessionTarget)}
        onClose={() => setEndSessionTarget(null)}
        target={endSessionTarget}
        onSuccess={() => {
          setEndSessionTarget(null);
          fetchActiveSessions();
        }}
      />
    </>
  );
}
