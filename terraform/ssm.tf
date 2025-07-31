# Systems Manager Parameter Store Configuration

# Database URL parameter
resource "aws_ssm_parameter" "database_url" {
  name  = "/ai-finance-manager/database-url"
  type  = "SecureString"
  value = "postgresql://postgres:${var.database_password}@${aws_db_instance.main.endpoint}:5432/finance_manager"

  description = "Database connection URL for AI Finance Manager"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-url"
  })
}

# Secret key parameter (to be updated manually after deployment)
resource "aws_ssm_parameter" "secret_key" {
  name  = "/ai-finance-manager/secret-key"
  type  = "SecureString"
  value = "CHANGE_ME_AFTER_DEPLOYMENT_32_CHARACTERS_MINIMUM"

  description = "JWT secret key for AI Finance Manager"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secret-key"
  })

  lifecycle {
    ignore_changes = [value]
  }
}

# Anthropic API key parameter (to be updated manually after deployment)
resource "aws_ssm_parameter" "anthropic_api_key" {
  name  = "/ai-finance-manager/anthropic-api-key"
  type  = "SecureString"
  value = "CHANGE_ME_AFTER_DEPLOYMENT"

  description = "Anthropic API key for AI Finance Manager"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-anthropic-api-key"
  })

  lifecycle {
    ignore_changes = [value]
  }
}

# Belvo secret ID parameter (optional)
resource "aws_ssm_parameter" "belvo_secret_id" {
  name  = "/ai-finance-manager/belvo-secret-id"
  type  = "SecureString"
  value = "OPTIONAL_CHANGE_ME_AFTER_DEPLOYMENT"

  description = "Belvo secret ID for AI Finance Manager"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-belvo-secret-id"
  })

  lifecycle {
    ignore_changes = [value]
  }
}

# Belvo secret password parameter (optional)
resource "aws_ssm_parameter" "belvo_secret_password" {
  name  = "/ai-finance-manager/belvo-secret-password"
  type  = "SecureString"
  value = "OPTIONAL_CHANGE_ME_AFTER_DEPLOYMENT"

  description = "Belvo secret password for AI Finance Manager"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-belvo-secret-password"
  })

  lifecycle {
    ignore_changes = [value]
  }
}