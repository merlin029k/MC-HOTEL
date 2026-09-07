const express = require('express');
const { pool } = require('../../config/db');

const router = express.Router();

// GET /api/admin/dashboard — today's arrivals/departures/occupancy.
router.get('/', async (req, res, next) => {
  try {
    const [arrivals, departures, occupancy] = await Promise.all([
      pool.query(
        `SELECT b.id, b.reference_code, b.check_in, b.check_out, b.status,
                g.full_name AS guest_name, rt.name AS room_type_name, ru.label AS room_label
         FROM bookings b
         JOIN room_units ru ON ru.id = b.room_unit_id
         JOIN room_types rt ON rt.id = ru.room_type_id
         JOIN guests g ON g.id = b.guest_id
         WHERE b.check_in = CURRENT_DATE AND b.status <> 'cancelled'
         ORDER BY rt.name, ru.label`
      ),
      pool.query(
        `SELECT b.id, b.reference_code, b.check_in, b.check_out, b.status,
                g.full_name AS guest_name, rt.name AS room_type_name, ru.label AS room_label
         FROM bookings b
         JOIN room_units ru ON ru.id = b.room_unit_id
         JOIN room_types rt ON rt.id = ru.room_type_id
         JOIN guests g ON g.id = b.guest_id
         WHERE b.check_out = CURRENT_DATE AND b.status <> 'cancelled'
         ORDER BY rt.name, ru.label`
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM room_units WHERE status = 'active') AS total_active_units,
           (SELECT COUNT(*) FROM bookings
             WHERE status IN ('confirmed', 'checked_in')
               AND CURRENT_DATE >= check_in AND CURRENT_DATE < check_out) AS occupied_units`
      ),
    ]);

    res.json({
      arrivals: arrivals.rows,
      departures: departures.rows,
      occupancy: occupancy.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
