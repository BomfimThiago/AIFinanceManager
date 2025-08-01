#!/bin/bash

# Database Migration Script Template for Konta
# Copy this to run-migrations.sh and update with your actual values

set -e

# Configuration - UPDATE THESE VALUES
EC2_HOST="YOUR_EC2_IP_HERE"
EC2_USER="ec2-user"
KEY_PATH="terraform/YOUR_KEY_FILE.pem"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Running database migrations...${NC}"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}Error: SSH key not found at $KEY_PATH${NC}"
    exit 1
fi

# Run migrations on EC2
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'
    echo "Executing migrations inside Docker container..."
    
    # Run alembic migrations inside the container
    docker exec konta-backend uv run alembic upgrade head
    
    # Check migration status
    echo ""
    echo "Current migration status:"
    docker exec konta-backend uv run alembic current
    
    echo ""
    echo "Migration history:"
    docker exec konta-backend uv run alembic history --verbose
ENDSSH

echo -e "${GREEN}Migrations completed successfully!${NC}"