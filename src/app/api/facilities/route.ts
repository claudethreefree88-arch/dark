import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/errors';

// Fallback seed data in case database is in setup mode
const DEFAULT_FACILITIES = [
  {
    id: 'fac-ps5',
    name: 'PlayStation 5 Pro Arena',
    description:
      'Ultra high-performance PlayStation 5 setups featuring 55-inch 4K 120Hz OLED displays, low-latency HDMI 2.1, Sony DualSense wireless controllers, and competitive gaming headsets.',
    displayOrder: 1,
    isActive: true,
    stations: [
      {
        id: 'station-ps5-01',
        name: 'PS5 Battle Station Alpha',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 20000, // ₹200 / hr
        capacity: 2,
        specs: 'Sony PS5 Pro, 55" LG OLED 4K 120Hz, 2x DualSense Edge, SteelSeries Arctis Nova 7P',
        games: ['EA FC 24', 'Tekken 8', 'Spider-Man 2', 'Call of Duty: Modern Warfare III', 'Mortal Kombat 1'],
      },
      {
        id: 'station-ps5-02',
        name: 'PS5 Battle Station Bravo',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 20000,
        capacity: 2,
        specs: 'Sony PS5 Pro, 55" LG OLED 4K 120Hz, 2x DualSense, Sony Pulse 3D Audio',
        games: ['God of War Ragnarok', 'Gran Turismo 7', 'NBA 2K24', 'WWE 2K24', 'It Takes Two'],
      },
      {
        id: 'station-ps5-03',
        name: 'PS5 Squad Arena Charlie',
        stationType: 'PS5',
        status: 'OCCUPIED',
        pricePerHourPaise: 25000, // ₹250 / hr (4-player)
        capacity: 4,
        specs: 'Sony PS5 Pro, 65" Sony Bravia XR OLED, 4x DualSense Wireless, Soundbar with Dolby Atmos',
        games: ['EA FC 24', 'Tekken 8', 'Overcooked! All You Can Eat', 'Rocket League', 'WWE 2K24'],
      },
      {
        id: 'station-ps5-04',
        name: 'PS5 Racing Rig Delta',
        stationType: 'PS5',
        status: 'AVAILABLE',
        pricePerHourPaise: 30000, // ₹300 / hr
        capacity: 1,
        specs: 'Sony PS5, Logitech G29 Force Feedback Steering Wheel & Pedals, Next Level Racing Cockpit, 55" OLED',
        games: ['Gran Turismo 7', 'F1 23', 'WRC Generations', 'The Crew Motorfest'],
      },
    ],
  },
  {
    id: 'fac-pool',
    name: 'Billiards & Pool Lounge',
    description:
      'Championship tournament-standard 8ft slate pool tables, Simonis tournament cloth, premium Belgian Aramith balls, handcrafted ash cues, and dedicated acoustic ambient lighting.',
    displayOrder: 2,
    isActive: true,
    stations: [
      {
        id: 'station-pool-01',
        name: 'Championship Pool Table 1',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 25000, // ₹250 / hr
        capacity: 4,
        specs: '8ft Italian Slate, Simonis 860 Tournament Cloth, Aramith Super Pro Balls, Shadowless LED Canopy',
        games: ['8-Ball', '9-Ball', 'Straight Pool', 'Killer'],
      },
      {
        id: 'station-pool-02',
        name: 'Executive Pool Table 2',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 25000,
        capacity: 4,
        specs: '8ft Italian Slate, Simonis 860 Tournament Cloth, Aramith Balls, Leather Drop Pockets',
        games: ['8-Ball', '9-Ball', 'Cutthroat'],
      },
      {
        id: 'station-pool-03',
        name: 'VIP Private Pool Table 3',
        stationType: 'POOL_TABLE',
        status: 'AVAILABLE',
        pricePerHourPaise: 35000, // ₹350 / hr
        capacity: 6,
        specs: '9ft Tournament Slate, Private VIP Lounge Enclosure, Premium Cues, Dedicated Refreshment Service',
        games: ['8-Ball', '9-Ball', 'Snooker Variations'],
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

    const cacheHeader = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' };

    if (facilities.length > 0) {
      return apiSuccess(facilities, 200, cacheHeader);
    }

    return apiSuccess(DEFAULT_FACILITIES, 200, cacheHeader);
  } catch (err) {
    // If DB is offline or not migrated yet, return high quality fallback
    return apiSuccess(DEFAULT_FACILITIES, 200, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' });
  }
}
