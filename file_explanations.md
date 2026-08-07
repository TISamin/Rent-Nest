# Rent-Nest — Simple File Explanations

A simple, plain-English summary of what each file in the project does.

---

## 📁 Root & Docs

* **[.gitignore](file:///d:/Projects/Rent-Nest/.gitignore)**: Tells Git which temporary files and folders to ignore.
* **[README.md](file:///d:/Projects/Rent-Nest/README.md)**: Main project guide explaining features, tech stack, and setup steps.
* **[context.md](file:///d:/Projects/Rent-Nest/context.md)**: Technical cheat-sheet with live website links and backend setup details.
* **[setup_blueprint.md](file:///d:/Projects/Rent-Nest/setup_blueprint.md)**: Complete system design doc detailing databases, APIs, and security rules.
* **[presentation.html](file:///d:/Projects/Rent-Nest/presentation.html)**: Interactive presentation slides showcasing the project.

---

## ⚙️ Backend Settings & Build (`backend/`)

* **[backend/Dockerfile](file:///d:/Projects/Rent-Nest/backend/Dockerfile)**: Packages the backend app so it can run online (Render).
* **[backend/pom.xml](file:///d:/Projects/Rent-Nest/backend/pom.xml)**: List of backend Java libraries and tools used.
* **[backend/TestRegex.java](file:///d:/Projects/Rent-Nest/backend/TestRegex.java)**: Small test script for testing text patterns.
* **[backend/src/main/resources/application.yml](file:///d:/Projects/Rent-Nest/backend/src/main/resources/application.yml)**: Backend settings file (database password, secret keys, AI keys).

---

## 🗄️ Database Setup Files (`backend/src/main/resources/db/migration/`)

* **[V1__init_schema.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V1__init_schema.sql)**: Creates basic database tables for users and listings.
* **[V2__email_auth.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V2__email_auth.sql)**: Adds email login support.
* **[V3__user_password.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V3__user_password.sql)**: Adds password field for user accounts.
* **[V4__add_advanced_listing_tables.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V4__add_advanced_listing_tables.sql)**: Adds extra tables for flats, rooms, and service details.
* **[V5__add_price_unit.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V5__add_price_unit.sql)**: Adds pricing choices (e.g. per night, per month).
* **[V6__enable_postgis.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V6__enable_postgis.sql)**: Enables map location features in PostgreSQL database.
* **[V7__add_spatial_index.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V7__add_spatial_index.sql)**: Makes location-based map searches faster.
* **[V8__add_otp_table.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V8__add_otp_table.sql)**: Creates a table to store temporary email verification codes (OTPs).
* **[V9__add_wishlist_table.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V9__add_wishlist_table.sql)**: Creates a table for users' saved favorite listings.
* **[V10__add_landlord_dashboard_tables.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V10__add_landlord_dashboard_tables.sql)**: Creates landlord tables (units, rent payments, repairs, expenses).
* **[V11__add_reviews_reports_admin.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V11__add_reviews_reports_admin.sql)**: Adds tables for user reviews, report tickets, and admin permissions.
* **[V12__add_marketplace_escrow.sql](file:///d:/Projects/Rent-Nest/backend/src/main/resources/db/migration/V12__add_marketplace_escrow.sql)**: Adds table for safe marketplace payments (escrow).

---

## ☕ Backend Logic (`backend/src/main/java/com/rentnest/`)

### Main App
* **[RentNestApplication.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/RentNestApplication.java)**: Main file that starts the backend app.

### Security & Tokens (`config/`)
* **[JwtAuthenticationFilter.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/config/JwtAuthenticationFilter.java)**: Checks login tokens on incoming web requests.
* **[JwtTokenProvider.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/config/JwtTokenProvider.java)**: Generates and verifies login tokens.
* **[SecurityConfig.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/config/SecurityConfig.java)**: Sets security rules for public vs private pages.

### Backend Endpoints / Routes (`controller/`)
* **[AdminController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/AdminController.java)**: Admin routes to manage users, ban accounts, and review reports.
* **[AiController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/AiController.java)**: Routes for AI smart search and automated description generator.
* **[AuthController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/AuthController.java)**: Routes for login, signup, OTP codes, and password resets.
* **[DashboardController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/DashboardController.java)**: Landlord routes for managing rental properties, tenants, and repair tickets.
* **[ListingController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/ListingController.java)**: Routes to add, view, update, or delete property listings.
* **[MarketplaceEscrowController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/MarketplaceEscrowController.java)**: Routes for marketplace purchases and safe held payments.
* **[PingController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/PingController.java)**: Quick test route to check if the backend is running.
* **[ReportController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/ReportController.java)**: Route for users to report bad posts or users.
* **[ReviewController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/ReviewController.java)**: Routes to leave star ratings and comments.
* **[SearchController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/SearchController.java)**: Routes for location and map search queries.
* **[UserController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/UserController.java)**: Routes to view and update user profile info.
* **[WishlistController.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/controller/WishlistController.java)**: Routes to save and fetch favorite listings.

### Data Templates (`dto/`)
* **[AdminStatsResponse.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/AdminStatsResponse.java)**: Data format for summary stats shown to admins.
* **[ApiResponse.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ApiResponse.java)**: Standard wrapper for all backend responses (status + data + message).
* **[BanRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/BanRequest.java)**: Data format for banning/unbanning a user.
* **[ListingRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ListingRequest.java)**: Data format sent when creating a new listing.
* **[ListingResponse.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ListingResponse.java)**: Data format sent to frontend when viewing listings.
* **[PublicUserProfileDTO.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/PublicUserProfileDTO.java)**: Public user info (name, photo) without private details.
* **[ReportRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ReportRequest.java)**: Data format sent when submitting a report ticket.
* **[ReviewRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ReviewRequest.java)**: Data format for submitting a review rating.
* **[ReviewResponse.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/ReviewResponse.java)**: Data format sent when displaying reviews.
* **[SearchRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/SearchRequest.java)**: Search options sent from frontend (location, price range, category).
* **[UserProfileDTO.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/dto/UserProfileDTO.java)**: Private profile data format for account settings.

### Error Handling (`exception/`)
* **[AiProviderException.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/exception/AiProviderException.java)**: Handles errors when AI services fail.
* **[GlobalExceptionHandler.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/exception/GlobalExceptionHandler.java)**: Converts server errors into clean error messages for the frontend.
* **[ResourceNotFoundException.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/exception/ResourceNotFoundException.java)**: Handles missing data errors (e.g. listing not found).

### Database Data Models (`model/`)
* **[ConventionDetail.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/ConventionDetail.java)**: Hall capacity and catering info for convention hall listings.
* **[Listing.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/Listing.java)**: Main database model for all property posts.
* **[ListingAmenity.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/ListingAmenity.java)**: Feature tags (WiFi, Parking, AC) linked to posts.
* **[MarketplaceEscrow.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/MarketplaceEscrow.java)**: Marketplace payment model for held funds.
* **[OtpToken.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/OtpToken.java)**: Database model for verification codes.
* **[Report.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/Report.java)**: Database model for user/listing reports.
* **[ResidentialDetail.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/ResidentialDetail.java)**: Bedroom, bathroom, and floor area details for home rentals.
* **[Review.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/Review.java)**: Star ratings and comments saved in DB.
* **[RoomDetail.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/RoomDetail.java)**: Room photos and descriptions for rental posts.
* **[RoommateListing.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/RoommateListing.java)**: Extra info for roommate search posts.
* **[RoommateMember.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/RoommateMember.java)**: Profiles (photos + bio) of current roommates.
* **[ServiceOffering.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/ServiceOffering.java)**: Pricing items for home service posts (cleaning, repair).
* **[User.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/User.java)**: Database model for user accounts.
* **[Wishlist.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/Wishlist.java)**: Saved bookmarks database model.
* **[enums/ListingCategory.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/enums/ListingCategory.java)**: List of post categories (FLAT, HOUSE, ROOMMATE, MARKETPLACE, SERVICES).
* **[enums/MarketplaceEscrowStatus.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/enums/MarketplaceEscrowStatus.java)**: List of payment stages (INITIATED, FUNDED, DELIVERED, RELEASED).
* **[enums/UserRole.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/enums/UserRole.java)**: User types (ROLE_USER, ROLE_ADMIN).

#### Landlord Dashboard Models (`model/dashboard/`)
* **[DashboardAnnouncement.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardAnnouncement.java)**: Landlord notes and announcements.
* **[DashboardExpenditure.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardExpenditure.java)**: Landlord expense logs.
* **[DashboardLease.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardLease.java)**: Tenant rental contracts.
* **[DashboardMaintenanceRequest.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardMaintenanceRequest.java)**: Repair tickets submitted by tenants.
* **[DashboardProperty.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardProperty.java)**: Rental building/property assets.
* **[DashboardUnit.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/DashboardUnit.java)**: Individual flats or rooms inside a building.
* **[RentRecord.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/model/dashboard/RentRecord.java)**: Monthly rent payment records.

### Database Query Files (`repository/`)
* **[ListingRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/ListingRepository.java)**: Database queries for listings and nearby map searches.
* **[MarketplaceEscrowRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/MarketplaceEscrowRepository.java)**: Database queries for escrow orders.
* **[OtpTokenRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/OtpTokenRepository.java)**: Database queries to check and clean OTP verification codes.
* **[ReportRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/ReportRepository.java)**: Database queries for user reports.
* **[ReviewRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/ReviewRepository.java)**: Database queries to calculate star rating averages.
* **[RoommateRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/RoommateRepository.java)**: Database queries for roommate listings.
* **[UserRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/UserRepository.java)**: Database queries for finding users by email or phone.
* **[WishlistRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/WishlistRepository.java)**: Database queries for user saved favorites.
* **[dashboard/DashboardAnnouncementRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardAnnouncementRepository.java)**: DB queries for landlord notes.
* **[dashboard/DashboardExpenditureRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardExpenditureRepository.java)**: DB queries for landlord expenses.
* **[dashboard/DashboardLeaseRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardLeaseRepository.java)**: DB queries for active tenant leases.
* **[dashboard/DashboardMaintenanceRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardMaintenanceRepository.java)**: DB queries for repair tickets.
* **[dashboard/DashboardPropertyRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardPropertyRepository.java)**: DB queries for landlord properties.
* **[dashboard/DashboardUnitRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/DashboardUnitRepository.java)**: DB queries for rental units.
* **[dashboard/RentRecordRepository.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/repository/dashboard/RentRecordRepository.java)**: DB queries for rent payment ledgers.

### Business Logic Services (`service/`)
* **[AdminService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/AdminService.java)**: Handles admin tasks like banning users and calculating total site stats.
* **[AiProvider.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/AiProvider.java)**: Interface defining what AI tools can do.
* **[AiTextService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/AiTextService.java)**: Manages AI requests and switches between Gemini and Groq if one fails.
* **[AuthService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/AuthService.java)**: Handles user signup, password security, and login validation.
* **[DashboardService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/DashboardService.java)**: Handles landlord property management, rent collections, and income calculations.
* **[GeminiProvider.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/GeminiProvider.java)**: Connects to Google Gemini API for AI features.
* **[GroqProvider.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/GroqProvider.java)**: Connects to Groq (Llama 3) API as a fallback AI.
* **[ListingService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/ListingService.java)**: Manages post creation, editing permissions, and post details.
* **[MarketplaceEscrowService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/MarketplaceEscrowService.java)**: Manages marketplace payment steps (holding and releasing funds).
* **[OtpService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/OtpService.java)**: Generates 6-digit email code and deletes expired codes after 5 minutes.
* **[ReportService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/ReportService.java)**: Processes report submissions and sends them to admins.
* **[ReviewService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/ReviewService.java)**: Calculates average ratings and saves user reviews.
* **[SearchService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/SearchService.java)**: Handles search filters and distance-based property searches.
* **[UserService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/UserService.java)**: Updates user profiles and checks if setup is complete.
* **[WishlistService.java](file:///d:/Projects/Rent-Nest/backend/src/main/java/com/rentnest/service/WishlistService.java)**: Saves and removes items from user favorite lists.

---

## 🎨 Frontend Website Files (`frontend/`)

### Web Pages (HTML)
* **[frontend/index.html](file:///d:/Projects/Rent-Nest/frontend/index.html)**: Main home page with AI search, category shortcuts, and featured rentals.
* **[frontend/admin.html](file:///d:/Projects/Rent-Nest/frontend/admin.html)**: Admin dashboard page to manage users and report tickets.
* **[frontend/banned.html](file:///d:/Projects/Rent-Nest/frontend/banned.html)**: Page shown to banned users if they try to access the site.
* **[frontend/browse-rental.html](file:///d:/Projects/Rent-Nest/frontend/browse-rental.html)**: Search page to browse rentals on an interactive map.
* **[frontend/dashboard.html](file:///d:/Projects/Rent-Nest/frontend/dashboard.html)**: Landlord portal for tracking properties, rent, and repair requests.
* **[frontend/forgot-password.html](file:///d:/Projects/Rent-Nest/frontend/forgot-password.html)**: Password recovery page with email verification.
* **[frontend/listing-detail.html](file:///d:/Projects/Rent-Nest/frontend/listing-detail.html)**: Page displaying details, photos, location map, and reviews of a post.
* **[frontend/login.html](file:///d:/Projects/Rent-Nest/frontend/login.html)**: User sign-in page.
* **[frontend/marketplace.html](file:///d:/Projects/Rent-Nest/frontend/marketplace.html)**: Marketplace page to buy and sell second-hand items.
* **[frontend/marketplace-activity.html](file:///d:/Projects/Rent-Nest/frontend/marketplace-activity.html)**: Page to track marketplace orders and escrow payment status.
* **[frontend/post-listing.html](file:///d:/Projects/Rent-Nest/frontend/post-listing.html)**: Step-by-step form to create and post new listings with photo uploads.
* **[frontend/profile.html](file:///d:/Projects/Rent-Nest/frontend/profile.html)**: User settings page to update profile info and picture.
* **[frontend/public-profile.html](file:///d:/Projects/Rent-Nest/frontend/public-profile.html)**: Public profile page showing user info, listings, and reviews.
* **[frontend/roommate-finder.html](file:///d:/Projects/Rent-Nest/frontend/roommate-finder.html)**: Search page to find roommates and view member bios.
* **[frontend/services.html](file:///d:/Projects/Rent-Nest/frontend/services.html)**: Home services page (cleaning, repair, packing).
* **[frontend/set-password.html](file:///d:/Projects/Rent-Nest/frontend/set-password.html)**: First-time setup page for new users to set a password.
* **[frontend/signup.html](file:///d:/Projects/Rent-Nest/frontend/signup.html)**: User registration page with email code verification.
* **[frontend/wishlist.html](file:///d:/Projects/Rent-Nest/frontend/wishlist.html)**: Page for saved favorite listings and side-by-side comparison.

### Styles & Hosting Config
* **[frontend/assets/style.css](file:///d:/Projects/Rent-Nest/frontend/assets/style.css)**: Global CSS file for custom colors, animations, and dark mode rules.
* **[frontend/vercel.json](file:///d:/Projects/Rent-Nest/frontend/vercel.json)**: Web hosting config for Vercel deployment.

### Frontend JavaScript (`frontend/js/`)
* **[frontend/js/api.js](file:///d:/Projects/Rent-Nest/frontend/js/api.js)**: Connects frontend to backend API, manages login tokens, and handles error redirects.
* **[frontend/js/admin.js](file:///d:/Projects/Rent-Nest/frontend/js/admin.js)**: Runs admin page features (banning users, viewing reports).
* **[frontend/js/auth.js](file:///d:/Projects/Rent-Nest/frontend/js/auth.js)**: Runs login, signup, OTP codes, and password reset logic.
* **[frontend/js/browse-rental.js](file:///d:/Projects/Rent-Nest/frontend/js/browse-rental.js)**: Runs rental search filters and map pin updates.
* **[frontend/js/dashboard.js](file:///d:/Projects/Rent-Nest/frontend/js/dashboard.js)**: Runs landlord dashboard features (property editing, rent status, repair Kanban board).
* **[frontend/js/listing-detail.js](file:///d:/Projects/Rent-Nest/frontend/js/listing-detail.js)**: Loads post details, photo sliders, map view, and review submission.
* **[frontend/js/map.js](file:///d:/Projects/Rent-Nest/frontend/js/map.js)**: Handles Leaflet interactive map setup and location auto-complete.
* **[frontend/js/marketplace.js](file:///d:/Projects/Rent-Nest/frontend/js/marketplace.js)**: Runs marketplace search and item buying.
* **[frontend/js/marketplace-activity.js](file:///d:/Projects/Rent-Nest/frontend/js/marketplace-activity.js)**: Handles payment steps (confirm delivery, release funds).
* **[frontend/js/post-listing.js](file:///d:/Projects/Rent-Nest/frontend/js/post-listing.js)**: Controls the post creation form, map pin selection, and image uploading.
* **[frontend/js/profile.js](file:///d:/Projects/Rent-Nest/frontend/js/profile.js)**: Handles profile updates and picture uploads.
* **[frontend/js/roommate-finder.js](file:///d:/Projects/Rent-Nest/frontend/js/roommate-finder.js)**: Runs roommate search and member profile cards.
* **[frontend/js/services.js](file:///d:/Projects/Rent-Nest/frontend/js/services.js)**: Loads home service listings and price lists.
* **[frontend/js/ui-common.js](file:///d:/Projects/Rent-Nest/frontend/js/ui-common.js)**: Renders header navigation bar, mobile menu, toast notifications, and dark mode toggle across all pages.
* **[frontend/js/wishlist-page.js](file:///d:/Projects/Rent-Nest/frontend/js/wishlist-page.js)**: Loads saved favorite listings and side-by-side comparison modal.
* **[frontend/js/wishlist.js](file:///d:/Projects/Rent-Nest/frontend/js/wishlist.js)**: Utility to toggle the heart bookmark button on listing cards.
