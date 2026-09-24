import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/errors';

// Fallback seed data in case database is in setup mode
const DEFAULT_FACILITIES = [
  {
    id: 'fac-ps5',
    name: 'PlayStation 5 Arena',
    description:
      '3 PlayStation 5 setups featuring 55-inch 4K 120Hz OLED displays, low-latency HDMI 2.1, Sony DualSense wireless controllers, and competitive gaming headsets. Single player ₹150/hr, 2 players ₹200/hr, 3-4 players ₹250/hr.',
    displayOrder: 1,
    isActive: true,
    stations: [
      {
        id: 'station-ps5-01',
        name: 'PS5 Station 1',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 15000, // ₹150 / hr (single player base)
        capacity: 4,
        specs: 'Sony PS5, 55" LG OLED 4K 120Hz, DualSense Controllers, SteelSeries Arctis Nova 7P. Single ₹150/hr, Duo ₹200/hr, Squad (3-4) ₹250/hr.',
        games: ['EA FC 24', 'Tekken 8', 'Spider-Man 2', 'Call of Duty: Modern Warfare III', 'Mortal Kombat 1'],
      },
      {
        id: 'station-ps5-02',
        name: 'PS5 Station 2',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 15000,
        capacity: 4,
        specs: 'Sony PS5, 55" LG OLED 4K 120Hz, DualSense Controllers, Sony Pulse 3D Audio. Single ₹150/hr, Duo ₹200/hr, Squad (3-4) ₹250/hr.',
        games: ['God of War Ragnarok', 'Gran Turismo 7', 'NBA 2K24', 'WWE 2K24', 'It Takes Two'],
      },
      {
        id: 'station-ps5-03',
        name: 'PS5 Station 3',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 15000,
        capacity: 4,
        specs: 'Sony PS5, 55" LG OLED 4K 120Hz, DualSense Controllers, SteelSeries 3D Audio. Single ₹150/hr, Duo ₹200/hr, Squad (3-4) ₹250/hr.',
        games: ['EA FC 24', 'Tekken 8', 'Overcooked! All You Can Eat', 'Rocket League', 'WWE 2K24'],
      },
    ],
  },
  {
    id: 'fac-snooker',
    name: 'Snooker Lounge',
    description:
      '3 championship snooker tables with premium accessories. ₹250/hr per table for 3-4 players, +₹50 per extra person beyond 4.',
    displayOrder: 2,
    isActive: true,
    stations: [
      {
        id: 'station-snooker-01',
        name: 'Snooker Table 1',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 25000, // ₹250 / hr
        capacity: 4,
        specs: 'Full-size Championship Snooker Table, Shadowless LED Canopy, Premium Cues & Accessories. ₹250/hr (3-4 players), +₹50 per extra person.',
        games: ['Snooker', 'English Pool', '8-Ball'],
      },
      {
        id: 'station-snooker-02',
        name: 'Snooker Table 2',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 25000,
        capacity: 4,
        specs: 'Full-size Championship Snooker Table, Shadowless LED Canopy, Premium Cues & Accessories. ₹250/hr (3-4 players), +₹50 per extra person.',
        games: ['Snooker', 'English Pool', '8-Ball'],
      },
      {
        id: 'station-snooker-03',
        name: 'Snooker Table 3',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 25000,
        capacity: 4,
        specs: 'Full-size Championship Snooker Table, Shadowless LED Canopy, Premium Cues & Accessories. ₹250/hr (3-4 players), +₹50 per extra person.',
        games: ['Snooker', 'English Pool', '8-Ball'],
      },
    ],
  },
];

export async function GET() {
  try {
    const facilities = await prisma.gamingFacility.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        stations: {
          where: {
            status: {
              not: 'DEACTIVATED',
            },
          },
        },
      },
    });

    if (facilities && facilities.length > 0) {
      // Standardize to exactly 3 PS5 stations and 3 Snooker tables as requested
      const standardized = facilities.map((fac) => {
        const isPs5 =
          fac.name.toUpperCase().includes('PS5') ||
          (fac.slug && fac.slug.includes('ps5'));

        if (isPs5) {
          const ps5Stations = fac.stations.slice(0, 3).map((st, idx) => ({
            ...st,
            name: `PS5 Station ${idx + 1}`,
            stationType: 'PS5',
            pricePerHourPaise: 15000,
            capacity: 4,
            specs:
              'Sony PS5, 55" LG OLED 4K 120Hz, DualSense Controllers, SteelSeries 3D Audio. Single ₹150/hr, Duo ₹200/hr, Squad (3-4) ₹250/hr.',
          }));

          return {
            ...fac,
            name: 'PlayStation 5 Arena',
            description:
              '3 PlayStation 5 setups featuring 55-inch 4K 120Hz OLED displays, low-latency HDMI 2.1, Sony DualSense wireless controllers, and competitive gaming headsets. Single player ₹150/hr, 2 players ₹200/hr, 3-4 players ₹250/hr.',
            stations: ps5Stations,
          };
        } else {
          const snookerStations = fac.stations.slice(0, 3).map((st, idx) => ({
            ...st,
            name: `Snooker Table ${idx + 1}`,
            stationType: 'POOL_TABLE',
            pricePerHourPaise: 25000,
            capacity: 4,
            specs:
              'Full-size Championship Snooker Table, Shadowless LED Canopy, Premium Cues & Accessories. ₹250/hr (3-4 players), +₹50 per extra person.',
          }));

          return {
            ...fac,
            name: 'Snooker Lounge',
            description:
              '3 championship snooker tables with premium accessories. ₹250/hr per table for 3-4 players, +₹50 per extra person beyond 4.',
            stations: snookerStations,
          };
        }
      });

      // Synchronize database records in background so they persist
      try {
        for (const fac of standardized) {
          for (const st of fac.stations) {
            await prisma.gamingStation
              .update({
                where: { id: st.id },
                data: {
                  name: st.name,
                  pricePerHourPaise: st.pricePerHourPaise,
                  description: st.specs,
                },
              })
              .catch(() => {});
          }
          await prisma.gamingFacility
            .update({
              where: { id: fac.id },
              data: {
                name: fac.name,
                description: fac.description,
              },
            })
            .catch(() => {});
        }

        // Deactivate excess stations beyond the 3 PS5 and 3 Snooker stations
        const extraStations = await prisma.gamingStation.findMany({
          where: {
            OR: [
              { name: { contains: 'Delta' } },
              { name: { contains: 'Racing' } },
              { name: 'PS5 Station 4' },
              { name: 'PS5 Station 5' },
              { name: 'PS5 Station 6' },
            ],
          },
        });
        for (const extra of extraStations) {
          await prisma.gamingStation
            .update({
              where: { id: extra.id },
              data: { status: 'DEACTIVATED' },
            })
            .catch(() => {});
        }
      } catch {}

      return apiSuccess(standardized, 200, {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      });
    }

    return apiSuccess(DEFAULT_FACILITIES, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    });
  } catch {
    return apiSuccess(DEFAULT_FACILITIES, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    });
  }
}
