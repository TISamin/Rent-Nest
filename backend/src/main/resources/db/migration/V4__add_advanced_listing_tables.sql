-- Price range on base listing (add columns)
ALTER TABLE listings RENAME COLUMN price TO price_min;
ALTER TABLE listings ADD COLUMN price_max NUMERIC(12, 2);

-- Per-category residential detail (FLAT, HOUSE, HOTEL)
CREATE TABLE residential_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  bedroom_count INTEGER NOT NULL DEFAULT 0,
  bathroom_count INTEGER NOT NULL DEFAULT 0,
  other_rooms_count INTEGER NOT NULL DEFAULT 0
);

-- Per-room detail with images
CREATE TABLE room_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  room_type VARCHAR(50) NOT NULL, -- 'BEDROOM', 'BATHROOM', 'KITCHEN', 'LIVING_ROOM', 'OTHER'
  description TEXT,
  image_urls TEXT -- Store as comma separated string
);

-- Convention hall detail
CREATE TABLE convention_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  capacity INTEGER,
  hall_count INTEGER DEFAULT 1
);

-- Amenities (shared across all listing types)
CREATE TABLE listing_amenity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  amenity_name VARCHAR(100) NOT NULL
);

-- Service offerings with individual pricing (for SHIFTING, CATERING, maintenance)
CREATE TABLE service_offering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  offering_name VARCHAR(100) NOT NULL, -- e.g. 'Plumbing', 'Electrical Wiring', 'Catering 50 pax'
  price_min NUMERIC(12, 2),
  price_max NUMERIC(12, 2),
  description TEXT
);

-- Update roommate profile to include budget range
ALTER TABLE roommate_listings ADD COLUMN budget_min INTEGER;
ALTER TABLE roommate_listings ADD COLUMN budget_max INTEGER;
