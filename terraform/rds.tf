# Budget-Friendly RDS Configuration
# Single-AZ, t3.micro, minimal settings

# DB Subnet Group (requires at least 2 subnets)
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_db.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# RDS Instance - Single AZ, Free Tier
resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  # Engine
  engine         = "postgres"
  engine_version = "15.4"

  # Instance
  instance_class        = var.database_instance_class  # db.t3.micro for free tier
  allocated_storage     = var.database_allocated_storage  # 20GB for free tier
  max_allocated_storage = 100  # Auto-scaling limit
  storage_type          = "gp2"  # General Purpose SSD
  storage_encrypted     = true

  # Database
  db_name  = "konta"
  username = "postgres"
  password = var.database_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  port                   = 5432

  # Backup & Maintenance
  backup_retention_period = var.backup_retention_period
  backup_window          = "07:00-09:00"  # UTC
  maintenance_window     = "Sun:09:00-Sun:11:00"  # UTC
  
  # Cost optimization
  multi_az               = false  # Single AZ to save costs
  deletion_protection    = false  # Can be enabled later
  skip_final_snapshot    = true   # For development, set to false in production

  # Performance Insights (free tier)
  performance_insights_enabled = true
  performance_insights_retention_period = 7  # Free tier limit

  # Monitoring
  monitoring_interval = 0  # Disable enhanced monitoring to save costs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database"
  })
}