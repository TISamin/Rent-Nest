-- Add role, is_banned, and ban_reason to users
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER' NOT NULL;
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN ban_reason TEXT;

-- Add review stats to listings
ALTER TABLE listings ADD COLUMN review_count INT DEFAULT 0 NOT NULL;
ALTER TABLE listings ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0.00 NOT NULL;

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    user_id UUID, -- nullable because of SET NULL
    listing_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Ensure a user can only review a listing once (where user_id is not null)
CREATE UNIQUE INDEX idx_reviews_user_listing ON reviews (user_id, listing_id) WHERE user_id IS NOT NULL;

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ensure a user can only report a specific target once
CREATE UNIQUE INDEX idx_reports_reporter_target ON reports (reporter_id, target_type, target_id);
