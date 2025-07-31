#!/usr/bin/env python3
"""
Standalone configuration validation script.
Used for deployment verification and CI/CD pipelines.
"""

import sys
import os
from pathlib import Path

# Add src to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.core.config_validation import run_startup_checks


def main():
    """Main function for standalone configuration validation."""
    print("🔧 AI Finance Manager - Configuration Validation")
    print("=" * 50)
    
    try:
        config = run_startup_checks()
        
        print("\n📋 Configuration Summary:")
        print(f"  Environment: {config.environment}")
        print(f"  Debug Mode: {config.debug}")
        print(f"  API Host: {config.api_host}")
        print(f"  API Port: {config.api_port}")
        print(f"  Log Level: {config.log_level}")
        
        if config.aws_region:
            print(f"  AWS Region: {config.aws_region}")
        
        if config.s3_bucket_name:
            print(f"  S3 Bucket: {config.s3_bucket_name}")
        
        print("\n🎉 Configuration validation completed successfully!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Configuration validation failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())