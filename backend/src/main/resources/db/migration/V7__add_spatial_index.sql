-- ============================================================
-- V7: Add functional GiST spatial index for PostGIS radius queries
-- ============================================================
-- The ST_DWithin queries in ListingRepository already use PostGIS correctly,
-- but without an index they perform a full table scan on every radius search.
-- This functional expression index lets PostgreSQL reuse precomputed geography
-- geometry, making ST_DWithin lookups O(log n) instead of O(n).
-- CREATE INDEX IF NOT EXISTS idx_listings_location_geom
--   ON listings
--   USING GIST (
--     ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography
--   )
--   WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- V7: Add functional GiST spatial index for PostGIS radius queries
CREATE INDEX IF NOT EXISTS idx_listings_location_geom
  ON listings
  USING GIST (
    CAST(ST_SetSRID(ST_Point(longitude, latitude), 4326) AS geography)
  )
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
