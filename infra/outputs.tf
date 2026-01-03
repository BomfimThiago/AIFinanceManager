output "lightsail_static_ip" {
  description = "Static IP address for Lightsail instance"
  value       = aws_lightsail_static_ip.api.ip_address
}

output "lightsail_instance_name" {
  description = "Lightsail instance name"
  value       = aws_lightsail_instance.api.name
}

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
  value       = "api.${var.cloudflare_zone_name} -> ${aws_lightsail_static_ip.api.ip_address}"
}

output "api_url" {
  description = "API URL"
  value       = "https://api.${var.cloudflare_zone_name}"
}

output "next_steps" {
  description = "Next steps after terraform apply"
  value       = <<-EOT

    =====================================================
    DEPLOYMENT SUCCESSFUL
    =====================================================

    DNS Record Created:
    api.${var.cloudflare_zone_name} -> ${aws_lightsail_static_ip.api.ip_address}

    =====================================================
    NEXT STEPS (Docker Deployment)
    =====================================================

    1. SSH into Lightsail (wait 2-3 min for Docker install):
       ssh ubuntu@${aws_lightsail_static_ip.api.ip_address}

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
