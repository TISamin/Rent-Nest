-- ============================================================
-- V1: RentNest Initial Schema
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number      VARCHAR(20) UNIQUE NOT NULL,
    name              VARCHAR(100),
    email             VARCHAR(100),
    address           TEXT,
    profile_photo_url TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    category       VARCHAR(50) NOT NULL,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    price          DECIMAL(12, 2),
    image_url      TEXT,
    location_text  VARCHAR(300),
    latitude       DECIMAL(10, 8),
    longitude      DECIMAL(11, 8),
    contact_phone  VARCHAR(20),
    created_at     TIMESTAMP DEFAULT NOW(),
    is_active      BOOLEAN DEFAULT TRUE
);

-- Roommate listings table (1:1 extension of listings for ROOMMATE_FINDER category)
CREATE TABLE IF NOT EXISTS roommate_listings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id              UUID REFERENCES listings(id) ON DELETE CASCADE,
    owner_photo_url         TEXT,
    total_roommates_wanted  INT,
    roommates_already_have  INT,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- Roommate members table
CREATE TABLE IF NOT EXISTS roommate_members (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roommate_listing_id  UUID REFERENCES roommate_listings(id) ON DELETE CASCADE,
    member_description   TEXT,
    member_photo_url     TEXT
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_category  ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_user_id   ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
