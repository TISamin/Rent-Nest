# 🏠 RentNest

A full-stack rental and services listing web application built with **Spring Boot** and **vanilla HTML/CSS/JS**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Java 17, Spring Boot 3.x, Spring Security |
| Database | PostgreSQL (Neon), JPA/Hibernate, Flyway |
| Auth | Firebase Authentication (SMS OTP) |
| Maps | Leaflet.js + OpenStreetMap |
| Storage | Firebase Storage |
| Email | EmailJS |

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+
- PostgreSQL (or Neon account)
- Firebase project with Phone Auth enabled

### Backend
```bash
cd backend
# Set environment variables (see .env.example)
mvn spring-boot:run
```

### Frontend
Open `frontend/index.html` in a browser, or serve with any static file server.

## Project Structure
```
Rent-Nest/
├── frontend/          # Vanilla HTML/CSS/JS
│   ├── index.html     # Landing page
│   ├── login.html     # OTP login
│   ├── profile.html   # User profile
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript modules
│   └── assets/        # Images & static assets
└── backend/           # Spring Boot application
    └── src/main/java/com/rentnest/
```

## License
MIT
