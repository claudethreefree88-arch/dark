import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
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
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(bookings.map((booking) => ({
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
      isWalkIn: booking.isWalkIn,
      paymentStatus: booking.payments[0]?.status || 'UNPAID',
      paymentMethod: booking.payments[0]?.method || null,
      createdAt: booking.createdAt,
    })));
  } catch (error) {
    return handleApiError(error);
  }
}
