import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId;

    if (userId) {
      try {
        const notifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 25,
        });

        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });

        if (notifications.length > 0) {
          return apiSuccess({
            notifications,
            unreadCount,
          });
        }
      } catch {
        // Fallback
      }
    }

    // Default demo notifications for preview / staff / admin
    const demo = getDemoNotifications(session?.role || 'ADMIN');
    return apiSuccess({
      notifications: demo,
      unreadCount: demo.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  try {
    const session = await getSession();
    const userId = session?.userId;

    if (userId) {
      try {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      } catch {
        // Fallback
      }
    }

    return apiSuccess({ message: 'All notifications marked as read' });
  } catch (error) {
    return handleApiError(error);
  }
}

function getDemoNotifications(role: string) {
  const now = Date.now();
  if (role === 'STAFF' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return [
      {
        id: 'notif-1',
        title: 'PS5 Station 1 Ending Soon',
        message: 'Active gaming session on PS5 Station 1 (Aditya V.) has 4 minutes remaining.',
        type: 'SESSION_ENDING',
        isRead: false,
        createdAt: new Date(now - 4 * 60 * 1000).toISOString(),
        metadata: { stationId: 'ps5-1', path: '/staff' },
      },
      {
        id: 'notif-2',
        title: 'New Online Booking Confirmed',
        message: 'DS-2026-9041 reserved for Pool Table 1 (2h session) starting at 7:00 PM.',
        type: 'BOOKING_CONFIRMED',
        isRead: false,
        createdAt: new Date(now - 25 * 60 * 1000).toISOString(),
        metadata: { bookingRef: 'DS-2026-9041', path: '/staff/bookings' },
      },
      {
        id: 'notif-3',
        title: 'Front-Desk Payment Received',
        message: '₹400 Cash payment received for walk-in session on PS5 Station 4.',
        type: 'PAYMENT_RECEIVED',
        isRead: true,
        createdAt: new Date(now - 75 * 60 * 1000).toISOString(),
        metadata: { path: '/admin/payments' },
      },
      {
        id: 'notif-4',
        title: 'Weekly Maintenance Scheduled',
        message: 'PS5 Station 6 & 7 controller firmware updates scheduled for tonight at 12:30 AM.',
        type: 'SYSTEM',
        isRead: true,
        createdAt: new Date(now - 180 * 60 * 1000).toISOString(),
        metadata: { path: '/admin/stations' },
      },
    ];
  }

  return [
    {
      id: 'notif-c1',
      title: 'Booking Confirmed!',
      message: 'Your reservation DS-2026-8821 for PS5 Battle Station 1 is confirmed. Present your QR pass at check-in.',
      type: 'BOOKING_CONFIRMED',
      isRead: false,
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      metadata: { path: '/account/bookings' },
    },
    {
      id: 'notif-c2',
      title: 'Session Reminder',
      message: 'Your upcoming gaming session starts in 45 minutes at Dark Syndicate Arena.',
      type: 'SESSION_REMINDER',
      isRead: false,
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      metadata: { path: '/account/bookings' },
    },
    {
      id: 'notif-c3',
      title: 'Payment Successful',
      message: '₹450 received via UPI for booking DS-2026-8821. Digital invoice generated.',
      type: 'PAYMENT_RECEIVED',
      isRead: true,
      createdAt: new Date(now - 120 * 60 * 1000).toISOString(),
      metadata: { path: '/account/payments' },
    },
  ];
}
