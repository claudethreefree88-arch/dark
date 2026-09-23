import { type ClassValue, clsx } from 'clsx';

// ─── Class Name Utility ─────────────────────────────────────────────────────
// Lightweight alternative to clsx + twMerge for combining class names
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ─── Currency Formatting ────────────────────────────────────────────────────
/**
 * Format paise amount to INR display string.
 * @param paise - Amount in paise (integer)
 * @returns Formatted string like "₹1,299.00"
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to paise (integer). Avoids floating-point issues.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees (for display only — not for calculations).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

// ─── Date/Time Formatting ───────────────────────────────────────────────────
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a UTC Date to IST display string.
 */
export function formatDateIST(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

/**
 * Format a date for display: "23 Sep 2026"
 */
export function formatDate(date: Date | string): string {
  return formatDateIST(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for display: "2:30 PM"
 */
export function formatTime(date: Date | string): string {
  return formatDateIST(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format datetime: "23 Sep 2026, 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  return formatDateIST(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── String Utilities ───────────────────────────────────────────────────────

/**
 * Generate a human-readable booking reference.
 * Format: DS-YYYYMMDD-XXXX (e.g., DS-20260923-A7K9)
 */
export function generateBookingRef(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DS-${dateStr}-${suffix}`;
}

/**
 * Slugify a string for URL use.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// ─── Timing Utilities ───────────────────────────────────────────────────────

/**
 * Calculate remaining session time in seconds from DB timestamps.
 */
export function calculateRemainingSeconds(
  scheduledEndAt: Date,
  totalPausedSeconds: number = 0,
  pausedAt?: Date | null
): number {
  const now = new Date();
  const end = new Date(scheduledEndAt);

  // If currently paused, add time since pause started
  let currentPauseDuration = 0;
  if (pausedAt) {
    currentPauseDuration = Math.floor(
      (now.getTime() - new Date(pausedAt).getTime()) / 1000
    );
  }

  const adjustedEnd = new Date(
    end.getTime() + (totalPausedSeconds + currentPauseDuration) * 1000
  );
  const remaining = Math.floor((adjustedEnd.getTime() - now.getTime()) / 1000);

  return Math.max(0, remaining);
}

/**
 * Format seconds to "Xh Ym Zs" display.
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

/**
 * Validate Indian phone number format.
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Sanitize phone to +91XXXXXXXXXX format.
 */
export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
  if (cleaned.length === 10) return '+91' + cleaned;
  return cleaned;
}
