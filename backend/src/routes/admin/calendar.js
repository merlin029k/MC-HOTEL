const express = require('express');
const { pool } = require('../../config/db');

const router = express.Router();

// GET /api/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns the raw data needed to render a room x date availability grid:
// all room units, plus any bookings / out-of-service periods overlapping the range.
router.get('/', async (req, res, next) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to are required.' });
  }

  try {
    const [units, bookings] = await Promise.all([
      pool.query(
        `SELECT ru.id, ru.label, ru.status, ru.out_of_service_reason, ru.out_of_service_until,
                rt.id AS room_type_id, rt.name AS room_type_name
         FROM room_units ru
         JOIN room_types rt ON rt.id = ru.room_type_id
         ORDER BY rt.name, ru.label`
      ),
      pool.query(
        `SELECT b.room_unit_id, b.reference_code, b.check_in, b.check_out, b.status,
                g.full_name AS guest_name
         FROM bookings b
         JOIN guests g ON g.id = b.guest_id
         WHERE b.status <> 'cancelled'
           AND daterange(b.check_in, b.check_out, '[)') && daterange($1::date, $2::date, '[)')`,
        [from, to]
      ),
    ]);

    res.json({ rooms: units.rows, bookings: bookings.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
