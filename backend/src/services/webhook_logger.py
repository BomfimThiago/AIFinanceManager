"""
Webhook logging service for comprehensive webhook tracking.

This service logs all webhook events to files for debugging and monitoring purposes.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class WebhookLogger:
    """Service for logging webhook events to files."""

    def __init__(self, log_directory: str = "webhook_logs"):
        """Initialize webhook logger.

        Args:
            log_directory: Directory to store webhook log files
        """
        self.log_directory = Path(log_directory)
        self.log_directory.mkdir(exist_ok=True)

        # Create separate log files for different purposes
        self.all_webhooks_file = self.log_directory / "all_webhooks.jsonl"
        self.processed_webhooks_file = self.log_directory / "processed_webhooks.jsonl"
        self.error_webhooks_file = self.log_directory / "error_webhooks.jsonl"

    def log_webhook_received(
        self,
        webhook_type: str,
        webhook_code: str,
        link_id: str,
        payload: dict[str, Any],
    ) -> None:
        """Log all received webhooks to file.

        Args:
            webhook_type: Type of webhook (e.g., 'TRANSACTIONS')
            webhook_code: Specific webhook code (e.g., 'historical_update')
            link_id: Belvo link ID
            payload: Complete webhook payload
        """
        timestamp = datetime.utcnow().isoformat()

        log_entry = {
            "timestamp": timestamp,
            "webhook_type": webhook_type,
            "webhook_code": webhook_code,
            "link_id": link_id,
            "webhook_id": payload.get("webhook_id"),
            "request_id": payload.get("request_id"),
            "external_id": payload.get("external_id"),
            "data": payload.get("data", {}),
            "full_payload": payload,
        }

        # Log to all webhooks file
        self._write_to_file(self.all_webhooks_file, log_entry)

        # Also log to console with nice formatting
        logger.info("=" * 80)
        logger.info("🔔 BELVO WEBHOOK RECEIVED")
        logger.info(f"   📋 Webhook ID: {payload.get('webhook_id', 'N/A')}")
        logger.info(f"   🔗 Link ID: {link_id}")
        logger.info(f"   📂 Type: {webhook_type}")
        logger.info(f"   🏷️  Code: {webhook_code}")
        logger.info(f"   🆔 Request ID: {payload.get('request_id', 'N/A')}")
        logger.info(f"   👤 External ID: {payload.get('external_id', 'N/A')}")
        logger.info(f"   📊 Data: {json.dumps(payload.get('data', {}), indent=4)}")
        logger.info("=" * 80)

    def log_webhook_processed(
        self,
        webhook_type: str,
        webhook_code: str,
        link_id: str,
        processing_result: dict[str, Any],
    ) -> None:
        """Log successfully processed webhooks.

        Args:
            webhook_type: Type of webhook
            webhook_code: Specific webhook code
            link_id: Belvo link ID
            processing_result: Result of processing (transactions fetched, etc.)
        """
        timestamp = datetime.utcnow().isoformat()

        log_entry = {
            "timestamp": timestamp,
            "webhook_type": webhook_type,
            "webhook_code": webhook_code,
            "link_id": link_id,
            "processing_result": processing_result,
            "status": "processed",
        }

        self._write_to_file(self.processed_webhooks_file, log_entry)

        logger.info(
            f"✅ WEBHOOK PROCESSED: {webhook_type}.{webhook_code} for link {link_id}"
        )
        logger.info(f"   📊 Result: {json.dumps(processing_result, indent=2)}")

    def log_webhook_error(
        self,
        webhook_type: str,
        webhook_code: str,
        link_id: str,
        error: Exception,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Log webhook processing errors.

        Args:
            webhook_type: Type of webhook
            webhook_code: Specific webhook code
            link_id: Belvo link ID
            error: Exception that occurred
            context: Additional context about the error
        """
        timestamp = datetime.utcnow().isoformat()

        log_entry = {
            "timestamp": timestamp,
            "webhook_type": webhook_type,
            "webhook_code": webhook_code,
            "link_id": link_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
            "status": "error",
        }

        self._write_to_file(self.error_webhooks_file, log_entry)

        logger.error(
            f"❌ WEBHOOK ERROR: {webhook_type}.{webhook_code} for link {link_id}"
        )
        logger.error(f"   🚨 Error: {error}")
        if context:
            logger.error(f"   📋 Context: {json.dumps(context, indent=2)}")

    def log_integration_lookup(
        self, link_id: str, found: bool, integration_id: int | None = None
    ) -> None:
        """Log integration lookup results.

        Args:
            link_id: Belvo link ID
            found: Whether integration was found
            integration_id: ID of found integration (if any)
        """
        if found:
            logger.info(f"🔍 Integration found for link {link_id}: ID {integration_id}")
        else:
            logger.warning(f"⚠️  No integration found for link_id: {link_id}")

    def log_transaction_summary(
        self, link_id: str, transaction_count: int, webhook_data: dict[str, Any]
    ) -> None:
        """Log transaction processing summary.

        Args:
            link_id: Belvo link ID
            transaction_count: Number of transactions processed
            webhook_data: Webhook data summary
        """
        logger.info(f"📊 Transaction Summary for link {link_id}:")
        logger.info(f"   📈 Transactions fetched: {transaction_count}")
        logger.info(f"   📋 Webhook data: {json.dumps(webhook_data, indent=2)}")

    def _write_to_file(self, file_path: Path, log_entry: dict[str, Any]) -> None:
        """Write log entry to file as JSON line.

        Args:
            file_path: Path to log file
            log_entry: Log entry to write
        """
        try:
            with open(file_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Failed to write to webhook log file {file_path}: {e}")


# Global webhook logger instance
webhook_logger = WebhookLogger()
