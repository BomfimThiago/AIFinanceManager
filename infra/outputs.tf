# EC2 Outputs
output "ec2_public_ip" {
  description = "Elastic IP address for EC2 instance"
  value       = aws_eip.api.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.api.id
}

output "ec2_instance_type" {
  description = "EC2 instance type"
  value       = aws_instance.api.instance_type
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_hostname" {
  description = "RDS PostgreSQL hostname (without port)"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "database_url" {
  description = "Full database URL for backend .env"
  value       = "postgresql+asyncpg://${var.db_username}:PASSWORD@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
  sensitive   = true
}

# Cloudflare DNS Outputs
output "api_dns_record" {
  description = "API DNS record created in Cloudflare"
  value       = "api.${var.cloudflare_zone_name} -> ${aws_eip.api.public_ip}"
}

output "api_url" {
  description = "API URL"
  value       = "https://api.${var.cloudflare_zone_name}"
}

# SSH Command
output "ssh_command" {
  description = "SSH command to connect to EC2"
  value       = "ssh -i ~/.ssh/konta-key ubuntu@${aws_eip.api.public_ip}"
}

output "next_steps" {
  description = "Next steps after terraform apply"
  value       = <<-EOT

    =====================================================
    DEPLOYMENT SUCCESSFUL
    =====================================================

    EC2 Instance: ${aws_instance.api.instance_type} (2GB RAM)
    Public IP: ${aws_eip.api.public_ip}

    DNS Record Created:
    api.${var.cloudflare_zone_name} -> ${aws_eip.api.public_ip}

    =====================================================
    NEXT STEPS (Docker Deployment)
    =====================================================

    1. SSH into EC2 (wait 2-3 min for Docker install):
       ssh -i ~/.ssh/konta-key ubuntu@${aws_eip.api.public_ip}

    2. Clone the repository:
       cd /opt/konta
       git clone https://github.com/BomfimThiago/AIFinanceManager.git .

    3. Create .env.production file:
       nano .env.production

       DATABASE_URL=postgresql+asyncpg://${var.db_username}:<PASSWORD>@${aws_db_instance.postgres.address}:5432/${var.db_name}
       JWT_SECRET=<64_CHAR_SECRET>
       JWT_ALGORITHM=HS256
       ACCESS_TOKEN_EXPIRE_MINUTES=10080
       ANTHROPIC_API_KEY=<YOUR_KEY>
       CORS_ORIGINS=["https://getkonta.app","https://www.getkonta.app"]
       ENVIRONMENT=production
       DEBUG=false

    4. Run the deployment script:
       chmod +x scripts/deploy.sh
       ./scripts/deploy.sh your-email@example.com

    =====================================================
    MANUAL DEPLOYMENT (Alternative)
    =====================================================

    # Build and start containers
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

    # Run migrations
    docker compose -f docker-compose.prod.yml exec api alembic upgrade head

    # View logs
    docker compose -f docker-compose.prod.yml logs -f

    =====================================================
  EOT
}
