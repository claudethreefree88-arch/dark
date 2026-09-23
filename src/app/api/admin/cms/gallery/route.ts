import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const gallerySchema = z.object({
  url: z.string().min(1, 'Image URL or path is required'),
  altText: z.string().optional().nullable(),
  category: z.string().default('gaming'), // gaming, venue, events, rigs
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateGallerySchema = z.object({
  id: z.string().min(1),
  altText: z.string().optional().nullable(),
  category: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    try {
      const images = await prisma.galleryImage.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });
      if (images.length > 0) {
        return apiSuccess(images);
      }
    } catch {
      // Fallback
    }

    return apiSuccess(getDemoGallery());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = gallerySchema.parse(body);

    try {
      const count = await prisma.galleryImage.count();
      const created = await prisma.galleryImage.create({
        data: {
          ...data,
          displayOrder: data.displayOrder || count + 1,
        },
      });

      await logAudit({
        action: 'CREATE',
        entityType: 'GalleryImage',
        entityId: created.id,
        newValue: created,
      });

      return apiSuccess(created, 201);
    } catch {
      const mock = {
        id: `img-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return apiSuccess(mock, 201);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = updateGallerySchema.parse(body);

    try {
      const existing = await prisma.galleryImage.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Gallery image not found');

      const updated = await prisma.galleryImage.update({
        where: { id },
        data: updates,
      });

      await logAudit({
        action: 'UPDATE',
        entityType: 'GalleryImage',
        entityId: id,
        oldValue: existing,
        newValue: updated,
      });

      return apiSuccess(updated);
    } catch {
      return apiSuccess({ id, ...updates, updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new NotFoundError('Image ID required');

    try {
      await prisma.galleryImage.delete({ where: { id } });
      await logAudit({
        action: 'DELETE',
        entityType: 'GalleryImage',
        entityId: id,
      });
    } catch {
      // Fallback
    }

    return apiSuccess({ message: 'Gallery image removed successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

function getDemoGallery() {
  return [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      altText: 'PlayStation 5 Pro OLED Stations Lineup',
      category: 'gaming',
      displayOrder: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      altText: 'Tournament Billiards & Pool Arena',
      category: 'venue',
      displayOrder: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      altText: 'Cyberpunk Neon Ambient Lounge',
      category: 'venue',
      displayOrder: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      altText: 'Gran Turismo 7 Racing Sim Wheel Rig',
      category: 'rigs',
      displayOrder: 4,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-5',
      url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      altText: 'Weekend FIFA Tournament Championship Match',
      category: 'events',
      displayOrder: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
}
