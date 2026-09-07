const express = require('express');
const { pool } = require('../../config/db');

const router = express.Router();

// GET /api/admin/room-types — manage room types (includes inactive).
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, base_price, max_guests, photos, amenities, active
       FROM room_types ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/room-types — create room type.
router.post('/', async (req, res, next) => {
  const { name, description, base_price, max_guests, photos, amenities, active } = req.body;
  if (!name || base_price == null || !max_guests) {
    return res.status(400).json({ error: 'name, base_price and max_guests are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO room_types (name, description, base_price, max_guests, photos, amenities, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || null, base_price, max_guests, JSON.stringify(photos || []), JSON.stringify(amenities || []), active ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/room-types/:id — edit room type.
router.patch('/:id', async (req, res, next) => {
  const { name, description, base_price, max_guests, photos, amenities, active } = req.body;
  const fields = [];
  const params = [];

  const set = (column, value) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (name !== undefined) set('name', name);
  if (description !== undefined) set('description', description);
  if (base_price !== undefined) set('base_price', base_price);
  if (max_guests !== undefined) set('max_guests', max_guests);
  if (photos !== undefined) set('photos', JSON.stringify(photos));
  if (amenities !== undefined) set('amenities', JSON.stringify(amenities));
  if (active !== undefined) set('active', active);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }

  params.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE room_types SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room type not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
