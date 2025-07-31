#!/bin/bash

# AI Finance Manager - Terraform Deployment Script
# This script deploys the application infrastructure using Terraform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
TERRAFORM_DIR="terraform"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        print_status "Visit: https://terraform.io/downloads"
        exit 1
    fi
    
    # Check Terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    print_status "Found Terraform version: $TERRAFORM_VERSION"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    # Check if jq is installed (for JSON parsing)
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Some features may not work properly."
        print_status "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
    
    print_success "Prerequisites check passed"
}

setup_terraform() {
    print_status "Setting up Terraform..."
    
    # Navigate to terraform directory
    if [ ! -d "$TERRAFORM_DIR" ]; then
        print_error "Terraform directory not found: $TERRAFORM_DIR"
        exit 1
    fi
    
    cd "$TERRAFORM_DIR"
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        print_warning "terraform.tfvars not found"
        if [ -f "terraform.tfvars.example" ]; then
            print_status "Creating terraform.tfvars from example..."
            cp terraform.tfvars.example terraform.tfvars
            print_warning "Please edit terraform.tfvars with your actual values before continuing"
            print_status "Required variables: aws_region, environment, database_password"
            exit 1
        else
            print_error "No terraform.tfvars.example found"
            exit 1
        fi
    fi
    
    print_success "Terraform setup completed"
}

terraform_init() {
    print_status "Initializing Terraform..."
    
    # Initialize Terraform
    if terraform init; then
        print_success "Terraform initialized successfully"
    else
        print_error "Terraform initialization failed"
        exit 1
    fi
}

terraform_plan() {
    print_status "Creating Terraform execution plan..."
    
    # Create execution plan
    if terraform plan -out=tfplan; then
        print_success "Terraform plan created successfully"
        print_status "Review the plan above before applying"
    else
        print_error "Terraform plan failed"
        exit 1
    fi
}

terraform_apply() {
    print_status "Applying Terraform configuration..."
    
    # Apply the plan
    if terraform apply tfplan; then
        print_success "Terraform apply completed successfully"
    else
        print_error "Terraform apply failed"
        exit 1
    fi
    
    # Clean up plan file
    rm -f tfplan
}

update_ssm_parameters() {
    print_status "Updating SSM parameters with actual values..."
    
    # Check if required environment variables are set
    if [ -z "$SECRET_KEY" ]; then
        print_warning "SECRET_KEY not set. Please update manually:"
        print_status "aws ssm put-parameter --name '/ai-finance-manager/secret-key' --value 'YOUR_32_CHAR_SECRET' --type 'SecureString' --overwrite"
    else
        print_status "Updating SECRET_KEY parameter..."
        aws ssm put-parameter \
            --name "/ai-finance-manager/secret-key" \
            --value "$SECRET_KEY" \
            --type "SecureString" \
            --overwrite \
            --region "$AWS_REGION"
    fi
    
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        print_warning "ANTHROPIC_API_KEY not set. Please update manually:"
        print_status "aws ssm put-parameter --name '/ai-finance-manager/anthropic-api-key' --value 'sk-ant-YOUR_KEY' --type 'SecureString' --overwrite"
    else
        print_status "Updating ANTHROPIC_API_KEY parameter..."
        aws ssm put-parameter \
            --name "/ai-finance-manager/anthropic-api-key" \
            --value "$ANTHROPIC_API_KEY" \
            --type "SecureString" \
            --overwrite \
            --region "$AWS_REGION"
    fi
    
    # Optional Belvo parameters
    if [ -n "$BELVO_SECRET_ID" ]; then
        print_status "Updating BELVO_SECRET_ID parameter..."
        aws ssm put-parameter \
            --name "/ai-finance-manager/belvo-secret-id" \
            --value "$BELVO_SECRET_ID" \
            --type "SecureString" \
            --overwrite \
            --region "$AWS_REGION"
    fi
    
    if [ -n "$BELVO_SECRET_PASSWORD" ]; then
        print_status "Updating BELVO_SECRET_PASSWORD parameter..."
        aws ssm put-parameter \
            --name "/ai-finance-manager/belvo-secret-password" \
            --value "$BELVO_SECRET_PASSWORD" \
            --type "SecureString" \
            --overwrite \
            --region "$AWS_REGION"
    fi
    
    print_success "SSM parameters updated"
}

show_outputs() {
    print_status "Displaying deployment outputs..."
    
    # Show important outputs
    if command -v jq &> /dev/null; then
        print_status "=== Deployment Information ==="
        
        LOAD_BALANCER_URL=$(terraform output -raw load_balancer_url 2>/dev/null || echo "Not available")
        ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "Not available")
        S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "Not available")
        
        echo "  🌐 Application URL: $LOAD_BALANCER_URL"
        echo "  🐳 ECR Repository: $ECR_REPOSITORY_URL"
        echo "  📦 S3 Bucket: $S3_BUCKET_NAME"
        echo "  🏥 Health Check: $LOAD_BALANCER_URL/health"
        
        print_status "=== Next Steps ==="
        echo "  1. Build and push Docker image to ECR"
        echo "  2. Deploy ECS service with the new image"
        echo "  3. Run database migrations"
        echo "  4. Configure custom domain (if using one)"
        
    else
        print_status "Available outputs:"
        terraform output
    fi
}

terraform_destroy() {
    print_warning "This will DESTROY all infrastructure created by Terraform"
    print_warning "This action cannot be undone!"
    echo -n "Are you sure you want to continue? (type 'yes' to confirm): "
    read -r confirmation
    
    if [ "$confirmation" = "yes" ]; then
        print_status "Destroying Terraform infrastructure..."
        terraform destroy -auto-approve
        print_success "Infrastructure destroyed"
    else
        print_status "Destruction cancelled"
    fi
}

main() {
    echo -e "${BLUE}🚀 AI Finance Manager - Terraform Deployment${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo ""
    
    case "${1:-deploy}" in
        "init")
            check_prerequisites
            setup_terraform
            terraform_init
            ;;
        "plan")
            check_prerequisites
            setup_terraform
            terraform_init
            terraform_plan
            ;;
        "apply")
            check_prerequisites
            setup_terraform
            terraform_init
            terraform_apply
            update_ssm_parameters
            show_outputs
            ;;
        "deploy")
            check_prerequisites
            setup_terraform
            terraform_init
            terraform_plan
            
            # Ask for confirmation before applying
            echo ""
            print_warning "Review the plan above carefully"
            echo -n "Do you want to apply these changes? (y/N): "
            read -r apply_confirmation
            
            if [[ $apply_confirmation =~ ^[Yy]$ ]]; then
                terraform_apply
                update_ssm_parameters
                show_outputs
            else
                print_status "Deployment cancelled"
                rm -f "$TERRAFORM_DIR/tfplan"
            fi
            ;;
        "update-secrets")
            update_ssm_parameters
            ;;
        "outputs")
            cd "$TERRAFORM_DIR"
            show_outputs
            ;;
        "destroy")
            check_prerequisites
            setup_terraform
            terraform_init
            terraform_destroy
            ;;
        *)
            echo "Usage: $0 [init|plan|apply|deploy|update-secrets|outputs|destroy]"
            echo ""
            echo "Commands:"
            echo "  init           Initialize Terraform"
            echo "  plan           Create execution plan"
            echo "  apply          Apply configuration without confirmation"
            echo "  deploy         Full deployment with confirmation (default)"
            echo "  update-secrets Update SSM parameters with environment variables"
            echo "  outputs        Show deployment outputs"
            echo "  destroy        Destroy all infrastructure"
            exit 1
            ;;
    esac
    
    print_success "Operation completed successfully! 🎉"
}

# Change back to original directory on exit
trap 'cd ..' EXIT

# Run main function with all arguments
main "$@"