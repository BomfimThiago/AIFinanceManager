variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-3"  # Paris (same as existing RDS)
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "konta"
}

# RDS Variables
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "finance_manager"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

# EC2 Variables
variable "ec2_instance_type" {
  description = "EC2 instance type (t3.small = 2GB RAM, ~$15/month)"
  type        = string
  default     = "t3.small"
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}

# Cloudflare Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:DNS:Edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone (domain) name"
  type        = string
  default     = "getkonta.app"
}
