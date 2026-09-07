const express = require('express');
const crypto = require('crypto');
const { pool } = require('../config/db');

const router = express.Router();

// Verifies the gateway signature header against the raw request body.
// Adjust the header name / algorithm to match whichever gateway is chosen
// (spec references Flutterwave as the example gateway).
function isValidSignature(req) {
  const signature = req.headers['verif-hash'] || req.headers['x-signature'];
  if (!signature || !process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET)
  );
}

// POST /api/payments/webhook — receives payment gateway confirmation.
// NOTE: this route must be mounted with the raw body parser (see app.js)
// if the chosen gateway signs the raw request body rather than a static secret.
router.post('/webhook', async (req, res, next) => {
  try {
    if (!isValidSignature(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const { booking_reference, gateway, gateway_ref, amount, status } = req.body;
    if (!booking_reference || !gateway || !status) {
      return res.status(400).json({ error: 'booking_reference, gateway and status are required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bookingRes = await client.query(
        `SELECT id FROM bookings WHERE reference_code = $1 FOR UPDATE`,
        [booking_reference]
      );
      if (bookingRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found.' });
      }
      const bookingId = bookingRes.rows[0].id;

      await client.query(
        `INSERT INTO payments (booking_id, gateway, gateway_ref, amount, status, raw_payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bookingId, gateway, gateway_ref || null, amount, status, JSON.stringify(req.body)]
      );

      if (status === 'success') {
        await client.query(`UPDATE bookings SET payment_status = 'paid' WHERE id = $1`, [bookingId]);
      } else if (status === 'failed') {
        await client.query(`UPDATE bookings SET payment_status = 'failed' WHERE id = $1`, [bookingId]);
      }

      await client.query('COMMIT');
      res.status(200).json({ received: true });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
