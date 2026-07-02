-- ============================================================
-- V10: Landlord Dashboard Tables
-- ============================================================

-- Properties managed by the landlord (internal, separate from public listings)
CREATE TABLE IF NOT EXISTS dashboard_properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    location    VARCHAR(300),
    type        VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_properties_user ON dashboard_properties(user_id);

-- Units within a property
CREATE TABLE IF NOT EXISTS dashboard_units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES dashboard_properties(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    rent_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    rent_period     VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    collection_day  INT NOT NULL DEFAULT 1,
    is_vacant       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_units_property ON dashboard_units(property_id);

-- Active leases (one per occupied unit)
CREATE TABLE IF NOT EXISTS dashboard_leases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID NOT NULL REFERENCES dashboard_units(id) ON DELETE CASCADE,
    tenant_name     VARCHAR(200) NOT NULL,
    whatsapp_number VARCHAR(30),
    start_date      DATE NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_leases_unit ON dashboard_leases(unit_id);

-- Rent records — one row per billing period for full payment history
CREATE TABLE IF NOT EXISTS dashboard_rent_records (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id     UUID NOT NULL REFERENCES dashboard_leases(id) ON DELETE CASCADE,
    period_label VARCHAR(50) NOT NULL,
    amount       DECIMAL(12, 2) NOT NULL,
    status       VARCHAR(10) NOT NULL DEFAULT 'DUE',
    paid_at      TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_rent_records_lease ON dashboard_rent_records(lease_id);
CREATE INDEX IF NOT EXISTS idx_dash_rent_records_status ON dashboard_rent_records(status);

-- Maintenance requests
CREATE TABLE IF NOT EXISTS dashboard_maintenance_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id     UUID REFERENCES dashboard_units(id) ON DELETE SET NULL,
    title       VARCHAR(300) NOT NULL,
    description TEXT,
    priority    VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    cost        DECIMAL(12, 2),
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolved_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_maintenance_user ON dashboard_maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dash_maintenance_status ON dashboard_maintenance_requests(status);

-- Expenditures
CREATE TABLE IF NOT EXISTS dashboard_expenditures (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(300) NOT NULL,
    cost       DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_expenditures_user ON dashboard_expenditures(user_id);

-- Announcements (notepad)
CREATE TABLE IF NOT EXISTS dashboard_announcements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dash_announcements_user ON dashboard_announcements(user_id);
