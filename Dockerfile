# ==========================================
# STAGE 1: Build Stage
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# chromedriver postinstall descarga binarios de internet; no se usa en el build de producción.
ENV CHROMEDRIVER_SKIP_DOWNLOAD=true

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments para configuración dinámica (no se incluyen valores por defecto
# para evitar exponer URLs o claves sensibles en la imagen)
ARG VITE_GATEWAY_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Do NOT bake sensitive keys into the image. Runtime injection will provide
# the real `VITE_...` values via environment variables (Dokploy / Dokku / CI).
# If you need build-time defaults for non-sensitive values, pass them as
# build-args and handle them explicitly here. By default we keep the build
# stage free of secrets so the same image can be reused across environments.

# Build the application
RUN npm run build

# ==========================================
# STAGE 2: Runtime Stage with Nginx
# ==========================================
FROM nginx:1.27-alpine

# Install envsubst for runtime config generation
RUN apk add --no-cache gettext

# Note: Sensitive environment variables (Supabase keys) are NOT stored in the image.
# They will be injected at runtime via docker run -e or ENV in container orchestration.
# This eliminates security warnings and follows Docker best practices for secrets management.

# Add metadata
LABEL maintainer="Valle Grande"
LABEL description="SIPREB Web Frontend - React + Vite + Tailwind"
LABEL version="1.0.0"

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime config template and startup script
COPY docker/config.template.js /opt/config.template.js
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a non-root user for nginx
RUN addgroup -S nginx-custom && \
    adduser -S -D -H -h /var/cache/nginx -s /sbin/nologin -G nginx-custom -g nginx-custom nginx-custom && \
  chmod +x /docker-entrypoint.d/40-runtime-config.sh && \
    chown -R nginx-custom:nginx-custom /usr/share/nginx/html && \
    chown -R nginx-custom:nginx-custom /var/cache/nginx && \
    chown -R nginx-custom:nginx-custom /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 9191

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
