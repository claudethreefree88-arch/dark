import { prisma } from '@/lib/prisma';

export interface TimeSlot {
  time: string; // '10:00'
  endTime: string; // '12:00'
  label: string; // '10:00 AM - 12:00 PM'
  period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  available: boolean;
  reason?: string;
}

export interface AvailabilityResult {
  stationId: string;
  date: string;
  durationMinutes: number;
  operatingHours: { open: string; close: string };
  slots: TimeSlot[];
}

const OPERATING_START_HOUR = 10; // 10:00 AM
const OPERATING_END_HOUR = 24; // 12:00 AM Midnight

/**
 * Format 24h string 'HH:mm' to 12h display 'h:mm A'
 */
function format12Hour(time24: string): string {
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || '00';
  const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  if (hour === 0 || hour === 24) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${min} ${period}`;
}

/**
 * Get period classification for grouping
 */
function getPeriod(hour: number): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' {
  if (hour < 13) return 'MORNING'; // 10am - 12:59pm
  if (hour < 17) return 'AFTERNOON'; // 1pm - 4:59pm
  if (hour < 21) return 'EVENING'; // 5pm - 8:59pm
  return 'NIGHT'; // 9pm - 12am
}

/**
 * Compute availability for a station on a given date.
 */
export async function getStationAvailability(
  stationId: string,
  dateStr: string,
  durationMinutes: number = 60
): Promise<AvailabilityResult> {
  // Query station from database
  let station = null;
  let existingBookings: any[] = [];

  try {
    station = await prisma.gamingStation.findUnique({
      where: { id: stationId },
      include: { facility: true },
    });

    if (station) {
      // Find all active bookings for this station on this date
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
      existingBookings = await prisma.booking.findMany({
        where: {
          stationId,
          date: targetDate,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'PENDING'],
          },
        },
        select: {
          startTime: true,
          endTime: true,
          status: true,
        },
      });
    }
  } catch (err) {
    console.warn('Availability service running with fallback demo data:', err);
  }

  const durationHours = Math.ceil(durationMinutes / 60);
  const slots: TimeSlot[] = [];

  // Current time in IST (UTC+5:30)
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(now.getTime() + istOffsetMs);
  const todayIstStr = nowIst.toISOString().split('T')[0];
  const isToday = dateStr === todayIstStr;
  const currentHourIst = nowIst.getUTCHours();
  const currentMinIst = nowIst.getUTCMinutes();

  for (let hour = OPERATING_START_HOUR; hour <= OPERATING_END_HOUR - durationHours; hour++) {
    const startHourStr = hour.toString().padStart(2, '0');
    const endHourStr = (hour + durationHours).toString().padStart(2, '0');
    const startTimeStr = `${startHourStr}:00`;
    const endTimeStr = `${endHourStr}:00`;

    const label = `${format12Hour(startTimeStr)} – ${format12Hour(endTimeStr)}`;
    const period = getPeriod(hour);

    let available = true;
    let reason: string | undefined = undefined;

    // Check if station is under maintenance
    if (station && station.status === 'MAINTENANCE') {
      available = false;
      reason = 'Station under maintenance';
    } else if (station && station.status === 'DEACTIVATED') {
      available = false;
      reason = 'Station currently unavailable';
    }

    // Check if time is in the past for today (with 15 min buffer)
    if (available && isToday) {
      if (hour < currentHourIst || (hour === currentHourIst && currentMinIst > 15)) {
        available = false;
        reason = 'Time slot has passed';
      }
    }

    // Check against existing bookings
    if (available && existingBookings.length > 0) {
      for (const booking of existingBookings) {
        const bStartHour = booking.startTime.getUTCHours();
        const bEndHour = booking.endTime.getUTCHours();

        // Check if candidate slot [hour, hour + durationHours] overlaps with [bStartHour, bEndHour]
        const candidateStart = hour;
        const candidateEnd = hour + durationHours;

        if (candidateStart < bEndHour && candidateEnd > bStartHour) {
          available = false;
          reason = 'Station already reserved for this slot';
          break;
        }
      }
    }

    slots.push({
      time: startTimeStr,
      endTime: endTimeStr,
      label,
      period,
      available,
      reason,
    });
  }

  return {
    stationId,
    date: dateStr,
    durationMinutes,
    operatingHours: { open: '10:00', close: '24:00' },
    slots,
  };
}
