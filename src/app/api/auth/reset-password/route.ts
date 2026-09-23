import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/validators/auth.schema';
import { handleApiError, apiSuccess, ValidationError } from '@/lib/errors';
import { getClientIp } from '@/lib/rate-limit';

// ─── POST /api/auth/reset-password ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find valid reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!resetRecord) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (resetRecord.usedAt) {
      throw new ValidationError('This reset token has already been used');
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new ValidationError('This reset token has expired');
    }

    // Hash new password and update in transaction
    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });

      // Mark token as used
      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: resetRecord.userId,
          action: 'UPDATE',
          entityType: 'password',
          entityId: resetRecord.userId,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      });
    });

    return apiSuccess({
      message: 'Password has been reset successfully. Please log in.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
