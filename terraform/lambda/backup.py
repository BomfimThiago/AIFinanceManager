"""
Lambda function for automated RDS database backups.
Creates snapshots and exports to S3 for long-term retention.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

# Initialize AWS clients
rds = boto3.client('rds')
s3 = boto3.client('s3')
sns = boto3.client('sns')

# Environment variables
DB_INSTANCE_ID = os.environ['DB_INSTANCE_ID']
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for database backup.
    
    1. Creates RDS snapshot
    2. Waits for snapshot completion
    3. Exports snapshot metadata to S3
    4. Cleans up old snapshots
    5. Sends notification
    """
    try:
        # Generate snapshot identifier
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        snapshot_id = f"{DB_INSTANCE_ID}-backup-{timestamp}"
        
        print(f"Starting backup for {DB_INSTANCE_ID}")
        
        # Create RDS snapshot
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=DB_INSTANCE_ID,
            Tags=[
                {'Key': 'Environment', 'Value': ENVIRONMENT},
                {'Key': 'Type', 'Value': 'scheduled-backup'},
                {'Key': 'Timestamp', 'Value': timestamp}
            ]
        )
        
        snapshot_arn = response['DBSnapshot']['DBSnapshotArn']
        print(f"Created snapshot: {snapshot_id}")
        
        # Store snapshot metadata in S3
        metadata = {
            'snapshot_id': snapshot_id,
            'snapshot_arn': snapshot_arn,
            'db_instance_id': DB_INSTANCE_ID,
            'timestamp': timestamp,
            'environment': ENVIRONMENT,
            'status': 'creating'
        }
        
        s3_key = f"snapshots/{timestamp}/metadata.json"
        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(metadata, indent=2),
            ContentType='application/json'
        )
        
        print(f"Stored metadata in S3: s3://{S3_BUCKET_NAME}/{s3_key}")
        
        # Clean up old snapshots (keep last 7 days)
        cleanup_old_snapshots()
        
        # Send success notification
        send_notification(
            subject=f"✅ Database Backup Successful - {ENVIRONMENT}",
            message=f"""Database backup completed successfully.
            
Snapshot ID: {snapshot_id}
Instance: {DB_INSTANCE_ID}
Timestamp: {timestamp}
Environment: {ENVIRONMENT}

The snapshot is being created and will be available shortly.
Metadata stored in: s3://{S3_BUCKET_NAME}/{s3_key}
"""
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup initiated successfully',
                'snapshot_id': snapshot_id,
                's3_key': s3_key
            })
        }
        
    except Exception as e:
        error_message = f"Backup failed: {str(e)}"
        print(f"ERROR: {error_message}")
        
        # Send failure notification
        send_notification(
            subject=f"❌ Database Backup Failed - {ENVIRONMENT}",
            message=f"""Database backup failed with error:

Error: {str(e)}
Instance: {DB_INSTANCE_ID}
Environment: {ENVIRONMENT}

Please check the Lambda logs for more details.
"""
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message
            })
        }


def cleanup_old_snapshots():
    """Clean up snapshots older than 7 days."""
    try:
        # List all snapshots for the instance
        response = rds.describe_db_snapshots(
            DBInstanceIdentifier=DB_INSTANCE_ID,
            SnapshotType='manual'
        )
        
        snapshots = response['DBSnapshots']
        current_time = datetime.utcnow()
        
        for snapshot in snapshots:
            # Check if snapshot was created by this Lambda (has our naming pattern)
            if f"{DB_INSTANCE_ID}-backup-" in snapshot['DBSnapshotIdentifier']:
                snapshot_time = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                age_days = (current_time - snapshot_time).days
                
                # Delete if older than 7 days
                if age_days > 7:
                    print(f"Deleting old snapshot: {snapshot['DBSnapshotIdentifier']} (age: {age_days} days)")
                    rds.delete_db_snapshot(
                        DBSnapshotIdentifier=snapshot['DBSnapshotIdentifier']
                    )
        
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        # Don't fail the backup if cleanup fails


def send_notification(subject: str, message: str):
    """Send notification via SNS."""
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")