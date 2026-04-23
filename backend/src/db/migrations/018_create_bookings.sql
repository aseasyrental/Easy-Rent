CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  renter_name TEXT NOT NULL,
  renter_email TEXT NOT NULL,
  renter_phone TEXT,
  renter_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification', 'confirmed', 'completed', 'no_show', 'cancelled')),
  verification_token UUID,
  verification_expires_at TIMESTAMPTZ,
  cancel_token UUID,
  google_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent double-booking the same property+slot when active
CREATE UNIQUE INDEX idx_bookings_property_slot
  ON bookings (property_id, scheduled_at)
  WHERE status IN ('pending_verification', 'confirmed');

-- For sweeping expired pending bookings
CREATE INDEX idx_bookings_status_verification_expires
  ON bookings (status, verification_expires_at);

-- For admin list filtering by date
CREATE INDEX idx_bookings_scheduled_at
  ON bookings (scheduled_at);

-- For looking up by tokens
CREATE INDEX idx_bookings_verification_token
  ON bookings (verification_token);

CREATE INDEX idx_bookings_cancel_token
  ON bookings (cancel_token);
