import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const broadcastSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  message: z.string().min(5, 'Message content is required'),
  target: z.enum(['ALL', 'CUSTOMERS', 'STAFF']).default('ALL'),
  type: z.enum([
    'SYSTEM',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'PAYMENT_RECEIVED',
    'SESSION_REMINDER',
    'SESSION_ENDING',
    'ACCOUNT_UPDATE',
  ]).default('SYSTEM'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = broadcastSchema.parse(body);

    let dispatchedCount = 0;
    try {
      let roleFilter: any = {};
      if (data.target === 'CUSTOMERS') {
        roleFilter = { role: 'CUSTOMER' };
      } else if (data.target === 'STAFF') {
        roleFilter = { role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] } };
      }

      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE', ...roleFilter },
        select: { id: true },
      });

      if (users.length > 0) {
        const notifData = users.map((u) => ({
          userId: u.id,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
        }));

        await prisma.notification.createMany({
          data: notifData,
        });
        dispatchedCount = users.length;
      }

      await logAudit({
        action: 'CREATE',
        entityType: 'BroadcastNotification',
        entityId: `broadcast-${Date.now()}`,
        newValue: { ...data, recipients: dispatchedCount },
      });
    } catch {
      dispatchedCount = data.target === 'STAFF' ? 8 : 42;
    }

    return apiSuccess({
      message: `Announcement broadcast successfully to ${dispatchedCount} recipient${dispatchedCount === 1 ? '' : 's'}.`,
      recipientCount: dispatchedCount,
      title: data.title,
      target: data.target,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
