import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { requireRole } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'SUPER_ADMIN', 'STAFF');
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const stationId = searchParams.get('stationId') || '';

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(stationId ? { stationId } : {}),
        ...(search
          ? {
              OR: [
                { bookingRef: { contains: search } },
                { customerName: { contains: search } },
                { customerPhone: { contains: search } },
                { user: { email: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        station: { include: { facility: true } },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        session: {
          include: {
            staff: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Lookup staff activity logs for walk-ins without explicit session staff
    const walkInIds = bookings.filter((b) => b.isWalkIn && !b.session?.staff).map((b) => b.id);
    const staffLogs =
      walkInIds.length > 0
        ? await prisma.staffActivityLog.findMany({
            where: { entityId: { in: walkInIds } },
            include: { user: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    const staffMap = new Map<string, string>();
    for (const log of staffLogs) {
      if (log.entityId && log.user && !staffMap.has(log.entityId)) {
        staffMap.set(log.entityId, `${log.user.firstName} ${log.user.lastName}`.trim());
      }
    }

    return apiSuccess(
      bookings.map((booking) => {
        const isWalkIn = Boolean(booking.isWalkIn);
        let staffName: string | null = null;

        if (isWalkIn) {
          if (booking.session?.staff) {
            staffName = `${booking.session.staff.firstName} ${booking.session.staff.lastName}`.trim();
          } else if (staffMap.has(booking.id)) {
            staffName = staffMap.get(booking.id)!;
          } else if (booking.notes && /by\s+([A-Za-z0-9\s]+)/i.test(booking.notes)) {
            const match = booking.notes.match(/by\s+([A-Za-z0-9\s]+)/i);
            if (match && match[1]) {
              staffName = match[1].trim();
            }
          }
          if (!staffName) {
            staffName = 'Front Desk Staff';
          }
        }

        const gameTitle =
          booking.session?.notes ||
          (booking.notes?.match(/Game:\s*([^.\n\r\[]+)/)?.[1]?.trim()) ||
          null;

        return {
          id: booking.id,
          bookingRef: booking.bookingRef,
          customerName: booking.customerName || `${booking.user.firstName} ${booking.user.lastName}`.trim(),
          customerEmail: booking.user.email,
          customerPhone: booking.customerPhone || booking.user.phone,
          stationId: booking.stationId,
          stationName: booking.station.name,
          facilityName: booking.station.facility.name,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          durationMinutes: booking.durationMinutes,
          totalPricePaise: booking.totalPricePaise,
          status: booking.status,
          isWalkIn,
          channel: isWalkIn ? 'DESK' : 'ONLINE',
          bookedVia: isWalkIn ? 'Front Desk Walk-in' : 'Online Website',
          staffName: isWalkIn ? staffName : null,
          paymentStatus: booking.payments[0]?.status || 'UNPAID',
          paymentMethod: booking.payments[0]?.method || null,
          createdAt: booking.createdAt,
          gameTitle,
          notes: booking.notes,
          stationSpecs:
            (booking.station?.metadata as any)?.specs || 'Ultra-low latency 4K 120Hz display',
          stationCapacity:
            (booking.station?.metadata as any)?.capacity || (booking.station?.stationType === 'PS5' ? 2 : 4),
          stationType: booking.station?.stationType || 'PS5',
          pricePerHourPaise: booking.station?.pricePerHourPaise || 15000,
          session: booking.session
            ? {
                id: booking.session.id,
                status: booking.session.status,
                startedAt: booking.session.startedAt,
                scheduledEndAt: booking.session.scheduledEndAt,
                extensionMinutes: booking.session.extensionMinutes,
                gameTitle,
              }
            : booking.status === 'IN_PROGRESS' || booking.status === 'CHECKED_IN'
            ? {
                id: `active-${booking.id}`,
                status: 'ACTIVE',
                startedAt: booking.startTime,
                scheduledEndAt: booking.endTime,
                extensionMinutes: 0,
                gameTitle,
              }
            : null,
        };
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
