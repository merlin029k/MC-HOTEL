-- MC Hotel Reservation System — PostgreSQL schema
-- Matches Technical Spec section 4 (Data Model)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- required for the EXCLUDE constraint below

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE room_unit_status AS ENUM ('active', 'out_of_service');
CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE booking_source AS ENUM ('online', 'manual');
CREATE TYPE payment_txn_status AS ENUM ('pending', 'success', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- 4.1 room_types
-- ---------------------------------------------------------------------------

CREATE TABLE room_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    description TEXT,
    base_price  DECIMAL(12, 2) NOT NULL,   -- nightly rate, XAF
    max_guests  INT NOT NULL,
    photos      JSONB DEFAULT '[]'::jsonb, -- array of image URLs
    amenities   JSONB DEFAULT '[]'::jsonb, -- array of amenity label strings
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 4.2 room_units
-- ---------------------------------------------------------------------------

CREATE TABLE room_units (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id           UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    label                  VARCHAR(60) NOT NULL,
    status                 room_unit_status NOT NULL DEFAULT 'active',
    out_of_service_reason  VARCHAR(255),
    out_of_service_until   DATE
);

CREATE INDEX idx_room_units_room_type_id ON room_units(room_type_id);

-- ---------------------------------------------------------------------------
-- 4.3 guests
-- ---------------------------------------------------------------------------

CREATE TABLE guests (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(160) NOT NULL,
    email     VARCHAR(255) NOT NULL,
    phone     VARCHAR(40)
);

CREATE INDEX idx_guests_email ON guests(email);

-- ---------------------------------------------------------------------------
-- 4.4 bookings
-- ---------------------------------------------------------------------------

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code  VARCHAR(30) NOT NULL UNIQUE,   -- e.g. MC-20260914-0007
    room_unit_id    UUID NOT NULL REFERENCES room_units(id) ON DELETE RESTRICT,
    guest_id        UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    check_in        DATE NOT NULL,
    check_out       DATE NOT NULL,
    guests_count    INT NOT NULL,
    status          booking_status NOT NULL DEFAULT 'confirmed',
    total_price     DECIMAL(12, 2) NOT NULL,
    payment_status  payment_status NOT NULL DEFAULT 'pending',
    source          booking_source NOT NULL DEFAULT 'online',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancel_token    VARCHAR(64) NOT NULL UNIQUE,

    CONSTRAINT chk_dates CHECK (check_out > check_in),

    -- Double-booking prevention at the DB level: no two non-cancelled bookings
    -- for the same room_unit may have overlapping [check_in, check_out) ranges.
    CONSTRAINT excl_room_unit_daterange EXCLUDE USING gist (
        room_unit_id WITH =,
        daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status <> 'cancelled')
);

CREATE INDEX idx_bookings_room_unit_id ON bookings(room_unit_id);
CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_check_in_out ON bookings(check_in, check_out);

-- ---------------------------------------------------------------------------
-- 4.5 payments
-- ---------------------------------------------------------------------------

CREATE TABLE payments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    gateway      VARCHAR(60) NOT NULL,   -- e.g. "flutterwave"
    gateway_ref  VARCHAR(120),           -- transaction ID from gateway
    amount       DECIMAL(12, 2) NOT NULL,
    status       payment_txn_status NOT NULL DEFAULT 'pending',
    raw_payload  JSONB,                  -- stored webhook payload for audit/debugging
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE UNIQUE INDEX uq_payments_gateway_ref ON payments(gateway, gateway_ref) WHERE gateway_ref IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4.6 admin_users
-- ---------------------------------------------------------------------------

CREATE TABLE admin_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(160) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,   -- bcrypt/argon2
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
