# AI Finance Manager Backend - Deployment Guide

This guide covers how to deploy the AI Finance Manager Backend using Docker.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (can be run via Docker)
- Required API keys (Anthropic, Belvo)

## Quick Start

### 1. Development Deployment

```bash
# Build and run in development mode
./scripts/docker-build.sh run

# View logs
./scripts/docker-build.sh logs

# Stop containers
./scripts/docker-build.sh stop
```

### 2. Production Deployment

```bash
# Create production environment file
cp .env.production.example .env.production

# Edit the production environment file with your values
nano .env.production

# Build and run in production mode
./scripts/docker-build.sh prod
```

## Environment Configuration

### Development Environment

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/finance_manager
POSTGRES_DB=finance_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
BELVO_SECRET_ID=your_belvo_secret_id_here
BELVO_SECRET_PASSWORD=your_belvo_secret_password_here
BELVO_ENVIRONMENT=sandbox

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# App
APP_ENV=development
LOG_LEVEL=info
```

### Production Environment

Create a `.env.production` file with production values:

```env
# Database (use external database service)
DATABASE_URL=postgresql+asyncpg://username:password@your-db-host:5432/finance_manager

# API Keys (production keys)
ANTHROPIC_API_KEY=your_production_anthropic_api_key
BELVO_SECRET_ID=your_production_belvo_secret_id
BELVO_SECRET_PASSWORD=your_production_belvo_secret_password
BELVO_ENVIRONMENT=production

# JWT (generate secure keys)
JWT_SECRET_KEY=your_very_secure_production_jwt_secret_key_256_bits_minimum
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (your production domains)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# App
APP_ENV=production
LOG_LEVEL=info
```

## Docker Commands

### Build Image

```bash
./scripts/docker-build.sh build
```

### Run Development

```bash
./scripts/docker-build.sh run
```

### Run Production

```bash
./scripts/docker-build.sh prod
```

### View Logs

```bash
./scripts/docker-build.sh logs
```

### Stop Containers

```bash
./scripts/docker-build.sh stop
```

### Clean Up

```bash
./scripts/docker-build.sh clean
```

### Open Shell

```bash
./scripts/docker-build.sh shell
```

## Health Check

Once deployed, check the health of your application:

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "components": {
    "database": "healthy"
  }
}
```

## API Documentation

In development mode, API documentation is available at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

In production mode, documentation is disabled by default for security.

## Database Migrations

Migrations are automatically run when the container starts. To run migrations manually:

```bash
# Inside the container
./scripts/migrate.sh
```

## Security Considerations

### Production Checklist

- [ ] Use secure, randomly generated JWT secret keys
- [ ] Use production API keys (not sandbox)
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Use external database service (not containerized)
- [ ] Set up proper logging and monitoring
- [ ] Configure resource limits in Docker
- [ ] Use secrets management for sensitive data
- [ ] Enable database connection pooling
- [ ] Set up backup strategy

### Environment Variables

Never commit sensitive environment variables to version control. Use:
- Docker secrets
- Environment variable injection
- External secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

## Scaling and Performance

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Load Balancing

For production, consider:
- Multiple backend instances behind a load balancer
- Database connection pooling
- Redis for caching (if needed)
- CDN for static assets

## Monitoring

### Health Checks

The application includes built-in health checks:
- Container health check: `curl -f http://localhost:8001/health`
- Database connectivity check included

### Logging

Logs are structured and include:
- Request/response logging
- Error tracking
- Performance metrics
- Webhook processing logs

### Metrics

Consider adding:
- Prometheus metrics
- Application Performance Monitoring (APM)
- Database monitoring
- Alert notifications

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check environment variables
   - Verify database connectivity
   - Check Docker logs: `docker-compose logs backend`

2. **Database connection errors**
   - Verify DATABASE_URL format
   - Check database is running and accessible
   - Verify credentials

3. **API key errors**
   - Verify Anthropic API key is valid
   - Check Belvo credentials and environment
   - Ensure keys have proper permissions

4. **CORS errors**
   - Update CORS_ORIGINS with your frontend URL
   - Check protocol (http vs https)

### Debug Commands

```bash
# View container logs
docker-compose logs -f backend

# Check container status
docker-compose ps

# Open shell in container
docker-compose exec backend /bin/bash

# Check environment variables
docker-compose exec backend env

# Test database connection
docker-compose exec postgres psql -U postgres -d finance_manager -c "SELECT 1;"
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres finance_manager > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres finance_manager < backup.sql
```

### Webhook Logs Backup

Webhook logs are stored in the `webhook_logs` volume. Regular backups recommended.

## Updates and Maintenance

### Updating the Application

1. Pull latest code
2. Rebuild image: `./scripts/docker-build.sh build`
3. Run migrations: Automatic on container start
4. Restart containers: `./scripts/docker-build.sh stop && ./scripts/docker-build.sh prod`

### Database Maintenance

- Regular backups
- Monitor disk usage
- Optimize queries
- Update PostgreSQL version as needed