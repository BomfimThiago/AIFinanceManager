# AI Finance Manager - Production Deployment Guide

This guide covers deploying the AI Finance Manager application to production using AWS for the backend and Netlify for the frontend.

## 🏗️ Architecture Overview

### Backend (AWS)
- **ECS Fargate**: Container orchestration
- **RDS PostgreSQL**: Database with encryption and backups  
- **Application Load Balancer**: Traffic distribution and SSL termination
- **ECR**: Docker image registry
- **S3**: File storage for receipts and uploads
- **CloudWatch**: Logging and monitoring
- **Systems Manager**: Secure parameter storage

### Frontend (Netlify)
- **Netlify**: Static site hosting with CDN
- **Custom domain**: SSL certificate management
- **Environment variables**: Secure configuration

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)
Use GitHub Actions for continuous deployment.

### Option 2: Manual Deployment
Use the provided deployment scripts for manual control.

---

## 📋 Prerequisites

### Required Tools
- **AWS CLI** v2.0+ configured with credentials
- **Docker** 20.0+ for container builds
- **Python** 3.12+ for configuration validation
- **Node.js** 18+ for frontend builds
- **Git** for version control

### AWS Account Setup
1. Create an AWS account with administrative access
2. Configure AWS CLI with your credentials:
   ```bash
   aws configure
   ```

### Domain Configuration (Optional)
- Purchase a domain name
- Set up Route 53 hosted zone
- Configure DNS records

---

## 🔧 Configuration

### 1. Environment Variables

Copy the template and fill in your values:
```bash
cp backend/.env.production.template backend/.env
```

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://postgres:password@host:5432/finance_manager

# Security  
SECRET_KEY=your_32_character_secret_key
CORS_ORIGINS=https://your-frontend-domain.com

# AI Services
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

**Optional Variables:**
```env
# Bank Integrations
BELVO_SECRET_ID=your_belvo_id
BELVO_SECRET_PASSWORD=your_belvo_password

# AWS
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### 2. GitHub Secrets (for automated deployment)

Add these secrets to your GitHub repository:

**AWS Credentials:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Application Configuration:**
- `DATABASE_URL`
- `SECRET_KEY` 
- `ANTHROPIC_API_KEY`
- `BELVO_SECRET_ID` (optional)
- `BELVO_SECRET_PASSWORD` (optional)

**Frontend Configuration:**
- `VITE_API_BASE_URL` (your backend URL)
- `VITE_ANTHROPIC_API_KEY` (same as backend)

**Netlify Configuration:**
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

---

## 🔄 Automated Deployment (GitHub Actions)

### Setup Steps

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/your-username/ai-finance-manager.git
   cd ai-finance-manager
   ```

2. **Configure Secrets**
   - Go to GitHub Repository Settings → Secrets and Variables → Actions
   - Add all required secrets listed above

3. **Deploy**
   ```bash
   git push origin main
   ```
   
   The GitHub Actions workflow will automatically:
   - Setup Terraform and validate configuration
   - Deploy infrastructure with Terraform
   - Build and push Docker image to ECR
   - Update SSM parameters with secrets
   - Force ECS service deployment
   - Run database migrations
   - Deploy frontend to Netlify

### Monitoring Deployment

- Check GitHub Actions tab for deployment status
- Monitor Terraform state and resource creation
- Verify ECS service deployment
- Check Netlify deployment logs

---

## ⚙️ Manual Deployment

### 1. Configuration Validation

Validate your environment variables:
```bash
cd backend
python3 scripts/validate-config.py
```

### 2. Full Deployment

Deploy everything with one command:
```bash
./scripts/deploy-terraform.sh deploy
```

### 3. Partial Deployment

Deploy specific components:
```bash
# Infrastructure only
./scripts/deploy-terraform.sh plan
./scripts/deploy-terraform.sh apply

# Update secrets only
./scripts/deploy-terraform.sh update-secrets

# View deployment outputs
./scripts/deploy-terraform.sh outputs

# Destroy infrastructure (careful!)
./scripts/deploy-terraform.sh destroy
```

### 4. Frontend Deployment

Build and deploy frontend manually:
```bash
cd finance-dashboard
npm install
npm run build

# Deploy to Netlify (requires Netlify CLI)
netlify deploy --prod --dir=dist
```

---

## 🗂️ File Structure

```
├── .github/workflows/
│   ├── ci.yml                  # Continuous Integration pipeline
│   └── deploy.yml              # Production deployment pipeline
├── terraform/
│   ├── main.tf                 # Terraform main configuration
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── vpc.tf                  # VPC and networking
│   ├── rds.tf                  # PostgreSQL database
│   ├── ecs.tf                  # ECS cluster and service
│   ├── cloudwatch.tf           # Monitoring and alarms
│   ├── backup.tf               # Database backup strategy
│   └── README.md               # Terraform documentation
├── backend/
│   ├── .env.production.template # Environment variables template
│   ├── Dockerfile.prod         # Production Docker image
│   ├── scripts/
│   │   └── validate-config.py  # Configuration validation
│   └── src/
│       ├── core/
│       │   └── config_validation.py # Production config validation
│       ├── middleware/
│       │   └── security.py     # Security middleware
│       └── health/
│           └── router.py       # Health check endpoints
├── scripts/
│   ├── deploy-terraform.sh     # Terraform deployment script
│   └── backup-restore.sh       # Database backup and restore
└── DEPLOYMENT.md               # This guide
```

---

## 🔐 Security Features

### Backend Security
- **Rate limiting**: 100 requests per minute per IP
- **Security headers**: HSTS, CSP, X-Frame-Options
- **CORS configuration**: Restricted to frontend domain
- **JWT authentication**: Secure user sessions
- **Input validation**: Pydantic models for all endpoints
- **SQL injection protection**: SQLAlchemy ORM
- **Secret management**: AWS Systems Manager Parameter Store

### Infrastructure Security  
- **VPC isolation**: Private subnets for database
- **Security groups**: Minimal required access
- **RDS encryption**: Data at rest and in transit
- **S3 encryption**: AES-256 for file uploads
- **ALB SSL**: HTTPS termination
- **CloudWatch logging**: Audit trail

### Frontend Security
- **HTTPS only**: Netlify enforced SSL
- **Environment isolation**: Secure build variables
- **CSP headers**: Content Security Policy
- **CSRF protection**: SameSite cookies

---

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Overall application health
- `GET /ready` - Readiness probe (database connectivity)
- `GET /live` - Liveness probe (application responsiveness)

### Monitoring Stack
- **CloudWatch Logs**: Application and infrastructure logs
- **CloudWatch Metrics**: System and custom metrics
- **ECS Health Checks**: Container health monitoring
- **ALB Health Checks**: Load balancer target health

### Log Aggregation
```bash
# View application logs
aws logs tail /ecs/ai-finance-manager --follow

# View infrastructure logs  
aws logs tail /aws/ecs/cluster --follow
```

---

## 💰 Cost Optimization

### Current Optimizations
- **AI Models**: Haiku for categorization (90% cost savings)
- **ECS Fargate**: Right-sized containers (512 CPU, 1GB RAM)
- **RDS**: t3.micro with 7-day backups
- **ECR**: Image lifecycle policy (10 images max)
- **S3**: 90-day object expiration

### Estimated Monthly Costs (50 users)
- **ECS Fargate**: ~$15/month
- **RDS t3.micro**: ~$13/month  
- **ALB**: ~$18/month
- **ECR/S3/CloudWatch**: ~$5/month
- **AI API calls**: ~$4/month
- **Total**: ~$55/month

---

## 🚨 Troubleshooting

### Common Issues

**Configuration Validation Fails**
```bash
# Check environment variables
cd backend && python3 scripts/validate-config.py

# Verify AWS credentials
aws sts get-caller-identity
```

**ECS Task Fails to Start**
```bash
# Check ECS service events
aws ecs describe-services --cluster production-ai-finance-cluster --services ai-finance-manager-service

# View task logs
aws logs tail /ecs/ai-finance-manager --follow
```

**Database Connection Issues**
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier production-ai-finance-db
```

**Frontend Build Failures**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
cd finance-dashboard
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Support Contacts
- **AWS Issues**: Check Terraform state and ECS service logs
- **Application Issues**: Review health check endpoints
- **Database Issues**: Monitor RDS performance insights
- **Frontend Issues**: Check Netlify build logs

---

## 📚 Additional Resources

### AWS Documentation
- [ECS Fargate User Guide](https://docs.aws.amazon.com/AmazonECS/latest/userguide/what-is-fargate.html)
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### Netlify Documentation  
- [Deployment Guide](https://docs.netlify.com/site-deploys/overview/)
- [Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)

### Security Best Practices
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [OWASP Web Security](https://owasp.org/www-project-top-ten/)

---

## 🎯 Next Steps

After successful deployment:

1. **Configure Domain**: Set up custom domain with SSL
2. **Set up Monitoring**: Configure CloudWatch alarms
3. **Database Backups**: Verify automated backup strategy  
4. **Performance Testing**: Load test the application
5. **Security Audit**: Run security scans and penetration tests
6. **Documentation**: Update team knowledge base
7. **Disaster Recovery**: Test backup and restore procedures

---

*For questions or issues, please check the troubleshooting section or create an issue in the GitHub repository.*