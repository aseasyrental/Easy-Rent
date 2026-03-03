ALTER TABLE property_media ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE INDEX idx_property_media_primary ON property_media(property_id) WHERE is_primary = true;
