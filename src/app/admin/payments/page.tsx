'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CreditCard, Search, RotateCw, Banknote, Sparkles, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Payment {
  id: string;
  bookingRef: string;
  customerName: string;
  customerEmail?: string;
  stationName: string;
  amountPaise: number;
  method: string;
  status: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  paidAt: string;
  notes?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const toast = useToast();

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      const json = await res.json();
      if (json.success && json.data) {
        setPayments(json.data || []);
      }
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;
    const matchesSearch =
      !search ||
      p.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.gatewayPaymentId.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
            Financial & Transactions Ledger
          </h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Audit logs of all online gateway settlements (UPI / Razorpay) and front-desk cash receipts.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadPayments}>
          <RotateCw className="w-4 h-4 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        {/* Method Tabs */}
        <div className="flex flex-wrap gap-1 bg-ds-dark p-1 rounded-xl border border-ds-border text-xs">
          {['ALL', 'UPI', 'CASH', 'RAZORPAY'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg font-heading font-bold uppercase transition-all ${
                methodFilter === m
                  ? 'bg-ds-accent text-white shadow-sm'
                  : 'text-ds-text-dim hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search ref, gamer, payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8 w-56 sm:w-72"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading transactions...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Gamer Details</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gateway Reference</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ds-ice">{p.bookingRef}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-ds-text">{p.customerName}</div>
                      <div className="text-[11px] text-ds-text-dim">{p.customerEmail || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-ds-text">{p.stationName}</td>
                    <td className="py-3.5 px-4 font-heading font-black text-emerald-400 text-sm">
                      ₹{(p.amountPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-ds-surface border border-ds-border text-ds-text">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-ds-text-dim max-w-xs truncate">
                      {p.gatewayPaymentId !== '—' ? p.gatewayPaymentId : p.notes || 'Counter Record'}
                    </td>
                    <td className="py-3.5 px-4 text-ds-text-dim font-mono text-[11px]">
                      {new Date(p.paidAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={p.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
