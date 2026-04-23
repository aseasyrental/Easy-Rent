CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  working_hours_start TIME NOT NULL DEFAULT '09:00',
  working_hours_end TIME NOT NULL DEFAULT '19:00',
  bill_contact_phone TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO app_settings (id, working_hours_start, working_hours_end)
VALUES (1, '09:00', '19:00')
ON CONFLICT (id) DO NOTHING;
