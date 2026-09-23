import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { handleApiError, apiSuccess, AuthError } from '@/lib/errors';

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Returns the current authenticated user's profile

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      throw new AuthError();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthError('Account is not active');
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
