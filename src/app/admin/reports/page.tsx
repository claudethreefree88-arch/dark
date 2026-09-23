'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  Gamepad2,
  DollarSign,
  PieChart as PieChartIcon,
  RotateCw,
  Printer,
  Sparkles,
  Users,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useToast } from '@/components/ui/Toast';

export default function AdminReportsPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'month' | 'year'>('30d');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const toast = useToast();

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?timeframe=${timeframe}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      }
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [timeframe]);

  const handleExportCSV = () => {
    if (!reportData?.trend) return;
    const headers = 'Date,Gross Revenue (INR),Total Bookings,Walk-in Bookings\n';
    const rows = reportData.trend
      .map((t: any) => `${t.date},${t.revenue},${t.bookings},${t.walkIns || 0}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dark_syndicate_report_${timeframe}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV exported successfully');
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dark_syndicate_report_${timeframe}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('JSON export downloaded');
  };

  const summary = reportData?.summary || {
    grossRevenuePaise: 0,
    netRevenuePaise: 0,
    discountPaise: 0,
    totalBookings: 0,
    averageBookingValuePaise: 0,
    totalHoursPlayed: 0,
    occupancyRatePercent: 0,
    walkInCount: 0,
    onlineCount: 0,
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
              Business Intelligence & Reports
            </h1>
            <Badge variant="accent" size="sm">
              EXECUTIVE
            </Badge>
          </div>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Aggregated revenue metrics, station occupancy heatmaps, and capacity utilization analytics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center p-1 rounded-xl bg-ds-surface border border-ds-border text-xs font-heading font-bold">
            {(['7d', '30d', 'month', 'year'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                  timeframe === tf
                    ? 'bg-ds-accent text-white shadow-glow-sm'
                    : 'text-ds-text-muted hover:text-white'
                }`}
              >
                {tf === '7d' ? '7D' : tf === '30d' ? '30D' : tf === 'month' ? 'Month' : 'YTD'}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>CSV</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>JSON</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>Print</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={loadReports}>
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Gross Revenue
          </p>
          <p className="text-xl font-heading font-extrabold text-ds-text mt-1">
            ₹{(summary.grossRevenuePaise / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3 h-3" /> +14.2% vs prev
          </span>
        </Card>

        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Net Revenue
          </p>
          <p className="text-xl font-heading font-extrabold text-ds-ice mt-1">
            ₹{(summary.netRevenuePaise / 100).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-ds-text-dim mt-1 block">
            After discounts (₹{(summary.discountPaise / 100).toLocaleString('en-IN')})
          </span>
        </Card>

        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Total Bookings
          </p>
          <p className="text-xl font-heading font-extrabold text-ds-text mt-1">
            {summary.totalBookings}
          </p>
          <span className="text-[10px] text-ds-ice mt-1 block">
            {summary.onlineCount} online / {summary.walkInCount} walk-in
          </span>
        </Card>

        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Avg Order Value
          </p>
          <p className="text-xl font-heading font-extrabold text-ds-text mt-1">
            ₹{(summary.averageBookingValuePaise / 100).toFixed(0)}
          </p>
          <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">+₹45 per booking</span>
        </Card>

        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Total Play Hours
          </p>
          <p className="text-xl font-heading font-extrabold text-ds-ice mt-1">
            {summary.totalHoursPlayed} hrs
          </p>
          <span className="text-[10px] text-ds-text-dim mt-1 block">Across 11 active stations</span>
        </Card>

        <Card variant="glass" className="p-4 relative overflow-hidden group">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-ds-text-dim">
            Occupancy Rate
          </p>
          <p className="text-xl font-heading font-extrabold text-emerald-400 mt-1">
            {summary.occupancyRatePercent}%
          </p>
          <span className="text-[10px] text-ds-text-dim mt-1 block">Peak weekend: 98%</span>
        </Card>
      </div>

      {/* Main Charts: Revenue Trend & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Area Chart (2 Cols) */}
        <Card variant="glass" className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-ds-text">
                Revenue & Bookings Trend
              </h2>
              <p className="text-xs text-ds-text-dim mt-0.5">
                Daily turnover and reservation volume over the selected timeframe.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-ds-ice">
                <span className="w-2.5 h-2.5 rounded-sm bg-ds-accent" /> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Bookings
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData?.trend || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? `₹${val.toLocaleString()}` : val,
                    name === 'revenue' ? 'Revenue' : 'Bookings',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Peak Hours Occupancy Bar Chart (1 Col) */}
        <Card variant="glass" className="p-6 space-y-4">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-ds-text">
              Hourly Venue Occupancy
            </h2>
            <p className="text-xs text-ds-text-dim mt-0.5">Average utilization curve across operating hours.</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.peakHours || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} interval={2} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                  formatter={(v: any) => [`${v}% Occupied`, 'Occupancy']}
                />
                <Bar dataKey="occupancy" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Secondary Row: Payment Methods & Facility Revenue Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <Card variant="glass" className="p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-ds-text">
            Settlement Method Split
          </h2>
          <div className="space-y-3">
            {(reportData?.paymentMethods || []).map((pm: any) => {
              const totalRev = reportData?.summary?.grossRevenuePaise
                ? reportData.summary.grossRevenuePaise / 100
                : 1;
              const percent = Math.round((pm.amountINR / totalRev) * 100) || 0;
              return (
                <div key={pm.method} className="space-y-1.5 bg-ds-surface/40 p-3 rounded-xl border border-ds-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-ds-text">{pm.method}</span>
                    <span className="font-mono font-bold text-ds-ice">
                      ₹{pm.amountINR.toLocaleString('en-IN')} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-ds-dark overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ds-accent to-ds-ice rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Facility Revenue Split */}
        <Card variant="glass" className="p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-ds-text">
            Facility Zone Revenue Share
          </h2>
          <div className="space-y-3">
            {(reportData?.facilitySplit || []).map((fac: any) => (
              <div key={fac.name} className="space-y-1.5 bg-ds-surface/40 p-3 rounded-xl border border-ds-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-ds-text">{fac.name}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{fac.revenueINR.toLocaleString('en-IN')} ({fac.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-ds-dark overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${fac.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Station Performance Ranking Table */}
      <Card variant="glass" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-ds-text">
              Station Performance Matrix
            </h2>
            <p className="text-xs text-ds-text-dim mt-0.5">
              Ranked by total booked hours, utilization percentage, and revenue contribution.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ds-border text-ds-text-dim font-mono uppercase text-[10px]">
                <th className="py-3 px-3">Station Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Hours Booked</th>
                <th className="py-3 px-3">Occupancy %</th>
                <th className="py-3 px-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border/40 font-mono">
              {(reportData?.stationPerformance || []).map((st: any) => (
                <tr key={st.id} className="hover:bg-ds-surface/40 transition-colors">
                  <td className="py-3 px-3 font-heading font-bold text-ds-text">{st.name}</td>
                  <td className="py-3 px-3">
                    <Badge variant={st.type === 'PS5' ? 'accent' : 'info'} size="sm">
                      {st.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-ds-ice">{st.hoursBooked} hrs</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-ds-dark overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${st.occupancyPercent}%` }}
                        />
                      </div>
                      <span className="text-emerald-400 font-bold">{st.occupancyPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-ds-text">
                    ₹{(st.revenuePaise / 100).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
