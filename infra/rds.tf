# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"

  # Engine
  engine               = "postgres"
  engine_version       = "16.6"
  instance_class       = var.db_instance_class

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100  # Enable autoscaling up to 100GB
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true  # Required for Lightsail connection
  port                   = 5432

  # Maintenance
  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 7

  # Performance Insights (free for db.t4g.micro)
  performance_insights_enabled = false

  # Other settings
  skip_final_snapshot       = true  # Set to false in production
  deletion_protection       = false # Set to true in production
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot     = true

  tags = {
    Name = "${var.project_name}-postgres"
  }
}
