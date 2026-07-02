# Rent-Nest — Project Context

> Last updated: 2026-06-29. Keep this file in sync when adding routes, env vars, or features.

---

## 🌐 Deployment URLs

| Service | URL |
|---|---|
| **Frontend** (Vercel) | https://rent-nest-pi.vercel.app |
| **Backend** (Render) | https://rent-nest-wntm.onrender.com |
| **Database** (Neon / PostgreSQL) | `ep-rapid-mountain-aoc6btq8-pooler.c-2.ap-southeast-1.aws.neon.tech` |

The frontend auto-detects environment in `api.js`:
- `localhost` / `127.0.0.1` / `file:` → `http://localhost:8080/api`
- Anything else → `https://rent-nest-wntm.onrender.com/api`

---

## 🛠️ Tech Stack

### Backend
- **Java 17** / **Spring Boot 3.3.6** (Web, JPA, Security, Validation)
- **Spring Security 6** — stateless JWT, custom filter chain
- **PostgreSQL** on Neon with **PostGIS** extension enabled
- **Flyway** — database migrations (V1–V10)
- **JJWT 0.12.6** — JWT generation/validation
- **Lombok** — boilerplate reduction
- **OTP** — persisted in PostgreSQL (`otp_tokens` table) with `used` boolean, 5-min TTL, scheduled cleanup via `@EnableScheduling`
- **Docker** — `Dockerfile` present for containerised deploys on Render

### Frontend
- **Static HTML5 + Vanilla JS** — no framework, no build step
- **Tailwind CSS** (CDN) — utility classes, custom theme config inline per page
- **Leaflet.js** — interactive maps (OpenStreetMap tiles)
- **OSM Nominatim** — forward and reverse geocoding (free, no API key)
- **EmailJS** — client-side OTP email delivery (`service_o9wjmag`, template `template_xrdy6ao`)
- **Cloudinary** — direct browser-to-CDN image upload (`cloud: du711ught`, preset: `bwuqyeyc`)
- **React + Recharts** (CDN) — used only in `dashboard.html` for the financial performance composed chart

---

## 📂 File Structure

```
Rent-Nest/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/rentnest/
│       │   ├── config/
│       │   │   ├── JwtAuthenticationFilter.java   # Extracts & validates JWT from Authorization header
│       │   │   ├── JwtTokenProvider.java           # Generates & parses JWT tokens
│       │   │   └── SecurityConfig.java             # CORS, stateless session, public route rules
│       │   ├── controller/
│       │   │   ├── AuthController.java             # /api/auth/** endpoints
│       │   │   ├── DashboardController.java        # /api/dashboard/** endpoints (NEW)
│       │   │   ├── ListingController.java          # /api/listings/** endpoints
│       │   │   ├── SearchController.java           # /api/search/** endpoints
│       │   │   ├── UserController.java             # /api/users/** endpoints
│       │   │   └── WishlistController.java         # /api/wishlist/** endpoints
│       │   ├── dto/
│       │   │   ├── ApiResponse.java                # Generic success/error wrapper
│       │   │   ├── ListingRequest.java             # Listing creation/update payload
│       │   │   ├── ListingResponse.java            # Listing read DTO (fromEntity static factory)
│       │   │   ├── SearchRequest.java
│       │   │   └── UserProfileDTO.java
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   └── ResourceNotFoundException.java
│       │   ├── model/
│       │   │   ├── Listing.java                   # Base listing entity
│       │   │   ├── User.java                      # User entity (implements UserDetails)
│       │   │   ├── RoommateListing.java           # 1:1 extension for ROOMMATE_FINDER
│       │   │   ├── RoommateMember.java            # Members of a roommate listing
│       │   │   ├── ResidentialDetail.java         # 1:1 extension for FLAT/HOUSE/HOTEL
│       │   │   ├── RoomDetail.java                # Per-room images/description
│       │   │   ├── ConventionDetail.java          # 1:1 extension for CONVENTION_HALL
│       │   │   ├── ListingAmenity.java            # Amenity tags (shared across all types)
│       │   │   ├── ServiceOffering.java           # Priced line items for services
│       │   │   ├── OtpToken.java                  # DB-backed OTPs
│       │   │   ├── Wishlist.java                  # Saved listings
│       │   │   ├── enums/ListingCategory.java
│       │   │   └── dashboard/                     # NEW — Internal landlord management models
│       │   │       ├── DashboardProperty.java     # Landlord-managed properties (separate from public listings)
│       │   │       ├── DashboardUnit.java         # Individual units within a property (exposes propertyId via @Transient getter)
│       │   │       ├── DashboardLease.java        # Tenant assignment to a unit
│       │   │       ├── RentRecord.java            # Rent billing ledger (one row per period, DUE/PAID status)
│       │   │       ├── DashboardMaintenanceRequest.java  # Kanban-style maintenance requests
│       │   │       ├── DashboardExpenditure.java  # Landlord personal expense logs
│       │   │       └── DashboardAnnouncement.java # Scratch-pad reminders/notes
│       │   ├── repository/
│       │   │   ├── ListingRepository.java         # ST_DWithin radius queries + standard finders
│       │   │   ├── RoommateRepository.java
│       │   │   ├── UserRepository.java
│       │   │   ├── WishlistRepository.java
│       │   │   └── dashboard/                     # NEW
│       │   │       ├── DashboardPropertyRepository.java
│       │   │       ├── DashboardUnitRepository.java
│       │   │       ├── DashboardLeaseRepository.java
│       │   │       ├── RentRecordRepository.java
│       │   │       ├── DashboardMaintenanceRepository.java
│       │   │       ├── DashboardExpenditureRepository.java
│       │   │       └── DashboardAnnouncementRepository.java
│       │   └── service/
│       │       ├── AuthService.java               # login, signup, setPassword, findByEmail
│       │       ├── DashboardService.java          # NEW — Full CRUD + stats aggregation + rent tracking
│       │       ├── ListingService.java            # CRUD + ownership checks
│       │       ├── OtpService.java                # DB-backed OTP store, 5-min TTL, used tracking
│       │       ├── SearchService.java             # Haversine sort + location text filter
│       │       ├── UserService.java               # Profile update
│       │       └── WishlistService.java           # Wishlist toggling and fetching
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               ├── V1__init_schema.sql
│               ├── V2__email_auth.sql
│               ├── V3__user_password.sql
│               ├── V4__add_advanced_listing_tables.sql
│               ├── V5__add_price_unit.sql
│               ├── V6__enable_postgis.sql
│               ├── V7__add_spatial_index.sql
│               ├── V8__add_otp_table.sql
│               ├── V9__add_wishlist_table.sql
│               └── V10__add_landlord_dashboard_tables.sql   # NEW — 7 dashboard tables
├── frontend/
│   ├── assets/style.css
│   ├── js/
│   │   ├── api.js               # Fetch wrapper, JWT injection, global 401 handler, onboarding guard
│   │   ├── auth.js              # loginWithPassword, requestSignupOtp, verifySignupOtp, forgotPassword, setPassword
│   │   ├── ui-common.js         # Navbar injection, mobile bottom nav, toast system, progress bar
│   │   ├── map.js               # Leaflet init, draggable marker, Nominatim geocoding, autocomplete
│   │   ├── browse-rental.js     # Rental search page: filters, radius slider, map toggle, results grid
│   │   ├── dashboard.js         # NEW — Fully functional landlord dashboard (API-connected)
│   │   ├── listing-detail.js    # Single listing view: images, amenities, roommate members, contact
│   │   ├── marketplace.js       # Marketplace search and card rendering
│   │   ├── post-listing.js      # Multi-step listing creation form, Cloudinary uploads, map picker
│   │   ├── profile.js           # Profile load/save, Cloudinary photo upload
│   │   ├── roommate-finder.js   # Roommate listings search and card rendering
│   │   ├── services.js          # Services listings search and card rendering
│   │   ├── wishlist.js          # Global heart toggling utility
│   │   └── wishlist-page.js     # Wishlist grid and comparison logic
│   ├── index.html               # Landing page (hero search, category links, featured listings)
│   ├── login.html
│   ├── signup.html
│   ├── forgot-password.html
│   ├── set-password.html
│   ├── profile.html
│   ├── browse-rental.html       # Full rental search with filters + map
│   ├── listing-detail.html      # Single listing detail view
│   ├── dashboard.html           # NEW — Fully functional landlord dashboard
│   ├── marketplace.html
│   ├── roommate-finder.html
│   ├── services.html
│   ├── wishlist.html            # Wishlist overview & comparison modal
│   └── vercel.json              # Vercel rewrites (all routes → index.html for SPA-style nav)
└── context.md                   # This file
```

---

## 🔑 Environment Variables

### Backend (set on Render)

| Variable | Default in `application.yml` | Notes |
|---|---|---|
| `DATABASE_URL` | Neon pooler connection string (hardcoded fallback) | JDBC URL with `sslmode=require` |
| `JWT_SECRET` | `rentnest-dev-secret-key-change-in-production-min-256-bits-long!!` | **Change in production** |
| `CORS_ORIGINS` | `localhost` variants + `tisamin.github.io` + `rent-nest-pi.vercel.app` | Comma-separated, no trailing slashes |

> ⚠ The Neon DB credentials are currently hardcoded in `application.yml` as the fallback. This is a security risk — they should be moved to the `DATABASE_URL` env var on Render and the hardcoded fallback stripped.

### Frontend (hardcoded in JS — no `.env`)

| Credential | Location | Value |
|---|---|---|
| Cloudinary cloud name | `post-listing.js`, `profile.js` | `du711ught` |
| Cloudinary upload preset | `post-listing.js`, `profile.js` | `bwuqyeyc` |
| EmailJS public key | `auth.js`, `profile.js` | `Novly2bnLjG0RR2ZE` |
| EmailJS service ID | `auth.js`, `profile.js` | `service_o9wjmag` |
| EmailJS template ID | `auth.js`, `profile.js` | `template_xrdy6ao` |

---

## 🗃️ Database Migrations (Flyway V1–V10)

| Version | File | What it does |
|---|---|---|
| V1 | `V1__init_schema.sql` | Creates `users`, `listings`, `roommate_listings`, `roommate_members` tables + basic indexes |
| V2 | `V2__email_auth.sql` | Switches primary auth from phone to email — drops NOT NULL on `phone_number`, adds UNIQUE on `email` |
| V3 | `V3__user_password.sql` | Adds `password_hash VARCHAR(255)` to `users` |
| V4 | `V4__add_advanced_listing_tables.sql` | Adds `residential_detail`, `room_detail`, `convention_detail`, `listing_amenity`, `service_offering` tables; renames `price` → `price_min`, adds `price_max`; adds `budget_min`/`budget_max` to `roommate_listings` |
| V5 | `V5__add_price_unit.sql` | Adds `price_unit VARCHAR(20)` to `listings` (default `'month'`) |
| V6 | `V6__enable_postgis.sql` | Enables PostGIS extension (`CREATE EXTENSION IF NOT EXISTS postgis`) |
| V7 | `V7__add_spatial_index.sql` | Adds functional GiST expression index on `(longitude, latitude)` to make `ST_DWithin` radius queries efficient |
| V8 | `V8__add_otp_table.sql` | Moves OTPs from in-memory to DB to survive Render restarts. Includes `used` boolean tracking |
| V9 | `V9__add_wishlist_table.sql` | Creates `wishlists` table (user-listing many-to-many link) for favorites and comparisons |
| V10 | `V10__add_landlord_dashboard_tables.sql` | Creates 7 internal landlord management tables: `dashboard_properties`, `dashboard_units`, `dashboard_leases`, `rent_records`, `dashboard_maintenance_requests`, `dashboard_expenditures`, `dashboard_announcements`. All cascade-delete from property downward. |
| V11 | `V11__add_reviews_reports_admin.sql` | Creates `reviews` and `reports` tables, and adds `is_banned` and `ban_reason` columns to the `users` table for ratings and moderation. |

---

## 🔌 API Endpoint Inventory

Base URL: `https://rent-nest-wntm.onrender.com/api`  
All responses follow `{ success, message, data }` envelope via `ApiResponse<T>`.

### Auth — `/api/auth/**` (public)

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| `POST` | `/auth/signup/request-otp` | `{ email }` | Returns OTP in response (client sends via EmailJS) |
| `POST` | `/auth/signup/verify-otp` | `{ email, otp }` | Registers user, returns `{ token, user }` |
| `POST` | `/auth/forgot-password/request-otp` | `{ email }` | Returns OTP in response |
| `POST` | `/auth/forgot-password/reset` | `{ email, otp, password }` | Resets password |
| `POST` | `/auth/set-password` | `{ password }` | 🔒 Auth required. Mandatory post-signup step |
| `GET` | `/auth/me` | — | 🔒 Returns current authenticated user |

### Listings — `/api/listings/**`

| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/listings` | `ListingRequest` | 🔒 Create listing |
| `GET` | `/listings/{id}` | — | Public. Get single listing |
| `PUT` | `/listings/{id}` | `ListingRequest` | 🔒 Update (owner only) |
| `DELETE` | `/listings/{id}` | — | 🔒 Delete (owner only) |
| `GET` | `/listings/my` | — | 🔒 Get all listings for current user |

### Search — `/api/search/**` (all public)

| Method | Path | Params | Notes |
|---|---|---|---|
| `GET` | `/search/rental` | `location`, `category`, `lat`, `lng`, `radius` | Radius (metres) triggers PostGIS `ST_DWithin` + Haversine sort |
| `GET` | `/search/marketplace` | `item` | Text search on title/description |
| `GET` | `/search/roommate` | `area` | Text search on location_text |
| `GET` | `/search/services` | `location`, `category` | Text search on location_text |
| `GET` | `/search/locations` | `query` | Location autocomplete suggestions |

### Users — `/api/users/**`

| Method | Path | Body | Notes |
|---|---|---|---|
| `PUT` | `/users/profile` | `{ name, email, address, profilePhotoUrl }` | 🔒 Update profile |

### Wishlist — `/api/wishlist`

| Method | Path | Body | Notes |
|---|---|---|---|
| `GET` | `/wishlist` | — | 🔒 Get all wishlisted listings for current user |
| `POST` | `/wishlist/toggle/{id}` | — | 🔒 Toggle wishlist status for a listing |
| `POST` | `/wishlist/check` | `[UUID, ...]` | 🔒 Check which of provided listing IDs are wishlisted |

### Dashboard — `/api/dashboard/**` 🔒 (all require JWT) — NEW

| Method | Path | Body / Params | Notes |
|---|---|---|---|
| `GET` | `/dashboard/stats` | — | Net earnings, occupancy rate, active tenants, open maintenance count |
| `GET` | `/dashboard/chart` | — | Monthly rent vs fees vs net profit data for Recharts |
| `GET` | `/dashboard/properties` | — | All properties for current user |
| `POST` | `/dashboard/properties` | `{ name, location, type }` | Create property |
| `PUT` | `/dashboard/properties/{id}` | `{ name, location, type }` | Update property |
| `DELETE` | `/dashboard/properties/{id}` | — | Cascade-delete property and all children |
| `GET` | `/dashboard/units` | — | All units across all properties for current user |
| `GET` | `/dashboard/units/by-property/{propertyId}` | — | Units for a specific property |
| `POST` | `/dashboard/units` | `{ propertyId, name, rentAmount, rentPeriod, collectionDay }` | Create unit |
| `PUT` | `/dashboard/units/{id}` | same fields | Update unit |
| `DELETE` | `/dashboard/units/{id}` | — | Delete unit |
| `GET` | `/dashboard/leases` | — | All leases (enriched with propertyName, unitName, due records, rentStatus) |
| `POST` | `/dashboard/leases` | `{ unitId, tenantName, whatsappNumber, startDate }` | Assign tenant; marks unit as occupied |
| `PUT` | `/dashboard/leases/{id}` | `{ tenantName, whatsappNumber, startDate }` | Update tenant info |
| `DELETE` | `/dashboard/leases/{id}` | — | End lease; marks unit as vacant |
| `GET` | `/dashboard/rent-records?leaseId=` | — | Rent records for a specific lease |
| `POST` | `/dashboard/rent-records` | `{ leaseId, periodLabel, amount }` | Issue a DUE rent record (e.g. "July 2026") |
| `POST` | `/dashboard/rent-records/{id}/pay` | — | Mark a DUE record as PAID (sets paidAt timestamp) |
| `GET` | `/dashboard/maintenance` | — | All maintenance requests (enriched with unitName, propertyName) |
| `POST` | `/dashboard/maintenance` | `{ title, description, unitId, priority, cost }` | Create request |
| `PUT` | `/dashboard/maintenance/{id}` | same fields | Update request details |
| `PUT` | `/dashboard/maintenance/{id}/status` | `{ status }` | Move Kanban column (OPEN / IN_PROGRESS / RESOLVED) |
| `DELETE` | `/dashboard/maintenance/{id}` | — | Delete request |
| `GET` | `/dashboard/expenditures` | — | All personal expenditure logs |
| `POST` | `/dashboard/expenditures` | `{ name, cost }` | Log an expense |
| `PUT` | `/dashboard/expenditures/{id}` | `{ name, cost }` | Update expense |
| `DELETE` | `/dashboard/expenditures/{id}` | — | Delete expense |
| `GET` | `/dashboard/announcements` | — | All reminder notes |
| `POST` | `/dashboard/announcements` | `{ text }` | Create reminder |
| `DELETE` | `/dashboard/announcements/{id}` | — | Delete reminder |

---

## ✅ What's Built

- Full auth flow: signup via OTP → set password → profile setup (onboarding guard enforced)
- Listing CRUD with category-specific sub-data (residential, convention, roommate, service offerings)
- Multi-image Cloudinary upload on listing creation and profile photo
- Leaflet map with Nominatim geocoding on listing creation
- Browse/search page with radius filter, category tabs, map toggle
- Listing detail page (images, amenities, roommate members, service offerings, contact)
- **Wishlist & Comparison System**: Global saving of any listing type, side-by-side comparison modal enforcing category-specific rules
- Marketplace, Services, Roommate Finder listing/search pages
- **Fully functional Landlord Dashboard** (replaced mock UI):
  - **First-time onboarding wizard**: 3-step setup to add property → define units → assign tenants
  - **Overview tab**: 4 live stat cards (net earnings, active tenants, open maintenance, occupancy rate) + Recharts financial chart (rent vs fees vs net profit)
  - **Properties & Leases tab**: Collapsible property cards listing all units with Assign Tenant / Occupied status; Active leases table with WhatsApp chat link, rent status badge, Collect Rent button, Issue DUE button
  - **Maintenance Kanban**: Drag-and-drop cards across OPEN / IN_PROGRESS / RESOLVED columns; priority colour coding; status updates via API
  - **Expenditures tab**: Log/edit/delete personal property expenses
  - **Reminders tab**: Sticky-note style announcements/reminders

---

## ❌ What's NOT Built Yet (Roadmap Gaps)

| Feature | Notes |
|---|---|
| **Messaging / Enquiry system** | No way for a prospective tenant to contact a landlord in-app. Currently just shows a phone number |
| **Booking / Rental requests** | No booking flow, availability calendar, or request-to-rent mechanism |
| **Listing edit UI** | `PUT /listings/{id}` exists in the backend but there is no `edit-listing.html` page on the frontend |
| **Listing deactivation / soft delete toggle** | `is_active` column exists in DB but the UI has no toggle; `DELETE` fully removes the record |
| **Notifications** | No push notifications, email alerts for new enquiries, or in-app notification centre |
| **Notifications** | No push notifications, email alerts for new enquiries, or in-app notification centre |
| **Pagination** | All search endpoints return all results. No pagination or infinite scroll |
| **Search: price range filter** | `price_min`/`price_max` exist in DB but the browse page budget filter is not wired to the API |

---

## 🔴 Currently Broken / Blocked

| Issue | Detail |
|---|---|
| **EmailJS domain restrictions** | Must be manually set in the EmailJS dashboard (allowed origins + reCAPTCHA on template). Until done, the public key is unprotected |
| **DB credentials in application.yml** | Neon password is in the fallback connection string. Should be env var only |
