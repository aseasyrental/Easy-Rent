-- Short-term furnished rentals: add listing_type, is_furnished, and rate columns.
-- Additive + idempotent. Existing rows default to long_term / unfurnished automatically.
-- The existing `price` column is UNTOUCHED — it remains long-term monthly rent.

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NOT NULL DEFAULT 'long_term'
    CHECK (listing_type IN ('long_term', 'short_term'));

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_daily DECIMAL(10,2);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_weekly DECIMAL(10,2);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2);

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER;

CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);

COMMIT;
