CREATE TABLE IF NOT EXISTS document_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('lease', 'agreement', 'form', 'inspection', 'notice')),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
