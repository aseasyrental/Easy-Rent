ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_disconnect_notified_at TIMESTAMPTZ;
