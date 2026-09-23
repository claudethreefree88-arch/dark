import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from './constants';
import { createAccessToken, verifyToken, type TokenPayload } from './auth';

// ─── Cookie-Based Session Management ────────────────────────────────────────

/**
 * Set the auth session cookie with a signed JWT.
 */
export async function setSessionCookie(payload: {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const token = await createAccessToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  });

  return token;
}

/**
 * Get the current session from the auth cookie.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Clear the auth session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Require a valid session. Throws if not authenticated.
 */
export async function requireSession(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

/**
 * Require a session with specific role(s).
 */
export async function requireRole(
  ...allowedRoles: string[]
): Promise<TokenPayload> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Access denied');
  }
  return session;
}
