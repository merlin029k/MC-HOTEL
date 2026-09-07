const express = require('express');
const { pool } = require('../../config/db');

const router = express.Router();

// POST /api/admin/room-units — add a room unit to a type.
router.post('/', async (req, res, next) => {
  const { room_type_id, label } = req.body;
  if (!room_type_id || !label) {
    return res.status(400).json({ error: 'room_type_id and label are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO room_units (room_type_id, label, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [room_type_id, label]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/room-units/:id — edit / mark out of service.
router.patch('/:id', async (req, res, next) => {
  const { label, status, out_of_service_reason, out_of_service_until } = req.body;
  const fields = [];
  const params = [];

  const set = (column, value) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (label !== undefined) set('label', label);
  if (status !== undefined) set('status', status);
  if (out_of_service_reason !== undefined) set('out_of_service_reason', out_of_service_reason);
  if (out_of_service_until !== undefined) set('out_of_service_until', out_of_service_until);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }

  params.push(req.params.id);

  try {
    const { rows } = await pool.query(
      `UPDATE room_units SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room unit not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
