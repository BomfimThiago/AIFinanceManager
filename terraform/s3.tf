# Budget-Friendly S3 Configuration
# Single bucket with basic settings

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-uploads"
  })
}

# S3 Bucket Versioning (disabled to save costs)
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Disabled"  # Enable later if needed
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration (to manage costs)
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "delete_old_files"
    status = "Enabled"

    # Delete files older than 90 days to save storage costs
    expiration {
      days = 90
    }

    # Delete incomplete multipart uploads after 1 day
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}