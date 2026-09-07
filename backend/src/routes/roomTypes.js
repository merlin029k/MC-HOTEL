const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET /api/room-types — list active room types
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, base_price, max_guests, photos, amenities
       FROM room_types
       WHERE active = TRUE
       ORDER BY base_price ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
