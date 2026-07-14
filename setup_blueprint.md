# Rent-Nest — Setup & Development Blueprint

This document contains a complete architectural design, database schema inventory, REST API contract, security protocol, AI implementation strategy, and frontend logic blueprint for **Rent-Nest**. 

A brand new agent or developer can use this specification to rebuild the entire platform from scratch.

---

## 1. System Architecture

```
                 ┌────────────────────────────────────────────────────────┐
                 │                        FRONTEND                        │
                 │                 (SPA — Static HTML5)                   │
                 │    Vanilla JS + Tailwind CDN + Leaflet.js Mapping      │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                  HTTPS REST Request + JWT
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │                        BACKEND                         │
                 │              (Java 17 + Spring Boot 3.3.6)             │
                 │  Spring Security 6 (Stateless JWT Filter) + JJWT       │
                 └──────┬────────────────────┬────────────────────┬───────┘
                        │                    │                    │
                        ▼                    ▼                    ▼
             ┌────────────────────┐ ┌──────────────────┐ ┌────────────────┐
             │      DATABASE      │ │   IMAGE STORAGE  │ │  AI SERVICES   │
             │ PostgreSQL 16      │ │ Cloudinary CDN   │ │ Gemini Flash   │
             │ + PostGIS on Neon  │ │ (Direct Upload)  │ │ + Groq Llama  │
             └────────────────────┘ └──────────────────┘ └────────────────┘
```

### Key Technical Characteristics
* **Stateless REST backend**: Communication is fully decoupled. All authenticated routes require a JWT token passed in the `Authorization: Bearer <token>` header.
* **Geospatial querying**: Employs the `PostGIS` extension on PostgreSQL to perform fast geographic searches using indices instead of computing haversine equations on every row.
* **Double-provider AI chain**: Uses a primary Gemini API integration, switching to a Groq Llama 3.3 fallback if the primary API returns resource exhaustion (HTTP 429) or availability (5xx) exceptions.
* **Onboarding & Ban Guards**: Client and server filters enforce setup gates (no access if profile is incomplete/no password set) and account suspensions (direct HTTP 403 intercept if banned).

---

## 2. Database Schema & Flyway Migrations

The database consists of **21 tables** initialized via 12 Flyway SQL scripts. Below is the complete catalog of migrations, tables, columns, indexes, and constraints.

### Migrations Timeline (V1–V12)

#### V1: Initial Core Schema (`V1__init_schema.sql`)
* **`users`**
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `phone_number` `VARCHAR(20)` (Unique, Not Null)
  * `name` `VARCHAR(100)`
  * `email` `VARCHAR(100)`
  * `address` `TEXT`
  * `profile_photo_url` `TEXT`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`listings`**
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE)
  * `category` `VARCHAR(50)` (Not Null) — *Enums: FLAT, HOUSE, HOTEL, CONVENTION_HALL, ROOMMATE_FINDER, MARKETPLACE, etc.*
  * `title` `VARCHAR(200)` (Not Null)
  * `description` `TEXT`
  * `price` `DECIMAL(12,2)`
  * `image_url` `TEXT`
  * `location_text` `VARCHAR(300)`
  * `latitude` `DECIMAL(10,8)`
  * `longitude` `DECIMAL(11,8)`
  * `contact_phone` `VARCHAR(20)`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
  * `is_active` `BOOLEAN` (Default `TRUE`)
* **`roommate_listings`** (1:1 extension of `listings` for roommate finding)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `owner_photo_url` `TEXT`
  * `total_roommates_wanted` `INT`
  * `roommates_already_have` `INT`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`roommate_members`** (Multiple roommates within a roommate listing)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `roommate_listing_id` `UUID` (Foreign Key -> `roommate_listings(id)` ON DELETE CASCADE)
  * `member_description` `TEXT`
  * `member_photo_url` `TEXT`
* **V1 Indexes**:
  * `idx_listings_category` ON `listings(category)`
  * `idx_listings_user_id` ON `listings(user_id)`
  * `idx_listings_is_active` ON `listings(is_active)`

#### V2: Email Transition (`V2__email_auth.sql`)
* Modifies `users` table:
  * Drop `NOT NULL` constraint from `phone_number`.
  * Add `email` `VARCHAR(100)` (Unique constraint).

#### V3: Password Addition (`V3__user_password.sql`)
* Modifies `users` table:
  * Add `password_hash` `VARCHAR(255)` to store bcrypt-encrypted passwords.

#### V4: Advanced Listing Substructures (`V4__add_advanced_listing_tables.sql`)
* Modifies `listings` table:
  * Rename `price` to `price_min` `DECIMAL(12, 2)`.
  * Add `price_max` `DECIMAL(12, 2)`.
* Modifies `roommate_listings` table:
  * Add `budget_min` `INT`.
  * Add `budget_max` `INT`.
* **`residential_detail`** (1:1 extension of `listings` for FLAT, HOUSE, HOTEL categories)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Unique, Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `bedroom_count` `INT` (Default `0`, Not Null)
  * `bathroom_count` `INT` (Default `0`, Not Null)
  * `other_rooms_count` `INT` (Default `0`, Not Null)
* **`room_detail`** (Per-room image arrays and descriptions)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `room_type` `VARCHAR(50)` (Not Null) — *Enums: BEDROOM, BATHROOM, KITCHEN, LIVING_ROOM, OTHER*
  * `description` `TEXT`
  * `image_urls` `TEXT` (Comma-separated URLs)
* **`convention_detail`** (1:1 extension of `listings` for CONVENTION_HALL category)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Unique, Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `capacity` `INT`
  * `hall_count` `INT` (Default `1`)
* **`listing_amenity`** (Amenities associated with a listing)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `amenity_name` `VARCHAR(100)` (Not Null)
* **`service_offering`** (Granular price lists for shifting, cleaning, event, catering services)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE)
  * `offering_name` `VARCHAR(100)` (Not Null)
  * `price_min` `DECIMAL(12,2)`
  * `price_max` `DECIMAL(12,2)`
  * `description` `TEXT`

#### V5: Listing Pricing Unit (`V5__add_price_unit.sql`)
* Modifies `listings` table:
  * Add `price_unit` `VARCHAR(20)` (Default `'month'`).

#### V6: PostGIS Activation (`V6__enable_postgis.sql`)
* Executes: `CREATE EXTENSION IF NOT EXISTS postgis;`

#### V7: Spatial Coordinates Performance Index (`V7__add_spatial_index.sql`)
* Adds a functional geographic GiST index to `listings` to optimize `ST_DWithin` queries:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_listings_location_geom
    ON listings
    USING GIST (
      CAST(ST_SetSRID(ST_Point(longitude, latitude), 4326) AS geography)
    )
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  ```

#### V8: Database OTP Storage (`V8__add_otp_table.sql`)
* **`otp_tokens`**
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `email` `VARCHAR(255)` (Not Null)
  * `otp` `VARCHAR(10)` (Not Null)
  * `expires_at` `TIMESTAMP WITH TIME ZONE` (Not Null)
  * `used` `BOOLEAN` (Default `FALSE`, Not Null)
  * `created_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
* **V8 Indexes**:
  * `idx_otp_tokens_email` ON `otp_tokens(email)`

#### V9: Wishlist Storage (`V9__add_wishlist_table.sql`)
* **`wishlists`**
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE, Not Null)
  * `created_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
  * Unique constraint: `UNIQUE(user_id, listing_id)`
* **V9 Indexes**:
  * `idx_wishlists_user` ON `wishlists(user_id)`

#### V10: Landlord Dashboard Schema (`V10__add_landlord_dashboard_tables.sql`)
* **`dashboard_properties`** (Internal properties managed by landlord)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `name` `VARCHAR(200)` (Not Null)
  * `location` `VARCHAR(300)`
  * `type` `VARCHAR(50)`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_units`** (Units nested within a landlord property)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `property_id` `UUID` (Foreign Key -> `dashboard_properties(id)` ON DELETE CASCADE, Not Null)
  * `name` `VARCHAR(200)` (Not Null)
  * `rent_amount` `DECIMAL(12,2)` (Default `0`, Not Null)
  * `rent_period` `VARCHAR(20)` (Default `'MONTHLY'`, Not Null)
  * `collection_day` `INT` (Default `1`, Not Null)
  * `is_vacant` `BOOLEAN` (Default `TRUE`, Not Null)
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_leases`** (Active tenants linked to specific units)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `unit_id` `UUID` (Foreign Key -> `dashboard_units(id)` ON DELETE CASCADE, Not Null)
  * `tenant_name` `VARCHAR(200)` (Not Null)
  * `whatsapp_number` `VARCHAR(30)`
  * `start_date` `DATE` (Not Null)
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_rent_records`** (Rent billing history linked to leases)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `lease_id` `UUID` (Foreign Key -> `dashboard_leases(id)` ON DELETE CASCADE, Not Null)
  * `period_label` `VARCHAR(50)` (Not Null) — *e.g. "January 2026"*
  * `amount` `DECIMAL(12,2)` (Not Null)
  * `status` `VARCHAR(10)` (Default `'DUE'`, Not Null) — *Enums: DUE, PAID*
  * `paid_at` `TIMESTAMP`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_maintenance_requests`** (Properties maintenance ledger)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `unit_id` `UUID` (Foreign Key -> `dashboard_units(id)` ON DELETE SET NULL)
  * `title` `VARCHAR(300)` (Not Null)
  * `description` `TEXT`
  * `priority` `VARCHAR(10)` (Default `'MEDIUM'`, Not Null) — *Enums: LOW, MEDIUM, HIGH*
  * `cost` `DECIMAL(12,2)`
  * `status` `VARCHAR(20)` (Default `'OPEN'`, Not Null) — *Enums: OPEN, IN_PROGRESS, RESOLVED*
  * `resolved_at` `TIMESTAMP`
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_expenditures`** (Landlord operational expense ledger)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `name` `VARCHAR(300)` (Not Null)
  * `cost` `DECIMAL(12,2)` (Default `0`, Not Null)
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **`dashboard_announcements`** (Landlord internal notes/reminders)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `text` `TEXT` (Not Null)
  * `created_at` `TIMESTAMP` (Default `NOW()`)
* **V10 Indexes**:
  * `idx_dash_properties_user` ON `dashboard_properties(user_id)`
  * `idx_dash_units_property` ON `dashboard_units(property_id)`
  * `idx_dash_leases_unit` ON `dashboard_leases(unit_id)`
  * `idx_dash_rent_records_lease` ON `dashboard_rent_records(lease_id)`
  * `idx_dash_rent_records_status` ON `dashboard_rent_records(status)`
  * `idx_dash_maintenance_user` ON `dashboard_maintenance_requests(user_id)`
  * `idx_dash_maintenance_status` ON `dashboard_maintenance_requests(status)`
  * `idx_dash_expenditures_user` ON `dashboard_expenditures(user_id)`
  * `idx_dash_announcements_user` ON `dashboard_announcements(user_id)`

#### V11: Moderation, Reviews & Reports (`V11__add_reviews_reports_admin.sql`)
* Modifies `users` table:
  * Add `role` `VARCHAR(20)` (Default `'USER'`, Not Null) — *Enums: USER, ADMIN*
  * Add `is_banned` `BOOLEAN` (Default `FALSE`, Not Null).
  * Add `ban_reason` `TEXT`.
* Modifies `listings` table:
  * Add `review_count` `INT` (Default `0`, Not Null).
  * Add `average_rating` `DECIMAL(3, 2)` (Default `0.00`, Not Null).
* **`reviews`** (Property reviews)
  * `id` `UUID` (Primary Key)
  * `user_id` `UUID` (Foreign Key -> `users(id)` ON DELETE SET NULL)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE, Not Null)
  * `rating` `INT` (Check: `rating >= 1 AND rating <= 5`, Not Null)
  * `comment` `TEXT`
  * `created_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
  * `updated_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
* **`reports`** (Inappropriate content user flagging)
  * `id` `UUID` (Primary Key)
  * `reporter_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `target_type` `VARCHAR(50)` (Not Null) — *e.g. "LISTING" or "USER"*
  * `target_id` `UUID` (Not Null)
  * `reason` `VARCHAR(100)` (Not Null)
  * `note` `TEXT`
  * `status` `VARCHAR(50)` (Default `'PENDING'`, Not Null) — *Enums: PENDING, RESOLVED*
  * `created_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
* **V11 Indexes**:
  * `idx_reviews_user_listing` (Unique) ON `reviews(user_id, listing_id)` WHERE `user_id IS NOT NULL`
  * `idx_reports_reporter_target` (Unique) ON `reports(reporter_id, target_type, target_id)`

#### V12: Marketplace Escrow (`V12__add_marketplace_escrow.sql`)
* **`marketplace_escrows`** (Escrow lifecycle state records)
  * `id` `UUID` (Primary Key, Default `gen_random_uuid()`)
  * `listing_id` `UUID` (Foreign Key -> `listings(id)` ON DELETE CASCADE, Not Null)
  * `buyer_id` `UUID` (Foreign Key -> `users(id)` ON DELETE CASCADE, Not Null)
  * `status` `VARCHAR(50)` (Not Null) — *Enums: PENDING, ACCEPTED, DECLINED, PAID, SHIPPED, COMPLETED, DISPUTED, REFUNDED*
  * `payment_method` `VARCHAR(50)`
  * `transaction_reference` `VARCHAR(100)`
  * `admin_notes` `VARCHAR(255)` — *e.g. "CONFIRMED" or "REJECTED"*
  * `dispute_reason` `VARCHAR(255)`
  * `created_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)
  * `updated_at` `TIMESTAMP` (Default `CURRENT_TIMESTAMP`)

---

## 3. Backend REST API Specifications

All endpoints return a standardized JSON envelope wrapping an `ApiResponse<T>`:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Auth Controller (`/api/auth/**`)
* **`POST /api/auth/signup/request-otp`**: Sends registration verification request.
  * *Request Body*: `{"email": "string"}`
  * *Response*: Envelopes generated OTP string (used by client via EmailJS).
* **`POST /api/auth/signup/verify-otp`**: Registers new user details.
  * *Request Body*: `{"email": "string", "otp": "string"}`
  * *Response*: Token payload `{"token": "JWT_TOKEN", "user": {UserObject}}`
* **`POST /api/auth/forgot-password/request-otp`**: Request password reset pin.
  * *Request Body*: `{"email": "string"}`
  * *Response*: Envelopes reset OTP string.
* **`POST /api/auth/forgot-password/reset`**: Submit password change.
  * *Request Body*: `{"email": "string", "otp": "string", "password": "string"}`
* **`POST /api/auth/set-password`** *(Auth required)*: Sets secure login password.
  * *Request Body*: `{"password": "string"}`
* **`GET /api/auth/me`** *(Auth required)*: Fetch authenticated identity.

### Listings Controller (`/api/listings/**`)
* **`POST /api/listings`** *(Auth required)*: Publish a listing.
  * *Request Body*: `ListingRequest` (Contains title, category, price limits, geolocation parameters, amenities list, and category details like room details, capacity, or roommate profiles).
* **`GET /api/listings/{id}`**: Fetch single listing item detail.
* **`PUT /api/listings/{id}`** *(Auth required, Owner only)*: Update listing details.
* **`DELETE /api/listings/{id}`** *(Auth required, Owner only)*: Delete listing.
* **`GET /api/listings/my`** *(Auth required)*: Retrieve listings owned by the logged-in user.

### Search Controller (`/api/search/**`)
* **`GET /api/search/rental`**: Geospatial radius listing lookup.
  * *Query Params*: `location` (text), `category` (enum), `lat` (double), `lng` (double), `radius` (integer in meters), `minBudget` (double), `maxBudget` (double).
  * *Logic*: Calls PostGIS radius query and sorts results using the Haversine formula.
* **`GET /api/search/marketplace`**: Search marketplace.
  * *Query Params*: `item` (text keyword matches title/description).
* **`GET /api/search/roommate`**: Search roommate area.
  * *Query Params*: `area` (text keyword matches locationText).
* **`GET /api/search/services`**: Search service availability.
  * *Query Params*: `location` (text), `category` (enum).
* **`GET /api/search/locations`**: Typeahead location suggestion.
  * *Query Params*: `query` (prefix string).

### Users Controller (`/api/users/**`)
* **`PUT /api/users/profile`** *(Auth required)*: Update user profile.
  * *Request Body*: `{"name": "string", "email": "string", "address": "string", "profilePhotoUrl": "string"}`

### Wishlist Controller (`/api/wishlist/**`)
* **`GET /api/wishlist`** *(Auth required)*: Fetch saved wishlisted objects.
* **`POST /api/wishlist/toggle/{id}`** *(Auth required)*: Toggles saved status on a target.
* **`POST /api/wishlist/check`** *(Auth required)*: Check list of IDs against user wishlists.
  * *Request Body*: `["UUID", "UUID"]`

### AI Features Controller (`/api/ai/**`)
* **`POST /api/ai/generate-description`** *(Auth required)*: Generate marketing text.
  * *Request Body*: JSON Map representing facts (category, location, price, rooms, etc.).
* **`POST /api/ai/parse-search-query`**: Natural query filter parsing.
  * *Request Body*: `{"query": "User natural language request string"}`

### Landlord Dashboard Controller (`/api/dashboard/**`)
*All endpoints require authentication.*
* **`GET /api/dashboard/stats`**: Fetch dashboard stats (gross earnings, occupancy rate, active tenants, open maintenance count).
* **`GET /api/dashboard/chart`**: Return financial stats array for Recharts charts.
* **`GET /api/dashboard/properties`**: List properties.
* **`POST /api/dashboard/properties`**: Create property.
* **`PUT /api/dashboard/properties/{id}`**: Edit property.
* **`DELETE /api/dashboard/properties/{id}`**: Delete property (cascade-deletes units, leases, records).
* **`GET /api/dashboard/units`**: Get all units.
* **`GET /api/dashboard/units/by-property/{propertyId}`**: Get units for a property.
* **`POST /api/dashboard/units`**: Create unit.
* **`PUT /api/dashboard/units/{id}`**: Update unit.
* **`DELETE /api/dashboard/units/{id}`**: Delete unit.
* **`GET /api/dashboard/leases`**: Get active leases.
* **`POST /api/dashboard/leases`**: Assign tenant to unit (sets unit `is_vacant = FALSE`).
* **`PUT /api/dashboard/leases/{id}`**: Edit tenant metadata.
* **`DELETE /api/dashboard/leases/{id}`**: Revoke lease (sets unit `is_vacant = TRUE`).
* **`GET /api/dashboard/rent-records`**: Get rent records for a lease.
* **`POST /api/dashboard/rent-records`**: Issue a new DUE rent record.
  * *Request Body*: `{"leaseId": "UUID", "periodLabel": "string", "amount": double}`
* **`POST /api/dashboard/rent-records/{id}/pay`**: Mark rent record status as PAID (sets `paidAt = NOW()`).
* **`GET /api/dashboard/maintenance`**: Get maintenance requests.
* **`POST /api/dashboard/maintenance`**: Create ticket.
* **`PUT /api/dashboard/maintenance/{id}`**: Update ticket details.
* **`PUT /api/dashboard/maintenance/{id}/status`**: Drag-and-drop column change update.
  * *Request Body*: `{"status": "OPEN|IN_PROGRESS|RESOLVED"}`
* **`DELETE /api/dashboard/maintenance/{id}`**: Delete ticket.
* **`GET /api/dashboard/expenditures`**: List landlord expenditures.
* **`POST /api/dashboard/expenditures`**: Create expenditure log.
* **`PUT /api/dashboard/expenditures/{id}`**: Edit expenditure log.
* **`DELETE /api/dashboard/expenditures/{id}`**: Delete expenditure.
* **`GET /api/dashboard/announcements`**: Get sticky announcements.
* **`POST /api/dashboard/announcements`**: Write an announcement.
* **`DELETE /api/dashboard/announcements/{id}`**: Remove an announcement.

### Escrow Controller (`/api/escrow/**`)
*All endpoints require authentication.*
* **`POST /api/escrow/buy/{listingId}`**: Buyer triggers buy request.
* **`POST /api/escrow/{escrowId}/accept`**: Seller accepts buy request (status: PENDING -> ACCEPTED).
* **`POST /api/escrow/{escrowId}/decline`**: Seller declines buy request (status: PENDING -> DECLINED).
* **`POST /api/escrow/{escrowId}/withdraw`**: Buyer withdraws request (status: PENDING/ACCEPTED -> DECLINED).
* **`POST /api/escrow/{escrowId}/pay`**: Buyer submits payment transaction receipt.
  * *Request Body*: `{"paymentMethod": "string", "transactionReference": "string"}`
  * *Result*: Sets status to PAID.
* **`POST /api/escrow/{escrowId}/ship`**: Seller marks item as shipped (status: PAID -> SHIPPED). Requires admin confirmation notes = "CONFIRMED".
* **`POST /api/escrow/{escrowId}/receive`**: Buyer confirms receipt (status: SHIPPED -> COMPLETED, sets listing `is_active = FALSE`).
* **`POST /api/escrow/{escrowId}/dispute`**: Buyer flags issue (status: SHIPPED -> DISPUTED).
  * *Request Body*: `{"reason": "string"}`
* **`GET /api/escrow/activity`**: Fetch user-related transaction array (both sent and received).

### Admin Controller (`/api/admin/**`)
*Require ADMIN authority role.*
* **`GET /api/admin/reports`**: List reported items.
* **`PUT /api/admin/reports/{id}/status`**: Update report status (PENDING -> RESOLVED).
* **`GET /api/admin/stats`**: Fetch admin statistics.
* **`GET /api/admin/users`**: List and search users.
* **`POST /api/admin/users/{id}/ban`**: Ban or unban user.
  * *Request Body*: `{"reason": "string"}`
  * *Result*: Toggles `is_banned` and sets `ban_reason`.
* **`DELETE /api/admin/users/{id}`**: Delete user from database.
* **`DELETE /api/admin/listings/{id}`**: Remove listing item from database.
* **`GET /api/admin/escrows`**: List all active marketplace transactions.
* **`POST /api/admin/escrows/{id}/verify-payment`**: Verify buyer's payment reference.
  * *Query Param*: `confirm` (boolean).
  * *Result*: If true, sets `admin_notes = "CONFIRMED"`. If false, sets status to `DECLINED` and `admin_notes = "REJECTED"`.
* **`POST /api/admin/escrows/{id}/complete`**: Force complete transaction (status -> COMPLETED, deactivates listing).
* **`POST /api/admin/escrows/{id}/refund`**: Force refund transaction (status -> REFUNDED).

---

## 4. Security & Authentication Flow

Spring Security acts as a stateless firewall using JWT tokens.

```
Incoming Request
      │
      ▼
┌──────────────────────────────┐
│    JwtAuthenticationFilter   │
└─────────────┬────────────────┘
              │
              ├─► Extract JWT from "Authorization: Bearer <token>"
              ├─► Validate expiration & signature
              ├─► Load User from Database
              │
              ▼
    Is User Banned?
      ├── Yes ──► Direct 403 response: "Account banned: <Reason>" (Short-circuit filter chain)
      └── No ───► Inject UsernamePasswordAuthenticationToken (with UserDetails & ROLE_*) into SecurityContext
              │
              ▼
┌──────────────────────────────┐
│      SecurityFilterChain     │
└─────────────┬────────────────┘
              │
              ├─► Match URL authorization rules (Public vs. Auth required)
              ├─► Check method security annotations (e.g. ROLE_ADMIN)
              │
              ▼
   Proceed to Controller
```

### Key Security Implementations
* **Database OTP verification**:
  1. Generate 6-digit random code, store in `otp_tokens` with an expiry timestamp (5-minute TTL).
  2. The email sending is initiated via the frontend using EmailJS to prevent exposing SMTP credentials on the backend.
  3. During verification, match the submitted code against the latest unused code for that email. If correct, mark it as `used` (preventing replay attacks) and issue a JWT.
  4. A background scheduling task running every 5 minutes (`@Scheduled(fixedRate = 300000)`) purges expired OTPs:
     ```java
     otpTokenRepository.deleteExpired(Instant.now());
     ```
* **Stateless filter chain configuration**:
  * CSRF disabled (stateless API).
  * CORS allowed-origins dynamically configured via properties/env.
  * Security Context is hydrated per-request; no server-side HTTP sessions are created.

---

## 5. AI Service Implementation

Rent-Nest features AI query parsing for searches and an AI-powered description generator for listing creation.

### Dual-Provider Fallback Architecture
All AI requests route through `AiTextService`, which manages the fallback logic:
1. **Primary Request**: Send the payload to the Gemini API (`gemini-2.0-flash`).
2. **Exception Interceptor**: Catch `AiProviderException`. 
3. **Fallback Logic**: If the failure is related to quota limits (HTTP 429), model unavailability (HTTP 404), or server issues (5xx), catch it and route the request to the Groq API (`llama-3.3-70b-versatile`). Other exceptions (e.g., prompt blocked by safety filters) fail immediately to prevent bypass attempts.

### AI Search Query Parser
* **System Prompt**:
  ```
  You are an assistant that parses user search queries into filter parameters.
  You MUST respond with STRICT JSON ONLY. No prose, no conversation, no markdown code block formatting (i.e. do not use ```json wrappers).
  The JSON object must have EXACTLY the following fields:
  {
    "locationText": string or null,
    "category": one of [FLAT, HOUSE, HOTEL, CONVENTION_HALL] or null,
    "priceMax": number or null (e.g. 20000 for 'under 20k', etc. Parse 'k' as thousand),
    "bedroomCount": number or null,
    "radius": number or null (in meters)
  }
  Extract as much relevant detail as possible using only facts from the input.
  ```
* **Retry Strategy**: If the returned text fails JSON parsing, the service runs a retry prompt once, explicitly telling the model to return raw JSON only. If the second attempt fails, it returns an empty parameter structure to prevent the user's search from crashing.

---

## 6. Frontend Architecture & Routing Rules

The frontend is a lightweight Single Page Application (SPA) utilizing static HTML5, Vanilla JavaScript, and Tailwind CSS (CDN).

### Global Fetch Interceptor (`api.js`)
All API calls are routed through `apiRequest(method, path, body)`. This method handles:
* **JWT Header Injection**: Retrieves the token from `localStorage` using `localStorage.getItem('rentnest_token')` and appends it to the request headers.
* **403 Banned Redirect**: If the API returns a 403 Forbidden with a message starting with `"Account banned:"`, the interceptor clears `localStorage`, extracts the reason, and redirects the browser to `banned.html?reason=...`.
* **401 Unauthorized Redirect**: If the status is 401/403 (and the account is not banned), the user is redirected to `login.html`, clearing old expired credentials.

### Onboarding Guard
When a user is authenticated but has not yet set a password (e.g., immediately after OTP verification), they are locked out of normal pages. 
A DOM listener in `api.js` runs on page load:
```javascript
const localUser = localStorage.getItem('rentnest_user');
if (localUser) {
  const userObj = JSON.parse(localUser);
  const hasPassword = userObj.passwordSet === true || userObj.isPasswordSet === true;
  if (!hasPassword && !window.location.pathname.includes('set-password.html')) {
    window.location.href = 'set-password.html';
  }
}
```

### Landlord Wizard & Kanban Updates
* **3-Step Landlord Setup Wizard**: Guided visual components that toggle class visibility. Prevents navigating to the main dashboard until a property is created, unit configured, and first tenant lease linked.
* **Interactive Kanban Board**: Allows drag-and-drop of cards across columns (Open, In Progress, Resolved). Updates the card's column on the UI instantly and fires a non-blocking `PUT /api/dashboard/maintenance/{id}/status` request in the background.

---

## 7. Third-Party Integrations

```
                     ┌──────────────────┐
                     │     Frontend     │
                     └─┬──────────────┬─┘
                       │              │
        Upload Request │              │ Submit Email
       (Direct Signature)              │ (OTP payload)
                       ▼              ▼
              ┌────────────────┐ ┌──────────────┐
              │ Cloudinary CDN │ │  EmailJS API │
              │ (Image Assets) │ │(SMTP Bypass) │
              └────────────────┘ └──────────────┘
```

To optimize server resource usage, all heavy assets and emails bypass the Spring Boot backend.

### Cloudinary Browser-to-CDN Direct Uploads
Used in listing creation, profile photos, and roommate profile cards.
* **Flow**:
  1. The client selects a file.
  2. The frontend initiates a direct `POST` to Cloudinary: `https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`.
  3. The body contains the file and the unsigned upload preset.
  4. Cloudinary returns a secure URL (e.g., `https://res.cloudinary.com/...`).
  5. The frontend sends this URL to the Spring Boot API during listing creation or profile updates.

### EmailJS OTP Delivery
Used during signup and password reset request screens.
* **Flow**:
  1. The user requests an OTP on the frontend.
  2. The frontend sends a request to the backend auth endpoint.
  3. The backend generates the OTP and returns it in the API response.
  4. The frontend catches the response and invokes `emailjs.send()` directly from the browser, passing the user's email and the OTP to be sent via EmailJS templates.

---

## 8. Deployment Configurations

### Backend Deploy (Render Docker configuration)
Deploy on Render using a Dockerfile:
```dockerfile
# Build stage
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/rentnest-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Environment Variables Matrix

| Service | Environment Variable | Role | Notes |
|---|---|---|---|
| **Backend** | `DATABASE_URL` | PostgreSQL Neon JDBC Url | Must append `sslmode=require` |
| **Backend** | `JWT_SECRET` | Secret sign key | Minimum 256-bit character string |
| **Backend** | `CORS_ORIGINS` | Permitted origins | Comma-separated list (no trailing slash) |
| **Backend** | `GEMINI_API_KEY` | Primary LLM Key | Required for query parser and descriptions |
| **Backend** | `GROQ_API_KEY` | Fallback LLM Key | Required for AI fallback chain |
| **Frontend** | *Hardcoded Constants* | API keys and endpoints | Configured in `js/api.js` and `js/auth.js` |
