import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, AuthError, handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { getSession } from '@/lib/session';
import { getActiveUserMembership, grantUserMembership } from '@/lib/memberships';
import { z } from 'zod';

const subscribeSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  paymentMethod: z.enum(['UPI', 'RAZORPAY', 'CASH', 'CASHFREE', 'OTHER']).default('UPI'),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new AuthError('Please sign in to view your membership');

    const [activeMembership, history, bookings] = await Promise.all([
      getActiveUserMembership(session.userId),
      prisma.membership.findMany({
        where: { userId: session.userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: {
          userId: session.userId,
          membershipDiscountPaise: { gt: 0 },
        },
        select: { membershipDiscountPaise: true },
      }),
    ]);

    const totalSavedPaise = bookings.reduce((sum, b) => sum + b.membershipDiscountPaise, 0);

    return apiSuccess({
      activeMembership,
      history,
      totalSavedPaise,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw new AuthError('Please sign in to purchase a membership');

    const body = await req.json();
    const { planId, paymentMethod } = subscribeSchema.parse(body);

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundError('Selected membership plan is currently unavailable');
    }

    const membership = await grantUserMembership({
      userId: session.userId,
      planId: plan.id,
      paymentMethod,
      pricePaidPaise: plan.pricePaise,
      notes: 'Purchased online via gamer portal',
    });

    return apiSuccess({
      message: `Welcome to ${plan.name}! Your Syndicate Pass is now active.`,
      membership,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
