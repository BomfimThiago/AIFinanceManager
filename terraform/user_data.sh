#!/bin/bash
# User data script for Konta backend server setup

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install nginx
yum install -y nginx
systemctl enable nginx

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create application directory
mkdir -p /home/ec2-user/konta
cd /home/ec2-user/konta

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: your-backend-image:latest  # Update this with your ECR image
    container_name: konta-backend
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=${database_url}
      - ENVIRONMENT=production
      - CORS_ORIGINS=https://getkonta.app
      - LOG_LEVEL=INFO
    volumes:
      - /home/ec2-user/konta/logs:/app/logs
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: konta-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
EOF

# Create nginx configuration
cat > /etc/nginx/conf.d/konta.conf << 'EOF'
server {
    listen 80;
    server_name ${domain_name} api.getkonta.app;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to backend
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8001/health;
        access_log off;
    }
}
EOF

# Remove default nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Start nginx
systemctl start nginx

# Create log directory
mkdir -p /home/ec2-user/konta/logs
chown -R ec2-user:ec2-user /home/ec2-user/konta

# Install SSL certificate using Certbot (Let's Encrypt)
yum install -y certbot python3-certbot-nginx

# Create SSL certificate (will need to be run manually after DNS is set up)
cat > /home/ec2-user/setup-ssl.sh << 'EOF'
#!/bin/bash
certbot --nginx -d api.getkonta.app --non-interactive --agree-tos --email hello@getkonta.app
systemctl reload nginx
EOF

chmod +x /home/ec2-user/setup-ssl.sh

# Create deployment script
cat > /home/ec2-user/deploy.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/konta

# Pull latest images
docker-compose pull

# Restart services
docker-compose down
docker-compose up -d

# Clean up old images
docker image prune -f
EOF

chmod +x /home/ec2-user/deploy.sh

# Create log rotation
cat > /etc/logrotate.d/konta << 'EOF'
/home/ec2-user/konta/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

echo "Konta server setup completed!" > /var/log/user-data.log