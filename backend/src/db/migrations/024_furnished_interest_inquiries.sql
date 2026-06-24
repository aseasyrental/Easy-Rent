-- Furnished-interest leads come in without a specific property: a renter asks
-- to be notified when a furnished stay opens up. Let an inquiry exist with no
-- property_id, and accept a new `furnished_interest` type alongside the
-- existing `question` / `viewing_request` types.
--
-- property_id and name become nullable so an email-only furnished-interest
-- lead can persist. Existing question / viewing_request inquiries keep
-- property_id + name required at the API layer
-- (backend/src/routes/inquiryRoutes.js); the columns simply stop forcing it.
-- email stays NOT NULL.
--
-- Constraint name confirmed from prod via pg_constraint: inquiries_type_check.

BEGIN;

ALTER TABLE inquiries ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE inquiries ALTER COLUMN name DROP NOT NULL;
ALTER TABLE inquiries DROP CONSTRAINT inquiries_type_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_type_check
  CHECK (type IN ('question', 'viewing_request', 'furnished_interest'));

COMMIT;
