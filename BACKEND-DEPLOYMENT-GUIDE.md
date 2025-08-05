# Konta Backend Deployment Guide

This guide walks you through deploying the Konta backend to your AWS EC2 instance.

## Prerequisites

1. **DNS Configuration**: Add A record in Cloudflare
   ```
   api.getkonta.app → 44.214.217.239
   ```

2. **API Keys Ready**:
   - Anthropic API key
   - Belvo credentials (if using bank integrations)
   
3. **SSH Key**: Ensure you have `terraform/konta-production-key.pem` with correct permissions:
   ```bash
   chmod 400 terraform/konta-production-key.pem
   ```

## Step 1: Initial Server Setup (One-time)

First, SSH into your server:
```bash
ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239
```

The server already has Docker, nginx, and other tools installed via the Terraform user data script.

## Step 2: Deploy Backend

### Option A: Using the Deployment Script (Recommended)

1. Make the deployment script executable:
   ```bash
   chmod +x scripts/deploy-backend.sh
   ```

2. Run the deployment:
   ```bash
   ./scripts/deploy-backend.sh
   ```

3. When prompted, update the `.env.production` file with your actual API keys

### Option B: Manual Deployment

1. **Build Docker image locally**:
   ```bash
   cd backend
   docker build -t konta-backend:latest -f Dockerfile .
   ```

2. **Save and transfer image**:
   ```bash
   docker save konta-backend:latest | gzip > konta-backend.tar.gz
   scp -i ../terraform/konta-production-key.pem konta-backend.tar.gz ec2-user@44.214.217.239:/tmp/
   ```

3. **Create production environment file** (`backend/.env.production`):
   ```env
   ANTHROPIC_API_KEY=your_actual_anthropic_key
   CORS_ORIGINS=https://getkonta.app,https://www.getkonta.app
   ENVIRONMENT=production
   DATABASE_URL=postgresql://postgres:KontaSecure2024@konta-production-db.cm5ouwese6cm.us-east-1.rds.amazonaws.com:5432/konta
   JWT_SECRET_KEY=your_generated_secret_key
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_MINUTES=43200
   LOG_LEVEL=INFO
   AWS_REGION=us-east-1
   S3_UPLOAD_BUCKET=konta-production-uploads-724772052980
   BELVO_SECRET_ID=your_belvo_secret_id
   BELVO_SECRET_PASSWORD=your_belvo_secret_password
   BELVO_ENVIRONMENT=production
   ```

4. **Transfer environment file**:
   ```bash
   scp -i ../terraform/konta-production-key.pem .env.production ec2-user@44.214.217.239:/tmp/
   ```

5. **SSH to server and deploy**:
   ```bash
   ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239
   
   # Load Docker image
   cd /tmp
   docker load < konta-backend.tar.gz
   
   # Stop existing container
   docker stop konta-backend 2>/dev/null || true
   docker rm konta-backend 2>/dev/null || true
   
   # Set up environment
   sudo mkdir -p /opt/konta
   sudo mv .env.production /opt/konta/.env
   sudo chown ec2-user:ec2-user /opt/konta/.env
   
   # Run container
   docker run -d \
     --name konta-backend \
     --restart unless-stopped \
     -p 8001:8001 \
     -v /opt/konta/.env:/app/.env:ro \
     --env-file /opt/konta/.env \
     konta-backend:latest
   ```

## Step 3: Run Database Migrations

```bash
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

Or manually on the server:
```bash
docker exec konta-backend uv run alembic upgrade head
```

## Step 4: Set Up SSL (HTTPS)

1. **Ensure DNS is configured** (wait for propagation, ~5-30 minutes)

2. **Run SSL setup script on the server**:
   ```bash
   ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239
   chmod +x /tmp/setup-nginx-ssl.sh
   sudo /tmp/setup-nginx-ssl.sh
   ```

   Or copy and run the local script:
   ```bash
   scp -i terraform/konta-production-key.pem scripts/setup-nginx-ssl.sh ec2-user@44.214.217.239:/tmp/
   ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'chmod +x /tmp/setup-nginx-ssl.sh && sudo /tmp/setup-nginx-ssl.sh'
   ```

## Step 5: Verify Deployment

1. **Check container status**:
   ```bash
   ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'docker ps'
   ```

2. **Check logs**:
   ```bash
   ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'docker logs konta-backend'
   ```

3. **Test endpoints**:
   ```bash
   # Health check
   curl https://api.getkonta.app/health
   
   # API docs (if in development mode)
   curl https://api.getkonta.app/docs
   ```

## Step 6: Update Frontend Configuration

Update your frontend environment to use the production API:

**finance-dashboard/.env.production**:
```env
VITE_API_BASE_URL=https://api.getkonta.app
```

## Monitoring and Maintenance

### View Logs
```bash
# Real-time logs
ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'docker logs -f konta-backend'

# Last 100 lines
ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'docker logs --tail 100 konta-backend'
```

### Restart Backend
```bash
ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239 'docker restart konta-backend'
```

### Update Backend
1. Build new image locally
2. Run deployment script again
3. The script handles stopping old container and starting new one

### Database Backup
```bash
# Create backup
ssh -i terraform/konta-production-key.pem ec2-user@44.214.217.239
docker exec konta-backend pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Container won't start
1. Check logs: `docker logs konta-backend`
2. Verify environment file: `cat /opt/konta/.env`
3. Check port availability: `sudo lsof -i :8001`

### SSL certificate issues
1. Verify DNS propagation: `nslookup api.getkonta.app`
2. Check nginx config: `sudo nginx -t`
3. Renew certificate: `sudo certbot renew`

### Database connection issues
1. Test from container: `docker exec konta-backend uv run python -c "from src.database import engine; print('Connected!')"`
2. Check security groups in AWS
3. Verify database is running in AWS RDS console

### Performance issues
1. Check container resources: `docker stats konta-backend`
2. Monitor EC2 metrics in AWS console
3. Check database performance insights

## Security Best Practices

1. **Keep secrets secure**: Never commit `.env` files
2. **Regular updates**: Update OS and Docker regularly
3. **Monitor logs**: Set up CloudWatch alerts for errors
4. **Backup regularly**: Automate database backups
5. **Use strong passwords**: Rotate JWT secrets periodically

## Cost Optimization

- The t3.micro instance uses CPU credits. Monitor usage to avoid throttling
- Set up CloudWatch alarms for unusual activity
- Use S3 lifecycle policies to manage uploaded files
- Consider using CloudFront CDN for static assets

---

**Support**: For issues, check logs first, then AWS console for infrastructure status.