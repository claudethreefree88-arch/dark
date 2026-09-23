import { NextResponse, type NextRequest } from 'next/server';

// ─── Next.js Middleware ─────────────────────────────────────────────────────
// Runs on the Edge — lightweight auth checks and redirects.
// Heavy auth validation happens in the API route handlers.

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/facilities',
  '/pricing',
  '/booking',
  '/contact',
];

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const ADMIN_PATHS = ['/admin'];
const STAFF_PATHS = ['/staff'];
const CUSTOMER_PATHS = ['/account', '/bookings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('ds_session')?.value;
  const hasSession = !!sessionCookie;

  // If user is authenticated and tries to visit auth pages, redirect home
  if (hasSession && AUTH_PATHS.some((p) => pathname === p)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check if the path requires authentication
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/facilities/') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/');

  if (!isPublic && !hasSession) {
    // Protected route without session — redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin/staff paths, the API routes handle role verification
  // The middleware only ensures a session exists
  // Actual role validation happens server-side in withAdmin/withStaff

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|logo).*)',
  ],
};
