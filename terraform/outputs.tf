# Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_hosted_zone_id" {
  description = "Hosted zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = var.domain_name != "api.your-domain.com" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

# Security Group IDs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# IAM Role ARNs
output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# SSM Parameter ARNs
output "database_url_parameter_arn" {
  description = "ARN of the database URL SSM parameter"
  value       = aws_ssm_parameter.database_url.arn
  sensitive   = true
}

output "secret_key_parameter_arn" {
  description = "ARN of the secret key SSM parameter"
  value       = aws_ssm_parameter.secret_key.arn
  sensitive   = true
}

output "anthropic_api_key_parameter_arn" {
  description = "ARN of the Anthropic API key SSM parameter"
  value       = aws_ssm_parameter.anthropic_api_key.arn
  sensitive   = true
}

# Domain and SSL information
output "domain_name" {
  description = "Domain name configured for the application"
  value       = var.domain_name
}

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate (if custom domain is used)"
  value       = var.domain_name != "api.your-domain.com" ? aws_acm_certificate_validation.main[0].certificate_arn : null
}

# Health check URL
output "health_check_url" {
  description = "Health check URL for the application"
  value       = "${var.domain_name != "api.your-domain.com" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"}/health"
}