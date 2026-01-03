# Konta Infrastructure

Terraform configuration for deploying Konta to AWS with Cloudflare DNS.

## Architecture

- **Lightsail**: API server ($3.50/month)
- **RDS PostgreSQL**: Database (~$13/month)
- **Cloudflare**: DNS management (free)
- **Total**: ~$16.50/month

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads) >= 1.0
2. AWS CLI configured with credentials (`aws configure`)
3. AWS account with appropriate permissions
4. Cloudflare account with your domain

## Cloudflare API Token Setup

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Select **"Edit zone DNS"** template
4. Configure permissions:
   - **Zone > DNS > Edit**
   - **Zone > Zone > Read**
5. Under "Zone Resources", select:
   - **Include > Specific zone > getkonta.app**
6. Click **"Continue to summary"** then **"Create Token"**
7. Copy the token (you won't see it again!)

## Quick Start

```bash
# 1. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# Required changes:
# - db_password: Set a strong password (16+ chars)
# - cloudflare_api_token: Paste your Cloudflare token

# 2. Initialize Terraform (downloads providers)
terraform init

# 3. Review the plan
terraform plan

# 4. Apply (creates resources)
terraform apply

# 5. Note the outputs for next steps
terraform output
```

## Resources Created

| Resource | Type | Cost |
|----------|------|------|
| konta-api | Lightsail Instance | $3.50/month |
| konta-api-ip | Lightsail Static IP | Free |
| konta-db | RDS PostgreSQL | ~$13/month |
| konta-vpc | VPC | Free |
| api.getkonta.app | Cloudflare DNS A Record | Free |
| Security Groups | Various | Free |

## After Terraform Apply

The DNS record is automatically created. Follow the instructions in:
```bash
terraform output next_steps
```

Summary:
1. SSH into Lightsail instance
2. Clone the repository
3. Configure environment variables
4. Run database migrations
5. Start the service
6. Setup SSL certificate

## Updating DNS

To update the DNS record after the IP changes:
```bash
terraform apply
```

## Destroying Resources

```bash
terraform destroy
```

**Warning**: This will delete all resources including the database and DNS records. Make sure to backup data first.

## Security Notes

- RDS is publicly accessible to allow Lightsail connection
- In production, consider VPC peering or AWS PrivateLink
- Always use strong passwords (16+ characters)
- Enable RDS deletion protection for production
- Cloudflare API token is stored locally in terraform.tfvars (gitignored)

## Troubleshooting

### Cloudflare Error: "Invalid Zone"
- Verify your domain is added to Cloudflare
- Check the API token has permissions for the correct zone

### Lightsail Not Accessible
- Wait 2-3 minutes for instance to fully boot
- Check security group allows SSH (port 22)

### RDS Connection Failed
- Verify security group allows PostgreSQL (port 5432)
- Check you're using the correct password
