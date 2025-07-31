# Budget-Friendly Terraform Outputs

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.app.public_ip
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app.id
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "s3_bucket_name" {
  description = "Name of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "deployment_instructions" {
  description = "Next steps after infrastructure deployment"
  value = <<-EOT
    Infrastructure deployed successfully!
    
    Next steps:
    1. Add DNS A record: api.getkonta.app -> ${aws_eip.app.public_ip}
    2. SSH to server: ssh -i your-key.pem ec2-user@${aws_eip.app.public_ip}
    3. Set up SSL: sudo /home/ec2-user/setup-ssl.sh
    4. Deploy your backend: docker build and push to ECR, then run deploy.sh
    
    Server endpoints:
    - HTTP: http://${aws_eip.app.public_ip}
    - HTTPS (after SSL): https://api.getkonta.app
    
    Database: ${aws_db_instance.main.endpoint}:5432
    S3 Bucket: ${aws_s3_bucket.uploads.bucket}
  EOT
}