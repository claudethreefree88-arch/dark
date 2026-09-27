import { prisma } from '@/lib/prisma';
import { apiSuccess, AuthError, handleApiError } from '@/lib/errors';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new AuthError();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.notification.count({
        where: { userId: session.userId, isRead: false },
      }),
    ]);

    return apiSuccess({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  try {
    const session = await getSession();
    if (!session) throw new AuthError();

    const result = await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });

    return apiSuccess({ message: 'All notifications marked as read', updatedCount: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
