# AI Finance Manager - Terraform Infrastructure
# Production-ready AWS infrastructure with VPC, RDS, ECS, ALB, and S3

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Optional: Configure remote state storage
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "ai-finance-manager/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AI Finance Manager"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Local values for resource naming
locals {
  name_prefix = "${var.environment}-ai-finance"
  
  common_tags = {
    Project     = "AI Finance Manager"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}