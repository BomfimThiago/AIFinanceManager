# Database Backup Strategy Configuration

# S3 Bucket for database backups
resource "aws_s3_bucket" "db_backups" {
  bucket = "${local.name_prefix}-db-backups-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-backups"
    Type = "backup"
  })
}

# Enable versioning for backup bucket
resource "aws_s3_bucket_versioning" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable encryption for backup bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policy for backup retention
resource "aws_s3_bucket_lifecycle_configuration" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  rule {
    id     = "backup_retention"
    status = "Enabled"

    # Transition to Glacier after 30 days
    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    # Delete after 365 days (1 year)
    expiration {
      days = 365
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Block public access to backup bucket
resource "aws_s3_bucket_public_access_block" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for backup Lambda function
resource "aws_iam_role" "backup_lambda" {
  name = "${local.name_prefix}-backup-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-lambda-role"
  })
}

# IAM Policy for backup Lambda
resource "aws_iam_policy" "backup_lambda" {
  name        = "${local.name_prefix}-backup-lambda-policy"
  description = "Policy for database backup Lambda function"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.db_backups.arn,
          "${aws_s3_bucket.db_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBSnapshots",
          "rds:DeleteDBSnapshot",
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter"
        ]
        Resource = aws_ssm_parameter.database_url.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alarms.arn
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup_lambda" {
  role       = aws_iam_role.backup_lambda.name
  policy_arn = aws_iam_policy.backup_lambda.arn
}

resource "aws_iam_role_policy_attachment" "backup_lambda_basic" {
  role       = aws_iam_role.backup_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda function for automated backups
resource "aws_lambda_function" "db_backup" {
  filename         = data.archive_file.backup_lambda.output_path
  function_name    = "${local.name_prefix}-db-backup"
  role            = aws_iam_role.backup_lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.backup_lambda.output_base64sha256
  runtime         = "python3.11"
  timeout         = 300
  memory_size     = 256

  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main.id
      S3_BUCKET_NAME = aws_s3_bucket.db_backups.bucket
      SNS_TOPIC_ARN  = aws_sns_topic.alarms.arn
      ENVIRONMENT    = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-backup-lambda"
  })
}

# Create Lambda deployment package
data "archive_file" "backup_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_backup.zip"

  source {
    content  = file("${path.module}/lambda/backup.py")
    filename = "index.py"
  }
}

# EventBridge rule for scheduled backups (daily at 2 AM UTC)
resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "${local.name_prefix}-backup-schedule"
  description         = "Trigger database backups"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-schedule"
  })
}

resource "aws_cloudwatch_event_target" "backup_lambda" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "BackupLambdaTarget"
  arn       = aws_lambda_function.db_backup.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.db_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}

# CloudWatch Log Group for backup Lambda
resource "aws_cloudwatch_log_group" "backup_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.db_backup.function_name}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backup-lambda-logs"
  })
}

# SNS Topic for backup notifications
resource "aws_sns_topic_subscription" "backup_notifications" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email

  count = var.alarm_email != "" ? 1 : 0
}

# Output backup bucket name
output "backup_bucket_name" {
  description = "Name of the S3 bucket for database backups"
  value       = aws_s3_bucket.db_backups.bucket
}

output "backup_lambda_function_name" {
  description = "Name of the Lambda function for database backups"
  value       = aws_lambda_function.db_backup.function_name
}