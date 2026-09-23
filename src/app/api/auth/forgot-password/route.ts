import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken } from '@/lib/auth';
import { forgotPasswordSchema } from '@/validators/auth.schema';
import { handleApiError, apiSuccess } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { RATE_LIMIT } from '@/lib/constants';

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limiting
    checkRateLimit(
      `forgot-password:${ip}`,
      RATE_LIMIT.PASSWORD_RESET.maxAttempts,
      RATE_LIMIT.PASSWORD_RESET.windowMs
    );

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Always return success (prevent email enumeration)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true },
    });

    if (user) {
      // Invalidate existing reset tokens
      await prisma.passwordReset.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() }, // Expire immediately
      });

      // Create new reset token (expires in 1 hour)
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // In development mode, log the token
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Password reset token for ${email}: ${token}`);
        console.log(
          `[DEV] Reset URL: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
        );
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'password_reset',
          entityId: user.id,
          ipAddress: ip,
        },
      });
    }

    // Always return success to prevent email enumeration
    return apiSuccess({
      message:
        'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
