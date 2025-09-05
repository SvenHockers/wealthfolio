-- Add enabled flag to platforms and seed known broker platforms

ALTER TABLE platforms ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT false;

-- Seed common broker platforms if they don't already exist
INSERT OR IGNORE INTO platforms (id, name, url, enabled) VALUES
  ('TRADING212', 'Trading 212', 'https://www.trading212.com', false),
  ('COINBASE', 'Coinbase', 'https://www.coinbase.com', false),
  ('BITVAVO', 'Bitvavo', 'https://bitvavo.com', false);


