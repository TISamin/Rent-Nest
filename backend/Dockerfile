# ============================================
# Stage 1: Build the application with Maven
# ============================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy only the POM first to leverage Docker layer caching.
# Dependencies are downloaded once and cached — only re-downloaded
# when pom.xml changes, NOT when source code changes.
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Now copy source code and build the JAR (skip tests — CI runs them separately)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ============================================
# Stage 2: Create the lightweight runtime image
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create a non-root user for security (never run containers as root in production)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy the built JAR from the build stage
COPY --from=build /app/target/rentnest-backend-0.0.1-SNAPSHOT.jar app.jar

# Change ownership to the non-root user
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose the port Spring Boot listens on
EXPOSE 8080

# Health check: Docker/Compose will ping this endpoint to know if the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/auth/me || exit 1

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
