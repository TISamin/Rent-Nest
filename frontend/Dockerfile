# ============================================
# Frontend: Serve static files with Nginx
# ============================================
# No build step needed — the frontend is plain HTML/CSS/JS.
# We just copy everything into Nginx's default serving directory.

FROM nginx:1.27-alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all frontend files (HTML, CSS, JS, assets)
COPY . /usr/share/nginx/html/

# Expose port 80 (standard HTTP)
EXPOSE 80

# Health check for the frontend container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Nginx runs in the foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]
