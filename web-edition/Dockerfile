# PhotoPackager Web Edition - Production Docker Image
# MIT License - Open Source Photo Processing Tool

# Use official nginx alpine image for lightweight production
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy all static files (HTML, CSS, JS)
COPY index.html ./
COPY privacy-policy.html ./
COPY terms-of-service.html ./
COPY LICENSE ./
COPY assets/ ./assets/
COPY src/ ./src/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S photopackager && \
    adduser -S photopackager -u 1001 -G photopackager

# Set proper permissions for nginx directories
RUN chown -R photopackager:photopackager /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R photopackager:photopackager /var/run/nginx.pid && \
    chown -R photopackager:photopackager /var/cache/nginx && \
    chown -R photopackager:photopackager /var/log/nginx

# Switch to non-root user
USER photopackager

# Expose port 8080 (Railway and other free hosts prefer this)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]