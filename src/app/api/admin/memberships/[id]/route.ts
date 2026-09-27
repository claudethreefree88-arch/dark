import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, AuthError, ForbiddenError, handleApiError, NotFoundError } from '@/lib/errors';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new AuthError();
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') throw new ForbiddenError();
  return session;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.membership.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!existing) throw new NotFoundError('Membership');

    const updated = await prisma.membership.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        entityType: 'Membership',
        entityId: id,
        oldValue: { status: existing.status },
        newValue: { status: 'CANCELLED', customer: `${existing.user.firstName} ${existing.user.lastName}`.trim() },
      },
    }).catch(() => {});

    return apiSuccess({
      message: 'Membership status updated to CANCELLED',
      membership: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
