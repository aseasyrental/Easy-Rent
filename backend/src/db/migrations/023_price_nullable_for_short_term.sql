-- Short-term furnished listings have no long-term monthly rent; they use the
-- price_daily / price_weekly / price_monthly columns added in migration 022.
-- Drop the NOT NULL on `price` so short-term rows can be created without it.
-- Long-term listings still require a positive `price` via the API create
-- validation in backend/src/routes/propertyRoutes.js.

BEGIN;

ALTER TABLE properties
  ALTER COLUMN price DROP NOT NULL;

COMMIT;
