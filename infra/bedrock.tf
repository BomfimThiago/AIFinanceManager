# AWS Bedrock Configuration for AI Receipt Processing

# Variable for Bedrock region (may differ from main region)
variable "bedrock_region" {
  description = "AWS region for Bedrock (must support Claude models)"
  type        = string
  default     = "us-east-1"  # Bedrock has best availability in us-east-1
}

# Note: Bedrock is available in these regions as of 2025:
# - us-east-1 (N. Virginia) - Best availability
# - us-west-2 (Oregon)
# - eu-central-1 (Frankfurt)
# - eu-west-1 (Ireland)
# - ap-northeast-1 (Tokyo)
# - ap-southeast-1 (Singapore)

# IAM Role for EC2 to access Bedrock
resource "aws_iam_role" "ec2_bedrock" {
  name = "${var.project_name}-ec2-bedrock-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-bedrock-role"
  }
}

# IAM Policy for Bedrock access
resource "aws_iam_policy" "bedrock_access" {
  name        = "${var.project_name}-bedrock-access"
  path        = "/"
  description = "Policy for accessing AWS Bedrock Claude models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          # Claude 3 Opus
          "arn:aws:bedrock:${var.bedrock_region}::foundation-model/anthropic.claude-3-opus-20240229",
          # Claude 3 Sonnet
          "arn:aws:bedrock:${var.bedrock_region}::foundation-model/anthropic.claude-3-sonnet-20240229",
          # Claude 3.5 Sonnet
          "arn:aws:bedrock:${var.bedrock_region}::foundation-model/anthropic.claude-3-5-sonnet-20240620",
          # Claude 3.5 Sonnet v2
          "arn:aws:bedrock:${var.bedrock_region}::foundation-model/anthropic.claude-3-5-sonnet-20241022",
          # Allow future Claude models
          "arn:aws:bedrock:${var.bedrock_region}::foundation-model/anthropic.claude-*",
          # Also allow cross-region access
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
        ]
      },
      {
        Sid    = "BedrockListModels"
        Effect = "Allow"
        Action = [
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-bedrock-policy"
  }
}

# Attach Bedrock policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_bedrock" {
  role       = aws_iam_role.ec2_bedrock.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_bedrock" {
  name = "${var.project_name}-ec2-bedrock-profile"
  role = aws_iam_role.ec2_bedrock.name

  tags = {
    Name = "${var.project_name}-ec2-bedrock-profile"
  }
}

# CloudWatch Logs for Bedrock monitoring (optional but recommended)
resource "aws_cloudwatch_log_group" "bedrock" {
  name              = "/aws/bedrock/${var.project_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-bedrock-logs"
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${var.project_name}-cloudwatch-logs"
  path        = "/"
  description = "Policy for writing to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Resource = [
          aws_cloudwatch_log_group.bedrock.arn,
          "${aws_cloudwatch_log_group.bedrock.arn}:*"
        ]
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-cloudwatch-policy"
  }
}

# Attach CloudWatch policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_bedrock.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# SSM Parameter for Bedrock configuration (optional - for dynamic config)
resource "aws_ssm_parameter" "bedrock_model_id" {
  name  = "/${var.project_name}/bedrock/model_id"
  type  = "String"
  value = "anthropic.claude-3-5-sonnet-20241022"

  description = "Default Bedrock model ID for receipt processing"

  tags = {
    Name = "${var.project_name}-bedrock-model-id"
  }
}

resource "aws_ssm_parameter" "bedrock_fallback_model" {
  name  = "/${var.project_name}/bedrock/fallback_model"
  type  = "String"
  value = "anthropic.claude-3-sonnet-20240229"

  description = "Fallback Bedrock model ID when primary is unavailable"

  tags = {
    Name = "${var.project_name}-bedrock-fallback-model"
  }
}

# Output the IAM Instance Profile ARN
output "bedrock_instance_profile_arn" {
  value       = aws_iam_instance_profile.ec2_bedrock.arn
  description = "ARN of the IAM instance profile for EC2 Bedrock access"
}

output "bedrock_role_arn" {
  value       = aws_iam_role.ec2_bedrock.arn
  description = "ARN of the IAM role for Bedrock access"
}

output "bedrock_log_group" {
  value       = aws_cloudwatch_log_group.bedrock.name
  description = "CloudWatch log group for Bedrock logs"
}

output "bedrock_region" {
  value       = var.bedrock_region
  description = "AWS region configured for Bedrock access"
}

output "bedrock_model_parameter" {
  value       = aws_ssm_parameter.bedrock_model_id.name
  description = "SSM parameter name for Bedrock model ID"
}

output "bedrock_fallback_parameter" {
  value       = aws_ssm_parameter.bedrock_fallback_model.name
  description = "SSM parameter name for fallback Bedrock model"
}