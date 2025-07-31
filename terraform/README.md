# AI Finance Manager - Terraform Infrastructure

This directory contains Terraform configuration files to deploy the AI Finance Manager infrastructure on AWS.

## 🏗️ Architecture

The Terraform configuration creates:

- **VPC** with public/private subnets across 2 AZs
- **RDS PostgreSQL** database with encryption and backups
- **ECS Fargate** cluster for containerized application
- **Application Load Balancer** with SSL termination
- **ECR** repository for Docker images
- **S3** bucket for file uploads
- **IAM roles** with least-privilege permissions
- **SSM Parameter Store** for secure secret management
- **CloudWatch** logs and monitoring
- **Auto Scaling** for ECS service

## 🚀 Quick Start

### Prerequisites

1. **Install Terraform** (>= 1.0)
   ```bash
   # macOS
   brew install terraform
   
   # Or download from: https://terraform.io/downloads
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   # Or use environment variables, IAM roles, etc.
   ```

3. **Create terraform.tfvars**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your actual values
   ```

### Deployment Steps

1. **Initialize Terraform**
   ```bash
   terraform init
   ```

2. **Plan the deployment**
   ```bash
   terraform plan
   ```

3. **Apply the configuration**
   ```bash
   terraform apply
   ```

4. **Update secrets after deployment**
   ```bash
   # Update SSM parameters with actual values
   aws ssm put-parameter \
     --name "/ai-finance-manager/secret-key" \
     --value "your_32_character_secret_key_here" \
     --type "SecureString" \
     --overwrite
   
   aws ssm put-parameter \
     --name "/ai-finance-manager/anthropic-api-key" \
     --value "sk-ant-your-anthropic-api-key-here" \
     --type "SecureString" \
     --overwrite
   ```

## 📁 File Structure

```
terraform/
├── main.tf              # Main configuration and providers
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── terraform.tfvars.example # Example variables file
├── vpc.tf              # VPC and networking
├── security_groups.tf  # Security groups
├── rds.tf              # PostgreSQL database
├── ecs.tf              # ECS cluster and service
├── load_balancer.tf    # Application Load Balancer
├── iam.tf              # IAM roles and policies
├── s3.tf               # S3 bucket configuration
├── ecr.tf              # Elastic Container Registry
├── ssm.tf              # Parameter Store secrets
└── README.md           # This file
```

## 🔧 Configuration

### Required Variables

```hcl
# terraform.tfvars
aws_region = "us-east-1"
environment = "production"
database_password = "your_secure_password"
```

### Optional Variables

```hcl
# Custom domain (requires Route53 hosted zone)
domain_name = "api.yourdomain.com"

# ECS configuration
ecs_cpu = 512
ecs_memory = 1024
ecs_desired_count = 2

# Database configuration
database_instance_class = "db.t3.micro"
database_allocated_storage = 20
```

## 🔐 Security Features

- **VPC isolation** with private subnets
- **Security groups** with minimal required access
- **RDS encryption** at rest and in transit
- **S3 encryption** with server-side encryption
- **SSL/TLS termination** at load balancer
- **IAM roles** with least-privilege permissions
- **SSM Parameter Store** for secret management
- **CloudWatch logging** for audit trails

## 📊 Outputs

After deployment, Terraform provides:

```bash
# Get important URLs and identifiers
terraform output load_balancer_url
terraform output ecr_repository_url
terraform output s3_bucket_name

# Get sensitive outputs
terraform output -raw database_endpoint
```

## 🔄 State Management

### Local State (Default)
Terraform state is stored locally in `terraform.tfstate`.

### Remote State (Recommended for Production)
Configure S3 backend in `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "ai-finance-manager/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}
```

## 🚀 Deployment with CI/CD

### GitHub Actions Integration
The Terraform configuration works with the existing GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
- name: Terraform Apply
  run: |
    cd terraform
    terraform init
    terraform plan -out=tfplan
    terraform apply tfplan
```

### Manual Deployment Commands

```bash
# Full deployment
make deploy-infra

# Or using Terraform directly
cd terraform
terraform init
terraform plan
terraform apply
```

## 📈 Scaling

### ECS Auto Scaling
- **CPU-based scaling**: Targets 70% CPU utilization
- **Memory-based scaling**: Targets 80% memory utilization
- **Min capacity**: 2 tasks
- **Max capacity**: 10 tasks

### Database Scaling
- **Vertical scaling**: Change `database_instance_class`
- **Storage scaling**: Increase `database_allocated_storage`
- **Read replicas**: Add read replica resources

### Cost Optimization
- **Spot instances**: Use FARGATE_SPOT for dev/staging
- **Reserved instances**: Purchase RDS reserved instances
- **S3 lifecycle**: Automatic cleanup after 90 days

## 🔍 Monitoring

### CloudWatch Dashboards
```bash
# View logs
aws logs tail /ecs/production-ai-finance --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=production-ai-finance-service
```

### Health Checks
- **ALB health checks**: HTTP `/health` endpoint
- **ECS health checks**: Container-level health monitoring
- **RDS monitoring**: Performance Insights enabled

## 🛠️ Troubleshooting

### Common Issues

**1. Domain Validation Timeout**
```bash
# Check Route53 hosted zone
aws route53 list-hosted-zones
# Ensure domain DNS points to Route53
```

**2. ECS Task Fails to Start**
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster production-ai-finance-cluster \
  --services production-ai-finance-service

# Check task logs
aws logs tail /ecs/production-ai-finance --follow
```

**3. Database Connection Issues**
```bash
# Test database connectivity
terraform output -raw database_endpoint
psql -h <endpoint> -U postgres -d finance_manager
```

### Useful Commands

```bash
# Check resource status
terraform state list
terraform state show aws_ecs_service.app

# Import existing resources
terraform import aws_s3_bucket.uploads existing-bucket-name

# Destroy resources (careful!)
terraform destroy
```

## 💰 Cost Estimation

### Monthly costs (approximate):
- **ECS Fargate**: $15-30/month (2 tasks)
- **RDS t3.micro**: $13/month
- **Application Load Balancer**: $18/month
- **NAT Gateway**: $32/month (2 AZs)
- **Data transfer**: $5-10/month
- **S3/CloudWatch**: $2-5/month

**Total**: ~$85-120/month for production

### Cost Optimization Tips:
1. Use single AZ for dev/staging (remove NAT Gateway)
2. Use smaller RDS instance for development
3. Enable S3 lifecycle policies
4. Set CloudWatch log retention

## 🔄 Updates and Maintenance

### Updating Infrastructure
```bash
# Update Terraform configuration
git pull origin main
cd terraform
terraform plan
terraform apply
```

### Updating Application
```bash
# Build and push new image
docker build -t $ECR_URI:latest .
docker push $ECR_URI:latest

# Update ECS service
aws ecs update-service \
  --cluster production-ai-finance-cluster \
  --service production-ai-finance-service \
  --force-new-deployment
```

### Backup and Recovery
- **RDS**: Automated backups (7 days retention)
- **S3**: Versioning enabled
- **Terraform state**: Store in S3 with versioning

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://aws.amazon.com/blogs/containers/amazon-ecs-best-practices-guide/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

For questions or issues, check the troubleshooting section above or create an issue in the GitHub repository.