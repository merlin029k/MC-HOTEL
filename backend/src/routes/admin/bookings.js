const express = require('express');
const { pool } = require('../../config/db');
const { generateReferenceCode } = require('../../utils/referenceCode');
const { generateCancelToken } = require('../../utils/cancelToken');

const router = express.Router();

const MS_PER_DAY = 1000 * 60 * 60 * 24;
function countNights(checkIn, checkOut) {
  return Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY);
}

// GET /api/admin/bookings — list/filter/search.
// Query params: status, q (matches reference_code / guest name / guest email), limit, offset.
router.get('/', async (req, res, next) => {
  const { status, q, limit = 50, offset = 0 } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`b.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(b.reference_code ILIKE $${params.length} OR g.full_name ILIKE $${params.length} OR g.email ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), Number(offset));

  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.reference_code, b.check_in, b.check_out, b.guests_count, b.status,
              b.total_price, b.payment_status, b.source, b.created_at,
              rt.name AS room_type_name, ru.label AS room_label,
              g.full_name AS guest_name, g.email AS guest_email
       FROM bookings b
       JOIN room_units ru ON ru.id = b.room_unit_id
       JOIN room_types rt ON rt.id = ru.room_type_id
       JOIN guests g ON g.id = b.guest_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/bookings — manual booking creation (front desk / phone bookings).
// Accepts either an explicit room_unit_id (staff picked a specific physical room)
// or a room_type_id (server picks the first free unit), same overlap guard as
// the public flow. source is always 'manual'.
router.post('/', async (req, res, next) => {
  const { room_unit_id, room_type_id, check_in, check_out, guests_count, guest, payment_status } = req.body;

  if ((!room_unit_id && !room_type_id) || !check_in || !check_out || !guests_count || !guest) {
    return res.status(400).json({
      error: 'room_unit_id or room_type_id, plus check_in, check_out, guests_count and guest are required.',
    });
  }
  if (!guest.full_name || !guest.email) {
    return res.status(400).json({ error: 'guest.full_name and guest.email are required.' });
  }
  const nights = countNights(check_in, check_out);
  if (nights <= 0) {
    return res.status(400).json({ error: 'check_out must be after check_in.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let roomUnitId = room_unit_id;
    let basePrice;

    if (roomUnitId) {
      const unitRes = await client.query(
        `SELECT rt.base_price FROM room_units ru
         JOIN room_types rt ON rt.id = ru.room_type_id
         WHERE ru.id = $1
         FOR UPDATE OF ru`,
        [roomUnitId]
      );
      if (unitRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Room unit not found.' });
      }
      basePrice = unitRes.rows[0].base_price;
    } else {
      const roomTypeRes = await client.query(
        `SELECT base_price FROM room_types WHERE id = $1`,
        [room_type_id]
      );
      if (roomTypeRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Room type not found.' });
      }
      basePrice = roomTypeRes.rows[0].base_price;

      const freeUnitRes = await client.query(
        `SELECT id FROM room_units
         WHERE room_type_id = $1
           AND status = 'active'
           AND (out_of_service_until IS NULL OR out_of_service_until < $2::date)
           AND NOT EXISTS (
             SELECT 1 FROM bookings b
             WHERE b.room_unit_id = room_units.id
               AND b.status <> 'cancelled'
               AND daterange(b.check_in, b.check_out, '[)') && daterange($2::date, $3::date, '[)')
           )
         ORDER BY id
         LIMIT 1
         FOR UPDATE`,
        [room_type_id, check_in, check_out]
      );
      if (freeUnitRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'No rooms of this type are available for the selected dates.' });
      }
      roomUnitId = freeUnitRes.rows[0].id;
    }

    const guestRes = await client.query(
      `INSERT INTO guests (full_name, email, phone) VALUES ($1, $2, $3) RETURNING id`,
      [guest.full_name, guest.email, guest.phone || null]
    );
    const guestId = guestRes.rows[0].id;

    const totalPrice = Number(basePrice) * nights;
    const referenceCode = generateReferenceCode();
    const cancelToken = generateCancelToken();

    let bookingRes;
    try {
      bookingRes = await client.query(
        `INSERT INTO bookings
           (reference_code, room_unit_id, guest_id, check_in, check_out, guests_count,
            status, total_price, payment_status, source, cancel_token)
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, 'manual', $9)
         RETURNING *`,
        [referenceCode, roomUnitId, guestId, check_in, check_out, guests_count, totalPrice,
          payment_status || 'pending', cancelToken]
      );
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23P01') {
        return res.status(409).json({ error: 'That room is already booked for an overlapping date range.' });
      }
      throw err;
    }

    await client.query('COMMIT');
    res.status(201).json(bookingRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// PATCH /api/admin/bookings/:id — update status, dates, or payment_status.
router.patch('/:id', async (req, res, next) => {
  const { status, check_in, check_out, payment_status } = req.body;
  const fields = [];
  const params = [];

  if (status) {
    params.push(status);
    fields.push(`status = $${params.length}`);
  }
  if (check_in) {
    params.push(check_in);
    fields.push(`check_in = $${params.length}`);
  }
  if (check_out) {
    params.push(check_out);
    fields.push(`check_out = $${params.length}`);
  }
  if (payment_status) {
    params.push(payment_status);
    fields.push(`payment_status = $${params.length}`);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }

  params.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23P01') {
      return res.status(409).json({ error: 'These dates overlap with another booking for this room.' });
    }
    next(err);
  }
});

module.exports = router;
