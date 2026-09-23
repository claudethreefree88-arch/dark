'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Gamepad2,
  Plus,
  Wrench,
  Trash2,
  Edit2,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Station {
  id: string;
  name: string;
  facilityName: string;
  stationType: string;
  pricePerHourPaise: number;
  specs: string;
  capacity: number;
  status: string;
}

export default function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'PS5' | 'POOL_TABLE'>('PS5');
  const [formPriceINR, setFormPriceINR] = useState('200');
  const [formSpecs, setFormSpecs] = useState('');
  const [formCapacity, setFormCapacity] = useState('2');
  const [formStatus, setFormStatus] = useState('AVAILABLE');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadStations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stations');
      const json = await res.json();
      if (json.success && json.data) {
        setStations(json.data || []);
      }
    } catch {
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const openCreateModal = () => {
    setEditingStation(null);
    setFormName('');
    setFormType('PS5');
    setFormPriceINR('200');
    setFormSpecs('Sony Bravia XR 65" 4K 120Hz OLED, DualSense Edge Wireless');
    setFormCapacity('2');
    setFormStatus('AVAILABLE');
    setModalOpen(true);
  };

  const openEditModal = (station: Station) => {
    setEditingStation(station);
    setFormName(station.name);
    setFormType((station.stationType as any) || 'PS5');
    setFormPriceINR((station.pricePerHourPaise / 100).toFixed(0));
    setFormSpecs(station.specs || '');
    setFormCapacity(station.capacity.toString());
    setFormStatus(station.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const pricePaise = parseInt(formPriceINR, 10) * 100;
    const capacityNum = parseInt(formCapacity, 10) || 2;

    try {
      if (editingStation) {
        const res = await fetch(`/api/admin/stations/${editingStation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            pricePerHourPaise: pricePaise,
            specs: formSpecs,
            capacity: capacityNum,
            status: formStatus,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Station updated successfully!');
          loadStations();
          setModalOpen(false);
        }
      } else {
        const res = await fetch('/api/admin/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            stationType: formType,
            pricePerHourPaise: pricePaise,
            specs: formSpecs,
            capacity: capacityNum,
            status: formStatus,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('New station added to arena catalog!');
          loadStations();
          setModalOpen(false);
        }
      }
    } catch {
      toast.error('Failed to save station');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (station: Station) => {
    if (!confirm(`Are you sure you want to deactivate ${station.name}? It will be removed from customer view.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.info(`${station.name} deactivated.`);
        loadStations();
      }
    } catch {
      toast.error('Failed to deactivate station');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black uppercase text-ds-text">Gaming Station Catalog</h1>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Configure consoles, tables, base hourly pricing, and operational maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStations}>
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Button variant="accent" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Station</span>
          </Button>
        </div>
      </div>

      {/* Stations Table Card */}
      <Card glass className="border-ds-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">Loading stations...</div>
        ) : stations.length === 0 ? (
          <div className="p-16 text-center text-xs text-ds-text-dim">No stations configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ds-dark/60 text-ds-text-dim uppercase text-[10px] font-mono border-b border-ds-border">
                <tr>
                  <th className="py-3 px-4">Station Name</th>
                  <th className="py-3 px-4">Facility Zone</th>
                  <th className="py-3 px-4">Hourly Rate</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Hardware Specs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border/40">
                {stations.map((st) => (
                  <tr key={st.id} className="hover:bg-ds-surface/40 transition-colors">
                    <td className="py-3.5 px-4 font-heading font-bold text-ds-text">{st.name}</td>
                    <td className="py-3.5 px-4 text-ds-accent">{st.facilityName}</td>
                    <td className="py-3.5 px-4 font-heading font-extrabold text-ds-ice">
                      ₹{(st.pricePerHourPaise / 100).toFixed(0)} / hr
                    </td>
                    <td className="py-3.5 px-4 font-mono">{st.capacity} Players</td>
                    <td className="py-3.5 px-4 text-ds-text-dim max-w-xs truncate">{st.specs}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          st.status === 'AVAILABLE' ? 'success' : st.status === 'OCCUPIED' ? 'accent' : 'warning'
                        }
                        size="sm"
                      >
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(st)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeactivate(st)}
                          className="text-[11px] py-1 px-2"
                          title="Deactivate Station"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT STATION MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStation ? `Edit ${editingStation.name}` : 'Add New Gaming Station'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">Station Name</label>
            <Input
              placeholder="e.g. PS5 Battle Station 9"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Facility Zone</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent"
              >
                <option value="PS5">PlayStation 5 Pro Arena</option>
                <option value="POOL_TABLE">Billiards & Pool Lounge</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Hourly Rate (₹)</label>
              <Input
                type="number"
                value={formPriceINR}
                onChange={(e) => setFormPriceINR(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Max Player Capacity</label>
              <Input
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ds-text-muted uppercase">Current Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OCCUPIED">OCCUPIED</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ds-text-muted uppercase">Hardware & Display Specs</label>
            <textarea
              rows={2}
              value={formSpecs}
              onChange={(e) => setFormSpecs(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-ds-surface border border-ds-border text-ds-text text-sm focus:outline-none focus:border-ds-accent"
              placeholder="e.g. Sony Bravia 65 OLED, 2x DualSense Edge"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingStation ? 'Save Changes' : 'Create Station'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
