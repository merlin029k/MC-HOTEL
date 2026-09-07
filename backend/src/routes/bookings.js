const express = require('express');
const { pool } = require('../config/db');
const { generateReferenceCode } = require('../utils/referenceCode');
const { generateCancelToken } = require('../utils/cancelToken');

const router = express.Router();

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function countNights(checkIn, checkOut) {
  return Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY);
}

// POST /api/bookings — create a booking (online, pre-payment).
//
// Availability is checked twice:
//  1. Here, with a `FOR UPDATE` pick of a free room_unit, so the common case
//     fails fast with a clear 409 instead of hitting the DB constraint.
//  2. By the `excl_room_unit_daterange` EXCLUDE constraint on `bookings`
//     (see db/schema.sql), which is the actual source of truth under
//     concurrency — two requests racing for the same room/dates cannot both
//     succeed, no matter what the pre-check above saw.
router.post('/', async (req, res, next) => {
  const { room_type_id, check_in, check_out, guests_count, guest } = req.body;

  if (!room_type_id || !check_in || !check_out || !guests_count || !guest) {
    return res.status(400).json({
      error: 'room_type_id, check_in, check_out, guests_count and guest are required.',
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

    const roomTypeRes = await client.query(
      `SELECT base_price, max_guests FROM room_types WHERE id = $1 AND active = TRUE`,
      [room_type_id]
    );
    if (roomTypeRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Room type not found or inactive.' });
    }
    const roomType = roomTypeRes.rows[0];
    if (guests_count > roomType.max_guests) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `This room type sleeps at most ${roomType.max_guests} guests.` });
    }

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
    const roomUnitId = freeUnitRes.rows[0].id;

    const guestRes = await client.query(
      `INSERT INTO guests (full_name, email, phone) VALUES ($1, $2, $3) RETURNING id`,
      [guest.full_name, guest.email, guest.phone || null]
    );
    const guestId = guestRes.rows[0].id;

    const totalPrice = Number(roomType.base_price) * nights;
    const referenceCode = generateReferenceCode();
    const cancelToken = generateCancelToken();

    let bookingRes;
    try {
      bookingRes = await client.query(
        `INSERT INTO bookings
           (reference_code, room_unit_id, guest_id, check_in, check_out, guests_count,
            status, total_price, payment_status, source, cancel_token)
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, 'pending', 'online', $8)
         RETURNING id, reference_code, check_in, check_out, guests_count, status,
                   total_price, payment_status, cancel_token, created_at`,
        [referenceCode, roomUnitId, guestId, check_in, check_out, guests_count, totalPrice, cancelToken]
      );
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23P01') {
        // exclusion_violation — lost the race for this room/date range.
        return res.status(409).json({ error: 'No rooms of this type are available for the selected dates.' });
      }
      throw err;
    }

    await client.query('COMMIT');
    return res.status(201).json(bookingRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/bookings/:cancel_token — guest views their own booking.
router.get('/:cancel_token', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.reference_code, b.check_in, b.check_out, b.guests_count, b.status,
              b.total_price, b.payment_status, b.created_at,
              rt.name AS room_type_name, ru.label AS room_label,
              g.full_name AS guest_name, g.email AS guest_email
       FROM bookings b
       JOIN room_units ru ON ru.id = b.room_unit_id
       JOIN room_types rt ON rt.id = ru.room_type_id
       JOIN guests g ON g.id = b.guest_id
       WHERE b.cancel_token = $1`,
      [req.params.cancel_token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings/:cancel_token/cancel — guest cancels their own booking.
router.post('/:cancel_token/cancel', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE cancel_token = $1
         AND status IN ('confirmed')
       RETURNING reference_code, status`,
      [req.params.cancel_token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or no longer cancellable.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
