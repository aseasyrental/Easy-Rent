-- Add property_type column
ALTER TABLE properties
  ADD COLUMN property_type VARCHAR(50)
  CHECK (property_type IN ('apartment', 'house', 'townhouse', 'condo', 'duplex', 'basement_suite', 'laneway_house'));

CREATE INDEX idx_properties_property_type ON properties(property_type);

-- Fix status CHECK: replace 'pending' with 'maintenance'
ALTER TABLE properties DROP CONSTRAINT properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('available', 'occupied', 'maintenance'));
