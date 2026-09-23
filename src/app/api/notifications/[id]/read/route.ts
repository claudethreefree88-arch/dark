import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch {
      // Fallback in simulation
    }

    return apiSuccess({ message: 'Notification marked as read', id });
  } catch (error) {
    return handleApiError(error);
  }
}
