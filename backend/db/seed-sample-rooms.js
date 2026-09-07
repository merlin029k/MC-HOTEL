// Seeds/updates a few sample room types + room units for local dev so the
// guest search page has something to show, including placeholder photos.
// Idempotent: upserts by room type name, safe to re-run.
require('dotenv').config();
const { Pool } = require('pg');

const ROOM_TYPES = [
  {
    name: 'Standard Room',
    description: 'Comfortable room with queen bed, en-suite bathroom, and free Wi-Fi.',
    base_price: 25000,
    max_guests: 2,
    units: ['101', '102', '103'],
    photos: ['/images/rooms/standard-1.jpg', '/images/rooms/standard-2.jpg', '/images/rooms/standard-3.jpg'],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Flat-screen TV', 'En-suite bathroom'],
  },
  {
    name: 'Deluxe Room',
    description: 'Spacious room with king bed, sitting area, and city view.',
    base_price: 40000,
    max_guests: 3,
    units: ['201', '202'],
    photos: ['/images/rooms/deluxe-1.jpg', '/images/rooms/deluxe-2.jpg', '/images/rooms/deluxe-3.jpg'],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'King bed', 'City view'],
  },
  {
    name: 'Executive Suite',
    description: 'Suite with separate living room, minibar, and premium amenities.',
    base_price: 65000,
    max_guests: 4,
    units: ['301', '302'],
    photos: ['/images/rooms/suite-1.jpg', '/images/rooms/suite-2.jpg'],
    amenities: ['Free Wi-Fi', 'Separate living room', 'Minibar', 'Premium bathroom'],
  },
];

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    for (const rt of ROOM_TYPES) {
      const { rows: existing } = await pool.query(
        `SELECT id FROM room_types WHERE name = $1`,
        [rt.name]
      );

      let roomTypeId;
      if (existing.length > 0) {
        roomTypeId = existing[0].id;
        await pool.query(
          `UPDATE room_types SET description = $2, base_price = $3, max_guests = $4, photos = $5, amenities = $6
           WHERE id = $1`,
          [roomTypeId, rt.description, rt.base_price, rt.max_guests, JSON.stringify(rt.photos), JSON.stringify(rt.amenities)]
        );
        console.log(`Updated "${rt.name}" (photos set to ${rt.photos.length}).`);
      } else {
        const { rows: inserted } = await pool.query(
          `INSERT INTO room_types (name, description, base_price, max_guests, photos, amenities)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [rt.name, rt.description, rt.base_price, rt.max_guests, JSON.stringify(rt.photos), JSON.stringify(rt.amenities)]
        );
        roomTypeId = inserted[0].id;

        for (const label of rt.units) {
          await pool.query(
            `INSERT INTO room_units (room_type_id, label) VALUES ($1, $2)`,
            [roomTypeId, label]
          );
        }
        console.log(`Seeded "${rt.name}" with ${rt.units.length} unit(s) and ${rt.photos.length} photo(s).`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to seed sample rooms:', err.message);
  process.exit(1);
});
