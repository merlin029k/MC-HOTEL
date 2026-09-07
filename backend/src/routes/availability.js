const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET /api/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&guests=2
// Returns active room types that have at least one room_unit free for the whole range.
router.get('/', async (req, res, next) => {
  const { check_in, check_out, guests } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'check_in and check_out are required.' });
  }
  if (new Date(check_out) <= new Date(check_in)) {
    return res.status(400).json({ error: 'check_out must be after check_in.' });
  }

  const guestsCount = guests ? parseInt(guests, 10) : 1;

  try {
    const { rows } = await pool.query(
      `SELECT rt.id, rt.name, rt.description, rt.base_price, rt.max_guests, rt.photos, rt.amenities
       FROM room_types rt
       WHERE rt.active = TRUE
         AND rt.max_guests >= $3
         AND EXISTS (
           SELECT 1 FROM room_units ru
           WHERE ru.room_type_id = rt.id
             AND ru.status = 'active'
             AND (ru.out_of_service_until IS NULL OR ru.out_of_service_until < $1::date)
             AND NOT EXISTS (
               SELECT 1 FROM bookings b
               WHERE b.room_unit_id = ru.id
                 AND b.status <> 'cancelled'
                 AND daterange(b.check_in, b.check_out, '[)') && daterange($1::date, $2::date, '[)')
             )
         )
       ORDER BY rt.base_price ASC`,
      [check_in, check_out, guestsCount]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
