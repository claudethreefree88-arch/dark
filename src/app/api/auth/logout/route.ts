import { NextRequest } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { handleApiError, apiSuccess } from '@/lib/errors';
import { getClientIp } from '@/lib/rate-limit';

// ─── POST /api/auth/logout ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'LOGOUT',
          entityType: 'user',
          entityId: session.userId,
          ipAddress: getClientIp(request),
        },
      });
    }

    await clearSessionCookie();

    return apiSuccess({ message: 'Logged out successfully' });
  } catch (error) {
    // Always clear cookie even if audit fails
    try {
      await clearSessionCookie();
    } catch {
      // Ignore
    }
    return handleApiError(error);
  }
}
