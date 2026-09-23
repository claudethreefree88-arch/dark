'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Users, Search, RotateCw, ShieldAlert, CheckCircle2, UserX, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  totalBookings: number;
  totalSpentPaise: number;
  joinedAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data || []);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customer.id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.info(`Customer ${customer.name} marked as ${newStatus}`);
        loadCustomers();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    return (
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">Customer Directory</h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Registered gamers, session history, lifetime spend, and account controls.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadCustomers}>
          <RotateCw className="w-4 h-4 mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search gamer by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Customers Table */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading customer accounts...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Gamer Profile</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Total Sessions</th>
                  <th className="py-3 px-4">Lifetime Spent</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-ds-text">{c.name}</div>
                      <div className="text-[11px] text-ds-text-dim">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.phone}</td>
                    <td className="py-3.5 px-4 font-heading font-bold text-ds-ice">
                      {c.totalBookings} Booking{c.totalBookings === 1 ? '' : 's'}
                    </td>
                    <td className="py-3.5 px-4 font-heading font-extrabold text-ds-text">
                      ₹{(c.totalSpentPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3.5 px-4 text-ds-text-dim">
                      {new Date(c.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={c.status === 'ACTIVE' ? 'outline' : 'accent'}
                        size="sm"
                        onClick={() => handleToggleStatus(c)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        {c.status === 'ACTIVE' ? (
                          <>
                            <UserX className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            <span>Activate</span>
                          </>
                        )}
                      </Button>
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
