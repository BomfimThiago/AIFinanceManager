#!/bin/bash

# Konta Backend Deployment Script Template
# Copy this to deploy-backend.sh and update with your actual values

set -e  # Exit on error

# Configuration - UPDATE THESE VALUES
EC2_HOST="YOUR_EC2_IP_HERE"
EC2_USER="ec2-user"
KEY_PATH="terraform/YOUR_KEY_FILE.pem"
DOCKER_IMAGE="konta-backend"
DOCKER_TAG="latest"
CONTAINER_NAME="konta-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Konta Backend Deployment...${NC}"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}Error: SSH key not found at $KEY_PATH${NC}"
    exit 1
fi

# Step 1: Build Docker image locally
echo -e "${YELLOW}Building Docker image...${NC}"
cd backend
docker build -t $DOCKER_IMAGE:$DOCKER_TAG -f Dockerfile .

# Step 2: Save Docker image to tar file
echo -e "${YELLOW}Saving Docker image...${NC}"
docker save $DOCKER_IMAGE:$DOCKER_TAG | gzip > konta-backend.tar.gz

# Step 3: Copy image to EC2
echo -e "${YELLOW}Copying Docker image to EC2...${NC}"
scp -i ../$KEY_PATH konta-backend.tar.gz $EC2_USER@$EC2_HOST:/tmp/

# Step 4: Copy environment file template
echo -e "${YELLOW}Creating production environment file...${NC}"
cat > .env.production << EOF
# Production Environment Variables
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENVIRONMENT=production
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/dbname
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=43200
LOG_LEVEL=INFO
AWS_REGION=us-east-1
S3_UPLOAD_BUCKET=your-s3-bucket-name
BELVO_SECRET_ID=your_belvo_secret_id
BELVO_SECRET_PASSWORD=your_belvo_secret_password
BELVO_ENVIRONMENT=production
EOF

echo -e "${YELLOW}Please update .env.production with your actual API keys!${NC}"
read -p "Press enter once you've updated .env.production with your API keys..."

# Copy environment file to server
scp -i ../$KEY_PATH .env.production $EC2_USER@$EC2_HOST:/tmp/

# Step 5: Deploy on EC2
echo -e "${YELLOW}Deploying on EC2...${NC}"
ssh -i ../$KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'
    # Load and run Docker image
    cd /tmp
    docker load < konta-backend.tar.gz
    
    # Stop existing container if running
    docker stop konta-backend 2>/dev/null || true
    docker rm konta-backend 2>/dev/null || true
    
    # Create app directory
    sudo mkdir -p /opt/konta
    sudo mv .env.production /opt/konta/.env
    sudo chown ec2-user:ec2-user /opt/konta/.env
    
    # Run new container
    docker run -d \
        --name konta-backend \
        --restart unless-stopped \
        -p 8001:8001 \
        -v /opt/konta/.env:/app/.env:ro \
        --env-file /opt/konta/.env \
        konta-backend:latest
    
    # Clean up
    rm -f konta-backend.tar.gz
    
    # Check if container is running
    sleep 5
    if docker ps | grep -q konta-backend; then
        echo "Backend deployed successfully!"
        docker logs --tail 20 konta-backend
    else
        echo "Error: Container failed to start"
        docker logs konta-backend
        exit 1
    fi
ENDSSH

# Step 6: Clean up local files
rm -f konta-backend.tar.gz
rm -f .env.production

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Backend should be accessible at: http://$EC2_HOST:8001${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up nginx reverse proxy for HTTPS"
echo "2. Configure SSL certificate with Let's Encrypt"
echo "3. Update DNS records to point your API subdomain to $EC2_HOST"