# RentNest

RentNest is a comprehensive platform designed to streamline the process of finding rentals, services, and roommates. It features a modern, dynamic user interface with a robust backend to handle real estate listings, marketplace items, shifting and cleaning services, roommate matching, and a full-fledged landlord management dashboard.

## 🌐 Live Demos
- **Frontend App:** [https://rent-nest-pi.vercel.app](https://rent-nest-pi.vercel.app)
- **Backend API:** [https://rent-nest-wntm.onrender.com](https://rent-nest-wntm.onrender.com)

## 🚀 Key Features

### User Experience
- **Rentals & Properties**: Find flats, houses, convention halls, and hotels with advanced filtering and radius-based map searches.
- **Marketplace & Services**: Buy and sell items, or discover maintenance, catering, cleaning, event planning, decoration, and shifting services.
- **Roommate Finder**: Connect with potential roommates and view detailed profiles of existing members (including photos and bios).
- **Wishlist & Comparison**: Save listings across any category and compare them side-by-side.
- **Listing Creation**: Multi-step, dynamic forms for posting listings. Includes interactive map picking, and multi-image uploads.
- **Marketplace Trust**: Escrow-based payment system logic and built-in Terms & Conditions enforcing platform rules.

### Landlord Dashboard
- **Property & Lease Management**: Organize properties, units, and assign tenants with ease.
- **Financial Tracking**: Generate rent records, collect rent, and log property expenditures.
- **Maintenance Kanban**: Drag-and-drop maintenance requests across statuses (Open, In Progress, Resolved).
- **Analytics**: Live overview of net earnings, occupancy rate, and active tenants with interactive financial charts.

### Technical Highlights
- **Robust Authentication**: Secure login and sign-up flows with DB-backed OTP password resets, and stateless JWT sessions.
- **Spatial Queries**: Integrated with Leaflet.js, OpenStreetMap Nominatim, and PostgreSQL/PostGIS (`ST_DWithin`) for location-aware searches.
- **Asset Management**: Integrated with Cloudinary for seamless, direct-to-CDN image uploads.

## 🛠️ Tech Stack

**Frontend:**
- Static HTML5 + Vanilla JS (No framework, SPA-style routing via Vercel)
- Tailwind CSS
- Leaflet.js & OSM Nominatim (Maps & Geocoding)
- EmailJS (Client-side OTP delivery)
- Cloudinary (Image uploads)
- React & Recharts (Used exclusively for dashboard charts)

**Backend:**
- Java 17 & Spring Boot 3.3.6
- Spring Security 6 & JJWT (Stateless JWT Auth)
- PostgreSQL (on Neon) with PostGIS extension
- Flyway Database Migrations

## 👥 Team Members

This project was developed collaboratively by our dedicated team:

- **Tahmid Islam Samin** (Lead Full-Stack Developer)
  - Coordinated the overall project architecture, driving the integration between frontend and backend systems while contributing to core development and Guided the project lifecycle.
  - Email: [u2304100@student.cuet.ac.bd](mailto:u2304100@student.cuet.ac.bd)
  - Github: [https://github.com/TISamin](https://github.com/TISamin)

- **Sayed Mohammed Asim** (Backend Developer & Database Administrator)
  - Managed backend integrations, API optimizations, and database structuring.
  - Email: [u2304102@student.cuet.ac.bd](mailto:u2304102@student.cuet.ac.bd)
  - Github: [https://github.com/smasim825](https://github.com/smasim825)

- **Sabira Tanzeem Saara** (Frontend Developer & UI/UX Designer)
  - Focused on the user interface, styling components, and ensuring a smooth user experience.
  - Email: [u2304103@student.cuet.ac.bd](mailto:u2304103@student.cuet.ac.bd)
  - Github: [https://github.com/ssaaraa23](https://github.com/ssaaraa23)

- **Shrabonti Paul** (Quality Assurance & Documentation Specialist)
  - Handled testing, bug tracking, and comprehensive project documentation.
  - Email: [u2304101@student.cuet.ac.bd](mailto:u2304101@student.cuet.ac.bd)

## 💻 Getting Started (Local Development)

### Backend Setup
1. Ensure Java 17 and Maven are installed.
2. The database connection is currently pointing to a remote Neon PostgreSQL instance via `application.yml`.
3. Run the Spring Boot application from the `backend/` directory:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080`.

### Frontend Setup
1. The frontend relies on static HTML/JS and doesn't require a build process.
2. Serve the `frontend/` directory using any local web server. For example, using Python:
   ```bash
   cd frontend
   python -m http.server 3000
   ```
3. Open `http://localhost:3000` in your browser. The `api.js` script will automatically detect `localhost` and route API calls to `http://localhost:8080`.
