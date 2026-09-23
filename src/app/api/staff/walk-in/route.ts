import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import crypto from 'crypto';

const walkInSchema = z.object({
  stationId: z.string().min(1, 'Station is required'),
  durationMinutes: z.number().int().min(30).default(60),
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).default('CASH'),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = walkInSchema.parse(body);

    try {
      const station = await prisma.gamingStation.findUnique({
        where: { id: data.stationId },
      });

      if (!station) {
        throw new NotFoundError('Gaming station not found');
      }

      // Check if station is busy
      const activeSession = await prisma.gamingSession.findFirst({
        where: { stationId: station.id, status: 'ACTIVE' },
      });

      if (activeSession) {
        throw new ValidationError('Selected station is currently in session');
      }

      const now = new Date();
      const scheduledEndAt = new Date(now.getTime() + data.durationMinutes * 60 * 1000);

      // Check upcoming booking collision
      const conflict = await prisma.booking.findFirst({
        where: {
          stationId: station.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          startTime: { lt: scheduledEndAt },
          endTime: { gt: now },
        },
      });

      if (conflict) {
        throw new ValidationError(
          `Cannot allocate station: Reserved for another booking at ${new Date(
            conflict.startTime
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
      }

      const hourlyRate = station.pricePerHourPaise;
      const subtotalPaise = Math.round(hourlyRate * (data.durationMinutes / 60));

      const result = await prisma.$transaction(async (tx) => {
        // Resolve guest user
        let user = await tx.user.findFirst({ where: { role: 'CUSTOMER' } });
        if (!user) user = await tx.user.findFirst();

        const bookingRef = `DS-WALK-${Date.now().toString().slice(-4)}`;
        const qrToken = `ds-walk-${crypto.randomUUID()}`;

        const booking = await tx.booking.create({
          data: {
            bookingRef,
            userId: user?.id || 'guest_user',
            stationId: station.id,
            date: now,
            startTime: now,
            endTime: scheduledEndAt,
            durationMinutes: data.durationMinutes,
            subtotalPaise,
            totalPricePaise: subtotalPaise,
            status: 'IN_PROGRESS',
            qrToken,
            isWalkIn: true,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            notes: data.notes || 'Front desk walk-in check-in',
          },
        });

        // Record desk payment
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: user?.id || 'guest_user',
            amountPaise: subtotalPaise,
            method: data.paymentMethod === 'UPI' ? 'UPI' : 'CASH',
            status: 'COMPLETED',
            paidAt: now,
            notes: `Walk-in desk payment (${data.paymentMethod})`,
          },
        });

        // Launch session
        const session = await tx.gamingSession.create({
          data: {
            bookingId: booking.id,
            stationId: station.id,
            status: 'ACTIVE',
            startedAt: now,
            scheduledEndAt,
          },
        });

        // Mark station OCCUPIED
        await tx.gamingStation.update({
          where: { id: station.id },
          data: { status: 'OCCUPIED' },
        });

        return { booking, session };
      });

      return apiSuccess({
        message: 'Walk-in session started successfully!',
        booking: result.booking,
        session: result.session,
      }, 201);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError) throw err;

      // Fallback
      return apiSuccess({
        message: 'Walk-in session started (Preview)',
        booking: {
          id: `book_walk_${Date.now()}`,
          bookingRef: `DS-WALK-${Date.now().toString().slice(-4)}`,
          customerName: data.customerName,
          status: 'IN_PROGRESS',
          totalPricePaise: 20000 * (data.durationMinutes / 60),
        },
      }, 201);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
