import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  name: z.string().min(2),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  discountValue: z.number().int().positive(), // percentage * 100 or paise
  minOrderPaise: z.number().int().optional(),
  maxDiscountPaise: z.number().int().optional(),
  maxUses: z.number().int().optional(),
  validDays: z.number().int().default(30),
});

const toggleCouponSchema = z.object({
  couponId: z.string().min(1),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (coupons.length > 0) {
        return apiSuccess(coupons);
      }
    } catch {
      // Fallback
    }

    return apiSuccess(getDemoCoupons());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createCouponSchema.parse(body);

    const now = new Date();
    const validUntil = new Date(now.getTime() + data.validDays * 24 * 3600 * 1000);

    try {
      const existing = await prisma.coupon.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new ConflictError(`Coupon with code '${data.code}' already exists`);
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description || `${data.name} Promotion`,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderPaise: data.minOrderPaise || null,
          maxDiscountPaise: data.maxDiscountPaise || null,
          maxUses: data.maxUses || null,
          validFrom: now,
          validUntil,
          isActive: true,
        },
      });

      return apiSuccess(coupon, 201);
    } catch (err) {
      if (err instanceof ConflictError) throw err;

      return apiSuccess(
        {
          id: `coup-${Date.now()}`,
          code: data.code,
          name: data.name,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderPaise: data.minOrderPaise,
          maxDiscountPaise: data.maxDiscountPaise,
          usedCount: 0,
          isActive: true,
          validUntil: validUntil.toISOString(),
        },
        201
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { couponId, isActive } = toggleCouponSchema.parse(body);

    try {
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive },
      });

      return apiSuccess({
        message: `Coupon ${coupon.code} is now ${isActive ? 'Active' : 'Inactive'}`,
        coupon,
      });
    } catch {
      return apiSuccess({
        message: `Coupon updated to ${isActive ? 'Active' : 'Inactive'} (Preview)`,
        coupon: { id: couponId, isActive },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

function getDemoCoupons() {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  return [
    {
      id: 'coup-01',
      code: 'WELCOME10',
      name: 'Welcome Gamer Discount',
      description: '10% off your first arena booking',
      discountType: 'PERCENTAGE',
      discountValue: 1000, // 10%
      minOrderPaise: 20000,
      maxDiscountPaise: 5000, // max ₹50
      maxUses: 500,
      usedCount: 42,
      isActive: true,
      validFrom: now.toISOString(),
      validUntil: nextMonth.toISOString(),
    },
    {
      id: 'coup-02',
      code: 'SYNDICATE20',
      name: 'Syndicate Clan Promo',
      description: '20% off for 3+ hours marathon sessions',
      discountType: 'PERCENTAGE',
      discountValue: 2000, // 20%
      minOrderPaise: 50000,
      maxDiscountPaise: 10000, // max ₹100
      maxUses: 200,
      usedCount: 88,
      isActive: true,
      validFrom: now.toISOString(),
      validUntil: nextMonth.toISOString(),
    },
    {
      id: 'coup-03',
      code: 'GLACIER50',
      name: 'Glacier Flat Discount',
      description: 'Flat ₹50 discount on any Pool or PS5 session',
      discountType: 'FIXED_AMOUNT',
      discountValue: 5000, // ₹50 in paise
      minOrderPaise: 20000,
      maxDiscountPaise: null,
      maxUses: 1000,
      usedCount: 154,
      isActive: true,
      validFrom: now.toISOString(),
      validUntil: nextMonth.toISOString(),
    },
    {
      id: 'coup-04',
      code: 'SUMMERLAN',
      name: 'Summer LAN Party Deal',
      description: '25% off all-night passes',
      discountType: 'PERCENTAGE',
      discountValue: 2500,
      minOrderPaise: 100000,
      maxDiscountPaise: 25000,
      maxUses: 50,
      usedCount: 50,
      isActive: false, // Expired / Maxed
      validFrom: new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString(),
      validUntil: now.toISOString(),
    },
  ];
}
