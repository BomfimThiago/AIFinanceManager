#!/bin/bash

# AI Finance Manager - Database Backup and Restore Script
# Manual backup and restore operations for disaster recovery

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
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if pg_dump/pg_restore are installed
    if ! command -v pg_dump &> /dev/null || ! command -v pg_restore &> /dev/null; then
        print_error "PostgreSQL client tools not installed. Please install postgresql-client."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

get_database_info() {
    print_status "Getting database information from Terraform..."
    
    cd terraform
    terraform init -input=false > /dev/null 2>&1
    
    # Get database endpoint and credentials
    DB_ENDPOINT=$(terraform output -raw database_endpoint 2>/dev/null || echo "")
    S3_BACKUP_BUCKET=$(terraform output -raw backup_bucket_name 2>/dev/null || echo "")
    
    if [ -z "$DB_ENDPOINT" ]; then
        print_error "Could not get database endpoint from Terraform"
        exit 1
    fi
    
    # Get database credentials from SSM
    DB_URL=$(aws ssm get-parameter \
        --name "/ai-finance-manager/database-url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -z "$DB_URL" ]; then
        print_error "Could not get database URL from SSM Parameter Store"
        exit 1
    fi
    
    # Parse database URL
    DB_HOST=$(echo $DB_ENDPOINT | cut -d: -f1)
    DB_PORT=$(echo $DB_ENDPOINT | cut -d: -f2)
    DB_NAME="finance_manager"
    DB_USER="postgres"
    
    cd ..
    print_success "Database information retrieved"
}

create_manual_backup() {
    print_status "Creating manual database backup..."
    
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_NAME="${ENVIRONMENT}-manual-backup-${TIMESTAMP}"
    LOCAL_BACKUP_FILE="/tmp/${BACKUP_NAME}.sql"
    
    # Create database dump
    print_status "Dumping database..."
    PGPASSWORD=$(aws ssm get-parameter \
        --name "/ai-finance-manager/database-url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    export PGPASSWORD
    pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -f $LOCAL_BACKUP_FILE \
        --verbose \
        --no-owner \
        --no-privileges
    
    print_success "Database dumped to $LOCAL_BACKUP_FILE"
    
    # Compress backup
    print_status "Compressing backup..."
    gzip $LOCAL_BACKUP_FILE
    LOCAL_BACKUP_FILE="${LOCAL_BACKUP_FILE}.gz"
    
    # Upload to S3
    if [ -n "$S3_BACKUP_BUCKET" ]; then
        print_status "Uploading backup to S3..."
        aws s3 cp $LOCAL_BACKUP_FILE \
            "s3://${S3_BACKUP_BUCKET}/manual-backups/${BACKUP_NAME}.sql.gz" \
            --region $AWS_REGION
        
        print_success "Backup uploaded to S3"
    fi
    
    # Create RDS snapshot
    print_status "Creating RDS snapshot..."
    SNAPSHOT_ID="${ENVIRONMENT}-manual-snapshot-${TIMESTAMP}"
    
    DB_INSTANCE_ID=$(terraform -chdir=terraform output -raw ecs_cluster_name | sed 's/-cluster/-db/')
    
    aws rds create-db-snapshot \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-snapshot-identifier $SNAPSHOT_ID \
        --region $AWS_REGION
    
    print_success "RDS snapshot initiated: $SNAPSHOT_ID"
    
    # Clean up local file
    rm -f $LOCAL_BACKUP_FILE
    
    print_success "Manual backup completed successfully!"
    echo ""
    echo "Backup details:"
    echo "  - S3 Location: s3://${S3_BACKUP_BUCKET}/manual-backups/${BACKUP_NAME}.sql.gz"
    echo "  - RDS Snapshot: $SNAPSHOT_ID"
    echo "  - Timestamp: $TIMESTAMP"
}

list_backups() {
    print_status "Listing available backups..."
    
    echo ""
    echo "=== S3 Backups ==="
    if [ -n "$S3_BACKUP_BUCKET" ]; then
        aws s3 ls "s3://${S3_BACKUP_BUCKET}/manual-backups/" \
            --region $AWS_REGION \
            --human-readable \
            --summarize || echo "No S3 backups found"
    else
        echo "S3 backup bucket not configured"
    fi
    
    echo ""
    echo "=== RDS Snapshots ==="
    DB_INSTANCE_ID=$(terraform -chdir=terraform output -raw ecs_cluster_name | sed 's/-cluster/-db/')
    
    aws rds describe-db-snapshots \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBSnapshots[?contains(DBSnapshotIdentifier, `manual`)].{ID:DBSnapshotIdentifier,Status:Status,Created:SnapshotCreateTime,Size:AllocatedStorage}' \
        --output table \
        --region $AWS_REGION
}

restore_from_backup() {
    print_warning "This will restore the database from a backup"
    print_warning "ALL CURRENT DATA WILL BE LOST!"
    echo ""
    
    # List available backups
    list_backups
    
    echo ""
    echo -n "Enter the backup to restore (S3 filename or RDS snapshot ID): "
    read BACKUP_SOURCE
    
    echo -n "Are you ABSOLUTELY SURE you want to restore from this backup? (type 'yes' to confirm): "
    read CONFIRMATION
    
    if [ "$CONFIRMATION" != "yes" ]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    # Check if it's an S3 backup or RDS snapshot
    if [[ $BACKUP_SOURCE == *".sql.gz" ]]; then
        # Restore from S3 backup
        restore_from_s3 "$BACKUP_SOURCE"
    else
        # Restore from RDS snapshot
        restore_from_snapshot "$BACKUP_SOURCE"
    fi
}

restore_from_s3() {
    local S3_FILE=$1
    print_status "Restoring from S3 backup: $S3_FILE"
    
    # Download from S3
    LOCAL_RESTORE_FILE="/tmp/$(basename $S3_FILE)"
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/manual-backups/$S3_FILE" \
        $LOCAL_RESTORE_FILE \
        --region $AWS_REGION
    
    # Decompress
    gunzip $LOCAL_RESTORE_FILE
    LOCAL_RESTORE_FILE="${LOCAL_RESTORE_FILE%.gz}"
    
    # Drop and recreate database
    print_status "Preparing database for restore..."
    PGPASSWORD=$(aws ssm get-parameter \
        --name "/ai-finance-manager/database-url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text \
        --region $AWS_REGION | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    export PGPASSWORD
    
    # Drop existing connections
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
    
    # Drop and recreate database
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    # Restore from backup
    print_status "Restoring database..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $LOCAL_RESTORE_FILE
    
    # Clean up
    rm -f $LOCAL_RESTORE_FILE
    
    print_success "Database restored successfully from S3 backup!"
}

restore_from_snapshot() {
    local SNAPSHOT_ID=$1
    print_status "Restoring from RDS snapshot: $SNAPSHOT_ID"
    
    print_error "RDS snapshot restore creates a new database instance."
    print_error "This requires manual intervention to update the application configuration."
    print_status "Please use the AWS Console or CLI to restore the snapshot to a new instance,"
    print_status "then update the DATABASE_URL in SSM Parameter Store."
    
    echo ""
    echo "To restore manually:"
    echo "1. aws rds restore-db-instance-from-db-snapshot \\"
    echo "     --db-instance-identifier ${ENVIRONMENT}-restored-$(date +%Y%m%d) \\"
    echo "     --db-snapshot-identifier $SNAPSHOT_ID"
    echo "2. Update the DATABASE_URL parameter in SSM"
    echo "3. Restart the ECS service"
}

verify_backup() {
    print_status "Verifying last backup..."
    
    # Check last automated backup
    LAMBDA_NAME="${ENVIRONMENT}-ai-finance-db-backup"
    
    # Get last invocation
    LAST_LOG=$(aws logs describe-log_streams \
        --log-group-name "/aws/lambda/$LAMBDA_NAME" \
        --order-by LastEventTime \
        --descending \
        --limit 1 \
        --query 'logStreams[0].logStreamName' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -n "$LAST_LOG" ]; then
        print_status "Last automated backup log:"
        aws logs get-log-events \
            --log-group-name "/aws/lambda/$LAMBDA_NAME" \
            --log-stream-name "$LAST_LOG" \
            --limit 50 \
            --query 'events[?contains(message, `SUCCESS`) || contains(message, `ERROR`)].message' \
            --output text \
            --region $AWS_REGION | tail -10
    else
        print_warning "No automated backup logs found"
    fi
    
    # Check backup age
    LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
        --db-instance-identifier $(terraform -chdir=terraform output -raw ecs_cluster_name | sed 's/-cluster/-db/') \
        --query 'DBSnapshots[0].SnapshotCreateTime' \
        --output text \
        --region $AWS_REGION 2>/dev/null || echo "")
    
    if [ -n "$LATEST_SNAPSHOT" ]; then
        echo ""
        print_status "Latest snapshot created: $LATEST_SNAPSHOT"
    fi
}

main() {
    echo -e "${BLUE}🗄️  AI Finance Manager - Database Backup & Restore${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo ""
    
    check_prerequisites
    get_database_info
    
    case "${1:-menu}" in
        "backup")
            create_manual_backup
            ;;
        "list")
            list_backups
            ;;
        "restore")
            restore_from_backup
            ;;
        "verify")
            verify_backup
            ;;
        "menu")
            echo "Available commands:"
            echo "  backup  - Create a manual backup"
            echo "  list    - List available backups"
            echo "  restore - Restore from a backup"
            echo "  verify  - Verify backup status"
            echo ""
            echo -n "Choose an option: "
            read OPTION
            $0 $OPTION
            ;;
        *)
            echo "Usage: $0 [backup|list|restore|verify]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"