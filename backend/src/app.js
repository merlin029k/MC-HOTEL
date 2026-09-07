const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { requireAdmin } = require('./middleware/requireAdmin');
const { errorHandler } = require('./middleware/errorHandler');

const roomTypesRouter = require('./routes/roomTypes');
const availabilityRouter = require('./routes/availability');
const bookingsRouter = require('./routes/bookings');
const paymentsRouter = require('./routes/payments');

const adminAuthRouter = require('./routes/admin/auth');
const adminDashboardRouter = require('./routes/admin/dashboard');
const adminBookingsRouter = require('./routes/admin/bookings');
const adminRoomTypesRouter = require('./routes/admin/roomTypes');
const adminRoomUnitsRouter = require('./routes/admin/roomUnits');
const adminCalendarRouter = require('./routes/admin/calendar');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Public
app.use('/api/room-types', roomTypesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);

// Admin
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/dashboard', requireAdmin, adminDashboardRouter);
app.use('/api/admin/bookings', requireAdmin, adminBookingsRouter);
app.use('/api/admin/room-types', requireAdmin, adminRoomTypesRouter);
app.use('/api/admin/room-units', requireAdmin, adminRoomUnitsRouter);
app.use('/api/admin/calendar', requireAdmin, adminCalendarRouter);

app.use(errorHandler);

module.exports = app;
