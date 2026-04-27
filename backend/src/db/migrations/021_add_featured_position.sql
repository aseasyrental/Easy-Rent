-- Featured Three: Bill picks up to three properties to surface on the public Landing.
-- NULL = not featured. 1, 2, 3 = slot. Partial UNIQUE index enforces "no two properties at the same slot."

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS featured_position SMALLINT
    CHECK (featured_position IS NULL OR featured_position BETWEEN 1 AND 3);

CREATE UNIQUE INDEX IF NOT EXISTS properties_featured_position_unique
  ON properties (featured_position)
  WHERE featured_position IS NOT NULL;

CREATE INDEX IF NOT EXISTS properties_featured_position_idx
  ON properties (featured_position)
  WHERE featured_position IS NOT NULL;
