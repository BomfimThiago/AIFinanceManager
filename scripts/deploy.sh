#!/bin/bash
set -e

# Konta Production Deployment Script
# Run this on the Lightsail server after cloning the repository

APP_DIR="/opt/konta"
DOMAIN="api.getkonta.app"
EMAIL="${1:-admin@getkonta.app}"

echo "=========================================="
echo "Konta Production Deployment"
echo "=========================================="

# Check if running as ubuntu user
if [ "$(whoami)" != "ubuntu" ]; then
    echo "Error: Please run as ubuntu user"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Wait for instance initialization or check cloud-init logs."
    exit 1
fi

cd "$APP_DIR"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "Error: .env.production file not found"
    echo "Please create .env.production with your configuration"
    exit 1
fi

# Create required directories
mkdir -p certbot/www certbot/conf nginx/ssl

# Copy initial nginx config (no SSL yet)
cp nginx/nginx.initial.conf nginx/nginx.conf.tmp
mv nginx/nginx.conf nginx/nginx.ssl.conf
mv nginx/nginx.conf.tmp nginx/nginx.conf

echo "Step 1: Building and starting containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build api nginx

echo "Step 2: Waiting for services to start..."
sleep 10

# Check if API is healthy
echo "Step 3: Checking API health..."
if curl -s http://localhost:8003/health > /dev/null; then
    echo "API is healthy!"
else
    echo "Warning: API health check failed. Check logs with: docker compose -f docker-compose.prod.yml logs api"
fi

echo "Step 4: Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T api alembic upgrade head

echo "Step 5: Obtaining SSL certificate..."
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

echo "Step 6: Switching to SSL nginx config..."
mv nginx/nginx.conf nginx/nginx.initial.conf
mv nginx/nginx.ssl.conf nginx/nginx.conf

echo "Step 7: Restarting nginx with SSL..."
docker compose -f docker-compose.prod.yml --env-file .env.production restart nginx

echo "Step 8: Starting certbot renewal service..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d certbot

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "API URL: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  Update:        git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
