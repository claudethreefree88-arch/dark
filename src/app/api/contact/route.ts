import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, handleApiError, ValidationError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal('')),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  inquiryType: z.enum(['GENERAL', 'BOOKING', 'TOURNAMENT', 'PARTY', 'FEEDBACK']).default('GENERAL'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimitKey = `contact:${ip}`;
    checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    const body = await req.json();
    const validatedData = contactSchema.parse(body);

    // In production, send email notification via nodemailer or save to Inquiry table
    console.log('📬 New Contact Inquiry Received:', {
      ...validatedData,
      ip,
      receivedAt: new Date().toISOString(),
    });

    return apiSuccess(
      {
        message: 'Your inquiry has been received. Our team will contact you shortly!',
        ticketId: `DS-INQ-${Date.now().toString().slice(-6)}`,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
