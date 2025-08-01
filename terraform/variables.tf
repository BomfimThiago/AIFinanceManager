# AI Finance Manager - Budget-Friendly Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"  # Cheapest region, has free tier
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.getkonta.app"
}

variable "database_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
}

# Budget-friendly settings
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"  # Free tier eligible, can upgrade to t3.small later
}

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"  # Free tier eligible
}

variable "database_allocated_storage" {
  description = "Database storage in GB"
  type        = number
  default     = 20  # Free tier limit
}

variable "backup_retention_period" {
  description = "Database backup retention in days"
  type        = number
  default     = 7
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for EC2 access"
  type        = string
}

