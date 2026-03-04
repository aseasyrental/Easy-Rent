-- Replace 'pending' with 'maintenance' in the status CHECK constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check CHECK (status IN ('available', 'occupied', 'maintenance'));

-- Update any existing rows that use 'pending' to 'maintenance'
UPDATE properties SET status = 'maintenance' WHERE status = 'pending';
