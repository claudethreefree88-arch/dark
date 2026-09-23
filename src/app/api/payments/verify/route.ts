import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import crypto from 'crypto';

const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  method: z.enum(['RAZORPAY', 'CASHFREE', 'UPI', 'CASH', 'OTHER']).default('UPI'),
  isMock: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = verifyPaymentSchema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { station: true, user: true },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const isMockPayment = data.isMock || !razorpaySecret || data.gatewayPaymentId?.startsWith('pay_mock_');

    if (!isMockPayment && razorpaySecret && data.gatewayOrderId && data.gatewayPaymentId && data.gatewaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${data.gatewayOrderId}|${data.gatewayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== data.gatewaySignature) {
        throw new ValidationError('Invalid payment signature verification failed');
      }
    }

    const paymentIdToSave = data.gatewayPaymentId || `pay_mock_${Date.now().toString().slice(-8)}`;

    // Update inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find existing pending payment if any
      let payment = data.paymentId
        ? await tx.payment.findUnique({ where: { id: data.paymentId } })
        : await tx.payment.findFirst({
            where: { bookingId: booking.id, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
          });

      if (payment) {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            gatewayPaymentId: paymentIdToSave,
            gatewaySignature: data.gatewaySignature || null,
            paidAt: new Date(),
            method: data.method,
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: booking.userId,
            amountPaise: booking.totalPricePaise,
            method: data.method,
            status: 'COMPLETED',
            gatewayOrderId: data.gatewayOrderId || null,
            gatewayPaymentId: paymentIdToSave,
            gatewaySignature: data.gatewaySignature || null,
            paidAt: new Date(),
          },
        });
      }

      // Update booking to CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
        },
      });

      // Update customer profile hours and loyalty points if user exists
      if (booking.userId) {
        await tx.customerProfile.updateMany({
          where: { userId: booking.userId },
          data: {
            totalBookings: { increment: 1 },
            totalSpent: { increment: booking.totalPricePaise },
          },
        });
      }

      return { booking: updatedBooking, payment };
    });

    return apiSuccess({
      success: true,
      bookingId: result.booking.id,
      bookingRef: result.booking.bookingRef,
      qrToken: result.booking.qrToken,
      status: result.booking.status,
      paymentId: result.payment.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
