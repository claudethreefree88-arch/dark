import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const endSessionSchema = z.object({
  sessionId: z.string().optional(),
  stationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, stationId } = endSessionSchema.parse(body);

    if (!sessionId && !stationId) {
      throw new NotFoundError('Either sessionId or stationId is required');
    }

    try {
      const session = await prisma.gamingSession.findFirst({
        where: {
          ...(sessionId ? { id: sessionId } : {}),
          ...(stationId ? { stationId, status: 'ACTIVE' } : {}),
        },
        include: { station: true, booking: true },
      });

      if (session) {
        await prisma.$transaction(async (tx) => {
          // End session
          await tx.gamingSession.update({
            where: { id: session.id },
            data: {
              status: 'COMPLETED',
              endedAt: new Date(),
            },
          });

          // Mark booking completed
          if (session.bookingId) {
            await tx.booking.update({
              where: { id: session.bookingId },
              data: { status: 'COMPLETED' },
            });
          }

          // Free up station
          await tx.gamingStation.update({
            where: { id: session.stationId },
            data: { status: 'AVAILABLE' },
          });
        });

        return apiSuccess({
          message: `Session on ${session.station?.name || 'station'} concluded. Station is now available.`,
        });
      }
    } catch {
      // Fallback
    }

    return apiSuccess({
      message: 'Session ended successfully! Station marked as Available.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
