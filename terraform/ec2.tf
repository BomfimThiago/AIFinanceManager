# Budget-Friendly EC2 Configuration
# Single instance running Docker containers with nginx

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 Instance
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id             = aws_subnet.public.id

  # User data script for initial setup
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    database_url = "postgresql://postgres:${var.database_password}@${aws_db_instance.main.endpoint}:5432/konta"
    domain_name  = var.domain_name
  }))

  # Root block device
  root_block_device {
    volume_type = "gp3"
    volume_size = 20  # GB - adjust as needed
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-server"
  })
}

# Elastic IP for static IP address
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip"
  })
}

# IAM Role for EC2 instance
resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = local.common_tags
}

# IAM Policy for accessing S3 and SSM
resource "aws_iam_role_policy" "ec2" {
  name = "${local.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.uploads.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/konta/*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}