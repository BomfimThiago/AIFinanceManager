# Konta - Budget-Friendly Configuration

# AWS Configuration
aws_region = "us-east-1"  # Cheapest region with free tier
environment = "production"

# Domain Configuration
domain_name = "api.getkonta.app"

# Database Configuration (Free Tier)
database_password = "your_secure_password_here_123!"  # CHANGE THIS!
database_instance_class = "db.t3.micro"  # Free tier eligible
database_allocated_storage = 20  # Free tier limit

# EC2 Configuration (Free Tier)
instance_type = "t3.micro"  # Free tier eligible
key_pair_name = "your-ec2-key-pair"  # CREATE THIS FIRST in AWS Console

# Backup Configuration
backup_retention_period = 7