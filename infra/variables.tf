variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-south-2"  # Spain (Madrid)
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

# Lightsail Variables
variable "lightsail_bundle_id" {
  description = "Lightsail bundle ID (nano_3_0 = $3.50/month)"
  type        = string
  default     = "nano_3_0"
}

variable "lightsail_blueprint_id" {
  description = "Lightsail blueprint ID"
  type        = string
  default     = "ubuntu_22_04"
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
