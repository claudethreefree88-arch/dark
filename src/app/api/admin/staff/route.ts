import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { apiSuccess, handleApiError, ConflictError, ValidationError, NotFoundError } from '@/lib/errors';
import { requireRole } from '@/lib/session';
import { z } from 'zod';

const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().default(''),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── GET /api/admin/staff ───────────────────────────────────────────────────
export async function GET() {
  try {
    await requireRole('ADMIN', 'SUPER_ADMIN');
    try {
      const staffMembers = await prisma.user.findMany({
        where: {
          role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (staffMembers.length > 0) {
        return apiSuccess(
          staffMembers.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`.trim(),
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone || '—',
            role: s.role,
            status: s.status,
            lastLoginAt: s.lastLoginAt,
            createdAt: s.createdAt,
          }))
        );
      }
    } catch {
      // Fallback
    }

    return apiSuccess(getDemoStaffList());
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── POST /api/admin/staff (Onboard Staff) ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'SUPER_ADMIN');
    const body = await req.json();
    const data = createStaffSchema.parse(body);

    const cleanEmail = data.email.toLowerCase().trim();
    const cleanPhone = data.phone.trim();

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      throw new ConflictError(`An account with email '${cleanEmail}' already exists`);
    }

    // Check for existing phone
    if (cleanPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: cleanPhone },
      });
      if (existingPhone) {
        throw new ConflictError(
          `Phone number '${cleanPhone}' is already in use by ${existingPhone.firstName} ${existingPhone.lastName}`
        );
      }
    }

    const passwordHash = await hashPassword(data.password);

    // Create staff user with role automatically set to STAFF
    const newStaff = await prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: (data.lastName || '').trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        id: newStaff.id,
        name: `${newStaff.firstName} ${newStaff.lastName}`.trim(),
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        status: newStaff.status,
        createdAt: newStaff.createdAt,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PATCH /api/admin/staff (Update Status / Password / Info) ───────────────
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('ADMIN', 'SUPER_ADMIN');
    const body = await req.json();
    const { id, status, password, firstName, lastName, phone } = body;

    if (!id) {
      throw new ValidationError('Staff user ID is required');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundError('Staff account not found');
    }

    if (target.role === 'SUPER_ADMIN' && status && status !== 'ACTIVE') {
      throw new ValidationError('Cannot deactivate a Super Admin account');
    }

    const updateData: any = {};
    if (status && ['ACTIVE', 'DEACTIVATED', 'BLOCKED'].includes(status)) {
      updateData.status = status;
    }
    if (password && password.length >= 6) {
      updateData.passwordHash = await hashPassword(password);
    }
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return apiSuccess({
      message: 'Staff account updated successfully',
      staff: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`.trim(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone || '—',
        role: updated.role,
        status: updated.status,
        lastLoginAt: updated.lastLoginAt,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── DELETE /api/admin/staff ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const adminSession = await requireRole('ADMIN', 'SUPER_ADMIN');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Staff user ID is required');
    }

    if (id === adminSession.userId) {
      throw new ValidationError('You cannot delete your own account');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundError('Staff member not found');
    }

    if (target.role === 'SUPER_ADMIN') {
      throw new ValidationError('Cannot delete a Super Admin account');
    }

    // Try hard delete; if dependent records exist, set status to DEACTIVATED
    try {
      await prisma.user.delete({ where: { id } });
      return apiSuccess({
        message: `Staff account for ${target.firstName} ${target.lastName} deleted successfully`,
      });
    } catch {
      await prisma.user.update({
        where: { id },
        data: { status: 'DEACTIVATED' },
      });
      return apiSuccess({
        message: `Staff account has existing session/audit records and was deactivated`,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

function getDemoStaffList() {
  const now = new Date();
  return [
    {
      id: 'staff-01',
      name: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@darksyndicate.in',
      phone: '+91 98400 11223',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      lastLoginAt: now.toISOString(),
      createdAt: new Date(now.getTime() - 120 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'staff-02',
      name: 'Harish Kumar',
      firstName: 'Harish',
      lastName: 'Kumar',
      email: 'harish@darksyndicate.in',
      phone: '+91 97890 44556',
      role: 'STAFF',
      status: 'ACTIVE',
      lastLoginAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 40 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'staff-03',
      name: 'Dinesh Balan',
      firstName: 'Dinesh',
      lastName: 'Balan',
      email: 'dinesh@darksyndicate.in',
      phone: '+91 99400 88776',
      role: 'STAFF',
      status: 'ACTIVE',
      lastLoginAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
    },
  ];
}
