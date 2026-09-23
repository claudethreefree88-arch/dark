import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: z.enum(['RAZORPAY', 'CASHFREE', 'UPI', 'CASH', 'OTHER']).default('UPI'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, amountPaise, method } = createOrderSchema.parse(body);

    const isMock = process.env.PAYMENT_MODE === 'mock' || !process.env.RAZORPAY_KEY_ID;
    const orderId = isMock
      ? `order_mock_${Date.now().toString().slice(-8)}`
      : `order_rzp_${Date.now().toString().slice(-8)}`;

    try {
      // Find booking and ensure it exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Record payment attempt in database
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId: booking.userId,
          amountPaise,
          method,
          status: 'PENDING',
          gatewayOrderId: orderId,
        },
      });

      return apiSuccess({
        orderId,
        paymentId: payment.id,
        amountPaise,
        currency: 'INR',
        method,
        isMock,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      });
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      // Dev/fallback mode
      return apiSuccess({
        orderId,
        paymentId: `pay-${Date.now()}`,
        amountPaise,
        currency: 'INR',
        method,
        isMock: true,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
