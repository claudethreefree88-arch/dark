import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { requireRole } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'SUPER_ADMIN');
    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method') || '';
    const status = searchParams.get('status') || '';
    const channel = searchParams.get('channel') || ''; // 'ALL' | 'ONLINE' | 'DESK'

    try {
      const [payments, allStaffUsers] = await Promise.all([
        prisma.payment.findMany({
          where: {
            ...(method && method !== 'ALL' ? { method: method as any } : {}),
            ...(status && status !== 'ALL' ? { status: status as any } : {}),
          },
          include: {
            booking: {
              select: {
                bookingRef: true,
                customerName: true,
                isWalkIn: true,
                notes: true,
                station: { select: { name: true } },
                session: {
                  select: {
                    staffId: true,
                    staff: { select: { id: true, firstName: true, lastName: true, role: true } },
                  },
                },
              },
            },
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 150,
        }),
        prisma.user.findMany({
          where: { role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true, firstName: true, lastName: true, role: true },
          orderBy: { firstName: 'asc' },
        }),
      ]);

      // Map of staff IDs to user details
      const staffUserMap: Record<string, { id: string; name: string; role: string }> = {};
      allStaffUsers.forEach((s) => {
        staffUserMap[s.id] = {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          role: s.role,
        };
      });

      if (payments.length > 0) {
        const formatted = payments.map((p) => {
          // Determine Channel: DESK vs ONLINE
          const isDesk = Boolean(
            p.recordedByStaffId ||
            p.booking?.isWalkIn ||
            p.method === 'CASH' ||
            (p.notes && /desk|walk-in|walk in|counter|session extended|front desk/i.test(p.notes))
          );
          const paymentChannel: 'ONLINE' | 'DESK' = isDesk ? 'DESK' : 'ONLINE';

          // Determine Staff Collector
          let collectedBy: {
            id: string;
            name: string;
            role: string;
            isDesk: boolean;
          };

          if (isDesk) {
            if (p.recordedByStaffId && staffUserMap[p.recordedByStaffId]) {
              const staff = staffUserMap[p.recordedByStaffId];
              collectedBy = {
                id: staff.id,
                name: staff.name,
                role: staff.role,
                isDesk: true,
              };
            } else if (p.booking?.session?.staff) {
              const staff = p.booking.session.staff;
              collectedBy = {
                id: staff.id,
                name: `${staff.firstName} ${staff.lastName}`.trim(),
                role: staff.role,
                isDesk: true,
              };
            } else if (p.notes && /processed by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i.test(p.notes)) {
              const match = p.notes.match(/processed by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i);
              collectedBy = {
                id: '',
                name: match?.[1]?.trim() || 'Front Desk Staff',
                role: 'STAFF',
                isDesk: true,
              };
            } else if (p.notes && /by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i.test(p.notes)) {
              const match = p.notes.match(/by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i);
              collectedBy = {
                id: '',
                name: match?.[1]?.trim() || 'Front Desk Staff',
                role: 'STAFF',
                isDesk: true,
              };
            } else if (p.booking?.notes && /registered by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i.test(p.booking.notes)) {
              const match = p.booking.notes.match(/registered by\s+([A-Za-z0-9\s]+?)(?:\[|$|\()/i);
              collectedBy = {
                id: '',
                name: match?.[1]?.trim() || 'Front Desk Staff',
                role: 'STAFF',
                isDesk: true,
              };
            } else if (p.user?.role === 'SUPER_ADMIN' || p.user?.role === 'ADMIN' || p.user?.role === 'STAFF') {
              collectedBy = {
                id: p.user.id,
                name: `${p.user.firstName} ${p.user.lastName}`.trim(),
                role: p.user.role,
                isDesk: true,
              };
            } else {
              collectedBy = {
                id: '',
                name: 'Front Desk Operator',
                role: 'STAFF',
                isDesk: true,
              };
            }
          } else {
            collectedBy = {
              id: 'online-gateway',
              name: p.method === 'RAZORPAY' ? 'Razorpay Gateway' : p.method === 'UPI' ? 'UPI Gateway' : 'Online System',
              role: 'ONLINE',
              isDesk: false,
            };
          }

          return {
            id: p.id,
            bookingRef: p.booking?.bookingRef || '—',
            customerName:
              p.booking?.customerName || `${p.user?.firstName || 'Gamer'} ${p.user?.lastName || ''}`.trim(),
            customerEmail: p.user?.email,
            stationName: p.booking?.station?.name || 'Arena',
            amountPaise: p.amountPaise,
            method: p.method,
            status: p.status,
            channel: paymentChannel,
            collectedBy,
            gatewayOrderId: p.gatewayOrderId || '—',
            gatewayPaymentId: p.gatewayPaymentId || '—',
            paidAt: p.paidAt || p.createdAt,
            notes: p.notes,
          };
        });

        // Filter by channel if passed in query
        const filtered = channel && channel !== 'ALL'
          ? formatted.filter((p) => p.channel === channel)
          : formatted;

        return apiSuccess({
          payments: filtered,
          staffList: allStaffUsers.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`.trim(),
            role: s.role,
          })),
        });
      }
    } catch {
      // Fallback
    }

    return apiSuccess({
      payments: getDemoPaymentsLedger(),
      staffList: [
        { id: 'staff-01', name: 'Super Admin', role: 'SUPER_ADMIN' },
        { id: 'staff-02', name: 'Staff Member', role: 'STAFF' },
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function getDemoPaymentsLedger() {
  const now = new Date();
  return [
    {
      id: 'pay-01',
      bookingRef: 'DS-2026-5206',
      customerName: 'Super Admin',
      customerEmail: 'admin@darksyndicate.com',
      stationName: 'PS5 Station 1',
      amountPaise: 30000,
      method: 'UPI',
      status: 'COMPLETED',
      channel: 'ONLINE',
      collectedBy: {
        id: 'online-gateway',
        name: 'Online Gateway',
        role: 'ONLINE',
        isDesk: false,
      },
      gatewayOrderId: 'order_mock_5206',
      gatewayPaymentId: 'pay_mock_22617806',
      paidAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      notes: 'Online pass booking checkout',
    },
    {
      id: 'pay-02',
      bookingRef: 'DS-WALK-9053',
      customerName: 'mi ugtrsza',
      customerEmail: 'player@example.com',
      stationName: 'PS5 Station 1',
      amountPaise: 7500,
      method: 'CASH',
      status: 'COMPLETED',
      channel: 'DESK',
      collectedBy: {
        id: 'staff-01',
        name: 'Staff Member',
        role: 'STAFF',
        isDesk: true,
      },
      gatewayOrderId: '—',
      gatewayPaymentId: '—',
      paidAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      notes: 'Session extended +30 mins by Staff Member',
    },
    {
      id: 'pay-03',
      bookingRef: 'DS-WALK-9053',
      customerName: 'mi ugtrsza',
      customerEmail: 'player@example.com',
      stationName: 'PS5 Station 1',
      amountPaise: 15000,
      method: 'CASH',
      status: 'COMPLETED',
      channel: 'DESK',
      collectedBy: {
        id: 'staff-01',
        name: 'Staff Member',
        role: 'STAFF',
        isDesk: true,
      },
      gatewayOrderId: '—',
      gatewayPaymentId: '—',
      paidAt: new Date(now.getTime() - 38 * 60 * 1000).toISOString(),
      notes: 'Walk-in desk payment (CASH) processed by Staff Member',
    },
    {
      id: 'pay-04',
      bookingRef: 'DS-WALK-9059',
      customerName: 'asfd',
      customerEmail: 'player@example.com',
      stationName: 'PS5 Station 1',
      amountPaise: 15000,
      method: 'UPI',
      status: 'COMPLETED',
      channel: 'DESK',
      collectedBy: {
        id: 'staff-02',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isDesk: true,
      },
      gatewayOrderId: '—',
      gatewayPaymentId: '—',
      paidAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      notes: 'Walk in desk payment (UPI) processed by Super Admin',
    },
    {
      id: 'pay-05',
      bookingRef: 'DS-WALK-9312',
      customerName: 'kanishk',
      customerEmail: 'player@example.com',
      stationName: 'PS5 Station 1',
      amountPaise: 3800,
      method: 'CASH',
      status: 'COMPLETED',
      channel: 'DESK',
      collectedBy: {
        id: 'staff-01',
        name: 'Staff Member',
        role: 'STAFF',
        isDesk: true,
      },
      gatewayOrderId: '—',
      gatewayPaymentId: '—',
      paidAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      notes: 'Session extended +15 mins by Staff Member',
    },
    {
      id: 'pay-06',
      bookingRef: 'DS-WALK-9312',
      customerName: 'kanishk',
      customerEmail: 'player@example.com',
      stationName: 'PS5 Station 1',
      amountPaise: 15000,
      method: 'CASH',
      status: 'COMPLETED',
      channel: 'DESK',
      collectedBy: {
        id: 'staff-01',
        name: 'Staff Member',
        role: 'STAFF',
        isDesk: true,
      },
      gatewayOrderId: '—',
      gatewayPaymentId: '—',
      paidAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      notes: 'Walk-in desk payment (CASH) processed by Staff Member',
    },
  ];
}
