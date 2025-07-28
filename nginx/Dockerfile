# Use a more recent stable NGINX version.
# We're using the 'stable-alpine' variant for a smaller image size.
FROM nginx:1.25-alpine

# Set the working directory inside the container
WORKDIR /etc/nginx

# Remove the default NGINX configuration file.
# This ensures our custom configuration is the only one used.
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our custom NGINX configuration file.
# This should be carefully reviewed and secured.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a non-root user and group for NGINX to run as.
# This is a security best practice to limit potential damage if the process is compromised.
# 'nginx' user and group are typically pre-created in Alpine images, but we ensure proper ownership.
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx

# The NGINX official images often handle this, but it's good to explicitly set.
# This tells NGINX to run as the 'nginx' user (which is non-root).
USER nginx

# Expose port 80 (HTTP) and 443 (HTTPS) if you plan to add SSL/TLS later.
# This indicates which ports the container will listen on.
EXPOSE 8080 443

# Start NGINX in the foreground.
# This is crucial for Docker containers, as a container exits when its main process exits.
CMD ["nginx", "-g", "daemon off;"]