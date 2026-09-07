# MC Hotel Reservation System

Scaffold generated from the technical spec (data model + REST API sections).

## Structure

```
backend/    Express + PostgreSQL API
  db/schema.sql       full schema (6 tables, enums, double-booking EXCLUDE constraint)
  db/run-schema.js     applies schema.sql to DATABASE_URL
  db/seed-admin.js     creates/updates one admin_users row for login
  src/routes/          public routes: room-types, availability, bookings, payments
  src/routes/admin/    admin routes: auth, dashboard, bookings, room-types, room-units, calendar

frontend/   Next.js app (guest site + admin panel)
  app/page.js                     guest search (step 1 of booking flow)
  app/booking/[roomTypeId]/       room summary + guest details -> creates the booking
  app/booking/confirmation/       reference code + link to manage the booking
  app/my-booking/[cancelToken]/   guest self-service view/cancel
  app/admin/login/                admin login
  app/admin/dashboard/            today's arrivals/departures/occupancy
  app/admin/bookings/             search/filter, manual booking creation, status/payment updates
  app/admin/calendar/             room x date availability grid
  app/admin/room-types/           room type + room unit management
```

## Getting started

Backend:

```
cd backend
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, etc.
npm run db:setup       # applies db/schema.sql
node db/seed-admin.js "Jane Doe" jane@example.com "some-password"
npm run dev
```

Frontend:

```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Notes / open decisions carried over from the spec

- **Double-booking prevention** is enforced at the database level via a Postgres
  `EXCLUDE` constraint (`btree_gist`) on `bookings(room_unit_id, daterange(check_in, check_out))`
  for non-cancelled rows — see `backend/db/schema.sql`. The booking routes also
  do an availability pre-check inside the same transaction so the common case
  returns a clean 409 instead of a raw constraint violation; the constraint is
  what actually guarantees correctness under concurrency.
- **Payment flow**: bookings are currently created as `confirmed` /
  `payment_status: pending` at POST /api/bookings time (a "hold" model), and
  `payment_status` flips to `paid`/`failed` when `/api/payments/webhook` fires.
  Swap this if the spec's chosen flow is post-payment confirmation instead.
- **Payment webhook signature verification** (`backend/src/routes/payments.js`)
  is stubbed against a static secret header — replace with the real gateway's
  signing scheme (e.g. Flutterwave's `verif-hash`) before going live.
- **Room unit listing**: the spec's API list has no `GET /api/admin/room-units`
  endpoint, only `POST` (create) and `PATCH` (edit / out-of-service). The
  `admin/room-types` screen works around this by reusing
  `GET /api/admin/calendar` (over a 1-day window) to get the full unit list
  with status, since that endpoint already returns every room unit. Add a
  dedicated list endpoint if this reuse feels too indirect once real usage
  starts.
