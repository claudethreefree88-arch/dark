'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Save,
  RotateCw,
  ExternalLink,
  Megaphone,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'gallery' | 'settings'>('testimonials');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Testimonials State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testiModalOpen, setTestiModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newRating, setNewRating] = useState('5');

  // Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('gaming');

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Load Data
  const loadCmsData = async () => {
    setLoading(true);
    try {
      const [testiRes, galRes, setRes] = await Promise.all([
        fetch('/api/admin/cms/testimonials'),
        fetch('/api/admin/cms/gallery'),
        fetch('/api/admin/cms/settings'),
      ]);

      const [testiJson, galJson, setJson] = await Promise.all([
        testiRes.json(),
        galRes.json(),
        setRes.json(),
      ]);

      if (testiJson.success) setTestimonials(testiJson.data || []);
      if (galJson.success) setGallery(galJson.data || []);
      if (setJson.success && Array.isArray(setJson.data)) {
        const map: Record<string, string> = {};
        setJson.data.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      }
    } catch {
      toast.error('Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  // Testimonial Handlers
  const handleToggleTestimonial = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch('/api/admin/cms/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !currentApproved }),
      });
      const json = await res.json();
      if (json.success) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isApproved: !currentApproved } : t))
        );
        toast.success(`Review ${!currentApproved ? 'approved and published' : 'hidden'}`);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/testimonials?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        toast.info('Testimonial deleted');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cms/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomerName,
          content: newContent,
          rating: parseInt(newRating, 10),
          isApproved: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestimonials((prev) => [json.data, ...prev]);
        setTestiModalOpen(false);
        setNewCustomerName('');
        setNewContent('');
        toast.success('Testimonial published successfully');
      }
    } catch {
      toast.error('Failed to create testimonial');
    }
  };

  // Gallery Handlers
  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newImageUrl,
          altText: newImageAlt,
          category: newImageCategory,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGallery((prev) => [json.data, ...prev]);
        setGalleryModalOpen(false);
        setNewImageUrl('');
        setNewImageAlt('');
        toast.success('Photo added to gallery');
      }
    } catch {
      toast.error('Failed to add image');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/gallery?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setGallery((prev) => prev.filter((g) => g.id !== id));
        toast.info('Gallery image deleted');
      }
    } catch {
      toast.error('Failed to remove image');
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith('announcement')
          ? 'announcement'
          : key.startsWith('operating')
          ? 'hours'
          : key.startsWith('social')
          ? 'social'
          : 'contact',
      }));

      const res = await fetch('/api/admin/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Website configuration saved and live on arena portal!');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-black uppercase text-ds-text">
              Website CMS & Venue Controls
            </h1>
            <Badge variant="accent" size="sm">
              LIVE PORTAL
            </Badge>
          </div>
          <p className="text-xs text-ds-text-muted mt-0.5">
            Manage customer testimonials, arena photo showcase, operating hours, and top announcement alerts.
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-ds-surface border border-ds-border text-xs font-heading font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                activeTab === 'testimonials'
                  ? 'bg-ds-accent text-white shadow-glow-sm'
                  : 'text-ds-text-muted hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reviews</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-ds-accent text-white shadow-glow-sm'
                  : 'text-ds-text-muted hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors ${
                activeTab === 'settings'
                  ? 'bg-ds-accent text-white shadow-glow-sm'
                  : 'text-ds-text-muted hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Venue Config</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={loadCmsData}>
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── TAB 1: Testimonials ──────────────────────────────────────────────── */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-ds-text uppercase">
                Customer Testimonials ({testimonials.length})
              </h2>
              <p className="text-xs text-ds-text-muted">
                Approved reviews are displayed on the public landing page.
              </p>
            </div>

            <Button variant="accent" size="sm" onClick={() => setTestiModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Testimonial</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                variant="glass"
                className={`p-5 space-y-3 border-l-4 ${
                  t.isApproved ? 'border-l-emerald-400' : 'border-l-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-ds-text">
                      {t.customerName}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-400 mt-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={t.isApproved ? 'success' : 'warning'} size="sm">
                      {t.isApproved ? 'PUBLISHED' : 'PENDING'}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleTestimonial(t.id, t.isApproved)}
                      className="text-xs p-1"
                      title={t.isApproved ? 'Unpublish' : 'Approve'}
                    >
                      {t.isApproved ? (
                        <XCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTestimonial(t.id)}
                      className="text-xs p-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-ds-text-dim italic leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Gallery ──────────────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-ds-text uppercase">
                Arena Visual Gallery ({gallery.length})
              </h2>
              <p className="text-xs text-ds-text-muted">
                Photos showcased across the public website and facilities tour.
              </p>
            </div>

            <Button variant="accent" size="sm" onClick={() => setGalleryModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Arena Photo</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((g) => (
              <Card key={g.id} variant="glass" className="overflow-hidden group relative p-0">
                <div className="aspect-video w-full relative bg-ds-surface overflow-hidden">
                  <img
                    src={g.url}
                    alt={g.altText || 'Arena Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="accent" size="sm">
                      {g.category}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGallery(g.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-rose-400 hover:text-rose-300 backdrop-blur-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3 text-xs text-ds-text-dim">
                  <p className="font-heading font-semibold text-ds-text truncate">
                    {g.altText || 'Venue Showcase'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Venue Config ────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-ds-text uppercase">
                Operational Settings & Venue Announcements
              </h2>
              <p className="text-xs text-ds-text-muted">
                Changes take effect across the public website immediately.
              </p>
            </div>

            <Button
              variant="accent"
              size="sm"
              onClick={handleSaveSettings}
              isLoading={savingSettings}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>Save & Publish</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Announcement Banner */}
            <Card variant="glass" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-ds-accent" />
                <h3 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Top Announcement Banner
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-ds-text-dim block mb-1">Banner Status</label>
                  <select
                    value={settings.announcement_enabled || 'true'}
                    onChange={(e) =>
                      setSettings({ ...settings, announcement_enabled: e.target.value })
                    }
                    className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono"
                  >
                    <option value="true">Active & Visible to Public</option>
                    <option value="false">Disabled / Hidden</option>
                  </select>
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Announcement Message</label>
                  <textarea
                    rows={2}
                    value={settings.announcement_text || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, announcement_text: e.target.value })
                    }
                    className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono resize-none"
                    placeholder="Enter special promotion or tournament alert..."
                  />
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Target Click URL</label>
                  <Input
                    value={settings.announcement_link || '/booking'}
                    onChange={(e) =>
                      setSettings({ ...settings, announcement_link: e.target.value })
                    }
                    placeholder="/booking or /facilities"
                  />
                </div>
              </div>
            </Card>

            {/* Arena Operating Hours */}
            <Card variant="glass" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ds-ice" />
                <h3 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Operating Hours
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-ds-text-dim block mb-1">Weekday Timings (Mon - Thu)</label>
                  <Input
                    value={settings.operating_hours_weekdays || '10:00 AM - 11:30 PM'}
                    onChange={(e) =>
                      setSettings({ ...settings, operating_hours_weekdays: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Weekend Timings (Fri - Sun)</label>
                  <Input
                    value={settings.operating_hours_weekends || '09:30 AM - 01:00 AM'}
                    onChange={(e) =>
                      setSettings({ ...settings, operating_hours_weekends: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Venue Contact Details */}
            <Card variant="glass" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Venue Contact & Coordinates
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-ds-text-dim block mb-1">Front-Desk WhatsApp</label>
                  <Input
                    value={settings.contact_whatsapp || '+91 98765 43210'}
                    onChange={(e) =>
                      setSettings({ ...settings, contact_whatsapp: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Support Email</label>
                  <Input
                    value={settings.contact_email || 'support@darksyndicate.in'}
                    onChange={(e) =>
                      setSettings({ ...settings, contact_email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Physical Venue Address</label>
                  <textarea
                    rows={2}
                    value={settings.venue_address || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, venue_address: e.target.value })
                    }
                    className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Social Communities */}
            <Card variant="glass" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <h3 className="font-heading font-bold text-sm text-ds-text uppercase">
                  Social Channels
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-ds-text-dim block mb-1">Instagram Profile</label>
                  <Input
                    value={settings.social_instagram || 'https://instagram.com/darksyndicate.gaming'}
                    onChange={(e) =>
                      setSettings({ ...settings, social_instagram: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-ds-text-dim block mb-1">Discord Community</label>
                  <Input
                    value={settings.social_discord || 'https://discord.gg/darksyndicate'}
                    onChange={(e) =>
                      setSettings({ ...settings, social_discord: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Add Testimonial */}
      <Modal
        isOpen={testiModalOpen}
        onClose={() => setTestiModalOpen(false)}
        title="Add Customer Review"
      >
        <form onSubmit={handleCreateTestimonial} className="space-y-4 text-xs">
          <div>
            <label className="text-ds-text-dim block mb-1">Customer / Gamer Name</label>
            <Input
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="e.g. Varun K."
            />
          </div>

          <div>
            <label className="text-ds-text-dim block mb-1">Rating</label>
            <select
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono"
            >
              <option value="5">★★★★★ (5 Stars - Outstanding)</option>
              <option value="4">★★★★☆ (4 Stars - Great)</option>
              <option value="3">★★★☆☆ (3 Stars - Average)</option>
            </select>
          </div>

          <div>
            <label className="text-ds-text-dim block mb-1">Review Content</label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter what the player had to say about the arena..."
              className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setTestiModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="sm" type="submit">
              Publish Review
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Gallery Photo */}
      <Modal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        title="Add Photo to Venue Gallery"
      >
        <form onSubmit={handleCreateGallery} className="space-y-4 text-xs">
          <div>
            <label className="text-ds-text-dim block mb-1">Image URL / Path</label>
            <Input
              required
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div>
            <label className="text-ds-text-dim block mb-1">Category</label>
            <select
              value={newImageCategory}
              onChange={(e) => setNewImageCategory(e.target.value)}
              className="w-full bg-ds-dark border border-ds-border rounded-xl px-3 py-2 text-ds-text font-mono"
            >
              <option value="gaming">Gaming & Battle Stations</option>
              <option value="venue">Venue & Lounge Ambience</option>
              <option value="rigs">Sim Rigs & Hardware</option>
              <option value="events">Tournaments & Community</option>
            </select>
          </div>

          <div>
            <label className="text-ds-text-dim block mb-1">Caption / Alt Text</label>
            <Input
              value={newImageAlt}
              onChange={(e) => setNewImageAlt(e.target.value)}
              placeholder="e.g. VIP PS5 Arena with Curved OLEDs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setGalleryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" size="sm" type="submit">
              Save Photo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
