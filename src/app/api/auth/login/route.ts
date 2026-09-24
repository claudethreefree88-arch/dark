import { after, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import { loginSchema } from '@/validators/auth.schema';
import { handleApiError, apiSuccess, AuthError, AppError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { RATE_LIMIT } from '@/lib/constants';

// ─── POST /api/auth/login ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate limiting
    checkRateLimit(
      `login:${ip}`,
      RATE_LIMIT.LOGIN.maxAttempts,
      RATE_LIMIT.LOGIN.windowMs
    );

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    // Check account status
    if (user.status === 'BLOCKED') {
      throw new AppError(
        'Your account has been blocked. Please contact support.',
        403,
        'ACCOUNT_BLOCKED'
      );
    }

    if (user.status === 'DEACTIVATED') {
      throw new AppError(
        'Your account has been deactivated.',
        403,
        'ACCOUNT_DEACTIVATED'
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AuthError('Invalid email or password');
    }

    // Set session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // These bookkeeping writes are not required to authenticate the user.
    // Run them after the response so login is not delayed by two extra DB writes.
    after(async () => {
      try {
        await Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }),
          prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN',
              entityType: 'user',
              entityId: user.id,
              ipAddress: ip,
              userAgent: request.headers.get('user-agent') || undefined,
            },
          }),
        ]);
      } catch (error) {
        console.error('Post-login bookkeeping failed:', error);
      }
    });

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
