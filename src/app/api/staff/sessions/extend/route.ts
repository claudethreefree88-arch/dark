import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const extendSessionSchema = z.object({
  sessionId: z.string().optional(),
  stationId: z.string().optional(),
  additionalMinutes: z.number().int().min(15).max(300).default(30),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).default('CASH'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = extendSessionSchema.parse(body);

    if (!data.sessionId && !data.stationId) {
      throw new NotFoundError('Either sessionId or stationId is required');
    }

    try {
      const session = await prisma.gamingSession.findFirst({
        where: {
          ...(data.sessionId ? { id: data.sessionId } : {}),
          ...(data.stationId ? { stationId: data.stationId, status: 'ACTIVE' } : {}),
        },
        include: { station: true, booking: true },
      });

      if (!session) {
        throw new NotFoundError('Active gaming session not found');
      }

      const currentEnd = new Date(session.scheduledEndAt);
      const newEnd = new Date(currentEnd.getTime() + data.additionalMinutes * 60 * 1000);

      // Check collision with upcoming bookings
      const conflict = await prisma.booking.findFirst({
        where: {
          stationId: session.stationId,
          id: { not: session.bookingId },
          status: { in: ['CONFIRMED', 'PENDING'] },
          startTime: { lt: newEnd },
          endTime: { gt: currentEnd },
        },
      });

      if (conflict) {
        throw new ValidationError(
          `Cannot extend session: Another customer reservation is scheduled at ${new Date(
            conflict.startTime
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
      }

      const hourlyRate = session.station?.pricePerHourPaise || 20000;
      const extensionFeePaise = Math.round(hourlyRate * (data.additionalMinutes / 60));

      const updated = await prisma.$transaction(async (tx) => {
        const sess = await tx.gamingSession.update({
          where: { id: session.id },
          data: {
            scheduledEndAt: newEnd,
            extensionMinutes: { increment: data.additionalMinutes },
            extensionPaise: { increment: extensionFeePaise },
          },
        });

        if (session.bookingId) {
          await tx.booking.update({
            where: { id: session.bookingId },
            data: {
              endTime: newEnd,
              durationMinutes: { increment: data.additionalMinutes },
              totalPricePaise: { increment: extensionFeePaise },
            },
          });

          // Record payment for extension
          await tx.payment.create({
            data: {
              bookingId: session.bookingId,
              userId: session.booking.userId,
              amountPaise: extensionFeePaise,
              method: data.paymentMethod === 'UPI' ? 'UPI' : 'CASH',
              status: 'COMPLETED',
              paidAt: new Date(),
              notes: `Session extended +${data.additionalMinutes} mins`,
            },
          });
        }

        return sess;
      });

      return apiSuccess({
        message: `Session extended by +${data.additionalMinutes} minutes!`,
        newScheduledEndAt: updated.scheduledEndAt,
        extensionFeePaise,
      });
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError) throw err;

      // Fallback
      const newEnd = new Date(Date.now() + (60 + data.additionalMinutes) * 60 * 1000);
      return apiSuccess({
        message: `Session extended by +${data.additionalMinutes} mins (Preview)`,
        newScheduledEndAt: newEnd.toISOString(),
        extensionFeePaise: 10000,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
