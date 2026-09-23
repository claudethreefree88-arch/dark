'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch('/api/customer/payments');
        const json = await res.json();
        if (json.success) {
          setPayments(json.data);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-ds-text uppercase">
          PAYMENT & <span className="gradient-text">TRANSACTION RECORDS</span>
        </h2>
        <p className="text-xs text-ds-text-muted mt-0.5">
          Review all your booking transactions, receipts, and refund statuses.
        </p>
      </div>

      <Card glass className="border-ds-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ds-surface/80 text-ds-text-muted font-heading font-bold uppercase tracking-wider border-b border-ds-border">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border/60 font-body">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ds-surface/40 transition-colors">
                  <td className="p-4 font-mono text-ds-text font-medium">
                    {p.gatewayPaymentId || p.id}
                  </td>
                  <td className="p-4 text-ds-text-muted">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4 font-mono font-bold text-ds-ice">
                    {p.booking?.bookingRef || 'DS-REF'}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-ds-dark border border-ds-border font-mono font-semibold text-ds-text">
                      {p.method}
                    </span>
                  </td>
                  <td className="p-4 font-heading font-bold text-ds-text text-sm">
                    ₹{((p.amountPaise || 20000) / 100).toFixed(0)}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        p.status === 'COMPLETED'
                          ? 'success'
                          : p.status === 'REFUNDED'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-ds-text-muted">
            No payment records found.
          </div>
        )}
      </Card>
    </div>
  );
}
