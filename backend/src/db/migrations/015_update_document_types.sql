-- Expand document type CHECK to include inspection and notice
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('form', 'agreement', 'lease', 'inspection', 'notice'));
