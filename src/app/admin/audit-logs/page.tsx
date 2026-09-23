'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  Search,
  Filter,
  RotateCw,
  Eye,
  Download,
  AlertCircle,
  FileCode,
  ArrowRight,
  User,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface AuditEntry {
  id: string;
  operator: string;
  operatorEmail: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  // Modal inspection state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const toast = useToast();

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.append('action', actionFilter);
      if (entityFilter !== 'ALL') params.append('entityType', entityFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs || []);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, entityFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = 'Timestamp,Operator,Email,Role,Action,EntityType,EntityId,IPAddress\n';
    const rows = logs
      .map(
        (l) =>
          `"${new Date(l.createdAt).toLocaleString()}","${l.operator}","${l.operatorEmail}","${
            l.role
          }","${l.action}","${l.entityType}","${l.entityId}","${l.ipAddress}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dark_syndicate_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit trail exported to CSV');
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'danger';
      case 'STATUS_CHANGE':
        return 'warning';
      case 'PAYMENT':
        return 'accent';
      case 'LOGIN':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
              System Audit Trail & Security Ledger
            </h1>
            <Badge variant="accent" size="sm">
              IMMUTABLE
            </Badge>
          </div>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Transparent security log tracking administrative actions, pricing edits, and access events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button variant="outline" size="sm" onClick={loadAuditLogs}>
            <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-ds-surface/50 p-4 rounded-2xl border border-ds-border">
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search by operator, email, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs py-1.5 pl-8"
          />
          <Search className="w-3.5 h-3.5 text-ds-text-dim absolute left-2.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-ds-dark border border-ds-border rounded-xl px-3 py-1.5 text-xs text-ds-text font-mono"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-ds-dark border border-ds-border rounded-xl px-3 py-1.5 text-xs text-ds-text font-mono"
          >
            <option value="ALL">All Entity Types</option>
            <option value="GamingStation">GamingStation</option>
            <option value="Booking">Booking</option>
            <option value="Coupon">Coupon</option>
            <option value="User">User</option>
            <option value="GamingSession">GamingSession</option>
            <option value="WebsiteSettings">WebsiteSettings</option>
          </select>

          <Button variant="ghost" size="sm" onClick={loadAuditLogs} className="text-xs">
            Apply
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ds-text-dim">
            Loading system audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-ds-text-dim">
            No audit log entries matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ds-border bg-ds-surface/60 text-ds-text-dim font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 text-ds-text-dim">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-ds-text">{log.operator}</div>
                      <div className="text-[10px] text-ds-text-dim font-normal flex items-center gap-1.5">
                        <span className="text-ds-ice">{log.role}</span> • {log.operatorEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-ds-ice font-semibold">{log.entityType}</td>
                    <td className="py-3.5 px-4 text-ds-text truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                    <td className="py-3.5 px-4 text-ds-text-dim">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setInspectModalOpen(true);
                        }}
                        className="text-[11px] py-1 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-ds-accent" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Inspect Audit Delta */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Audit Record Inspection"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            {/* Meta Summary */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-ds-surface/60 rounded-xl border border-ds-border">
              <div>
                <span className="text-[10px] text-ds-text-dim block">Operator</span>
                <span className="font-bold text-ds-text">{selectedLog.operator}</span>
                <span className="text-[10px] text-ds-ice block">{selectedLog.operatorEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-ds-text-dim block">Action & Target</span>
                <span className="font-bold text-ds-accent">{selectedLog.action}</span>
                <span className="text-[10px] text-ds-text block">{selectedLog.entityType}: {selectedLog.entityId}</span>
              </div>
            </div>

            {/* Before vs After comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous State */}
              <div className="space-y-1.5">
                <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-rose-400 block">
                  Previous State (Old Value)
                </span>
                <div className="p-3 rounded-xl bg-ds-dark border border-ds-border overflow-x-auto max-h-56">
                  {selectedLog.oldValue ? (
                    <pre className="text-[11px] text-rose-300">
                      {JSON.stringify(selectedLog.oldValue, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-ds-text-dim italic">None / Initial creation</span>
                  )}
                </div>
              </div>

              {/* Updated State */}
              <div className="space-y-1.5">
                <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-emerald-400 block">
                  Modified State (New Value)
                </span>
                <div className="p-3 rounded-xl bg-ds-dark border border-ds-border overflow-x-auto max-h-56">
                  {selectedLog.newValue ? (
                    <pre className="text-[11px] text-emerald-300">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-ds-text-dim italic">Entity Deleted</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
