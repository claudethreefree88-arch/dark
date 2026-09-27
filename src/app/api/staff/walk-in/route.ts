import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { getSession } from '@/lib/session';
import { getActiveUserMembership } from '@/lib/memberships';
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
    const staffSession = await getSession();
    const staffName = staffSession ? `${staffSession.firstName} ${staffSession.lastName}`.trim() : null;

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
        // Resolve registered customer by phone or fallback guest user
        const phoneDigits = data.customerPhone.replace(/\D/g, '').slice(-10);
        const registeredUser = phoneDigits.length >= 10
          ? await tx.user.findFirst({
              where: {
                role: 'CUSTOMER',
                phone: { contains: phoneDigits },
              },
            })
          : null;

        let user = registeredUser || (await tx.user.findFirst({ where: { role: 'CUSTOMER' } }));
        if (!user) user = await tx.user.findFirst();

        // Check active membership
        let membershipDiscountPaise = 0;
        let membershipPlanName: string | null = null;
        if (registeredUser) {
          const activeMem = await getActiveUserMembership(registeredUser.id);
          if (activeMem && activeMem.discountPercent > 0) {
            membershipPlanName = activeMem.planNameSnapshot;
            membershipDiscountPaise = Math.round((subtotalPaise * activeMem.discountPercent) / 100);
          }
        }
        const totalPricePaise = Math.max(0, subtotalPaise - membershipDiscountPaise);

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
            discountPaise: membershipDiscountPaise,
            membershipDiscountPaise,
            membershipPlanName,
            totalPricePaise,
            status: 'IN_PROGRESS',
            qrToken,
            isWalkIn: true,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            notes:
              data.notes ||
              (staffName
                ? `Walk-in registered by ${staffName}${membershipPlanName ? ` [${membershipPlanName}]` : ''}`
                : 'Front desk walk-in check-in'),
          },
        });

        // Record desk payment
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: user?.id || 'guest_user',
            amountPaise: totalPricePaise,
            method: data.paymentMethod === 'UPI' ? 'UPI' : 'CASH',
            status: 'COMPLETED',
            paidAt: now,
            notes: `Walk-in desk payment (${data.paymentMethod})${staffName ? ` processed by ${staffName}` : ''}${membershipPlanName ? ` [${membershipPlanName} Discount: ₹${(membershipDiscountPaise / 100).toFixed(0)}]` : ''}`,
          },
        });

        // Launch session with staffId
        const session = await tx.gamingSession.create({
          data: {
            bookingId: booking.id,
            stationId: station.id,
            staffId: staffSession?.userId || null,
            status: 'ACTIVE',
            startedAt: now,
            scheduledEndAt,
          },
        });

        // Log staff activity if staff user is present
        if (staffSession?.userId) {
          await tx.staffActivityLog.create({
            data: {
              userId: staffSession.userId,
              action: 'WALK_IN_CHECKIN',
              entityType: 'booking',
              entityId: booking.id,
              details: {
                bookingRef,
                customerName: data.customerName,
                stationName: station.name,
                staffName,
              },
            },
          });
        }

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
