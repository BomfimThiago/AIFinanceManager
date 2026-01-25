"""
AWS Bedrock implementation for Claude models.
More reliable than direct Anthropic API, no overload issues.
"""

import asyncio
import json
import logging
from datetime import datetime
from decimal import Decimal

import boto3
import dateparser
from botocore.exceptions import ClientError

from src.config import get_settings
from src.receipts.ai_parser import (
    UserCategoryContext,
    build_dynamic_prompt,
    extract_json_from_text,
    repair_json,
)
from src.receipts.schemas import ParsedItemData, ParsedReceiptData
from src.shared.constants import Currency

settings = get_settings()
logger = logging.getLogger(__name__)


class BedrockParser:
    """AWS Bedrock parser for receipts using Claude models.

    Advantages over direct Anthropic API:
    - No overload errors (AWS manages capacity)
    - Better availability and reliability
    - Same Claude models
    - Often faster response times
    - Better for production workloads
    """

    def __init__(self):
        """Initialize Bedrock client."""
        # Use Bedrock-specific region (may differ from main AWS region)
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=settings.bedrock_region
        )
        logger.info(f"Initialized Bedrock client in region: {settings.bedrock_region}")

        # Model IDs in Bedrock (as of 2025)
        self.model_id = "anthropic.claude-3-opus-20240229"  # Opus in Bedrock
        self.fallback_model = "anthropic.claude-3-sonnet-20240229"  # Sonnet fallback

    async def parse_receipt(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None = None,
    ) -> ParsedReceiptData:
        """Parse receipt using AWS Bedrock Claude.

        Args:
            ocr_text: The OCR-extracted text
            user_context: Optional user preferences

        Returns:
            ParsedReceiptData with extracted information
        """
        try:
            logger.info(f"Starting Bedrock AI parsing - text length: {len(ocr_text)}")

            # For large documents, chunk them
            if len(ocr_text) > 8000:
                logger.info(f"Processing large document in chunks")
                return await self._parse_in_chunks(ocr_text, user_context)

            # Regular processing
            return await self._parse_single(ocr_text, user_context)

        except Exception as e:
            logger.error(f"Bedrock parsing error: {e}", exc_info=True)
            return ParsedReceiptData()

    async def _parse_single(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None,
    ) -> ParsedReceiptData:
        """Parse a single document or chunk."""

        prompt = build_dynamic_prompt(user_context)

        # Bedrock uses a different message format
        messages = [
            {
                "role": "user",
                "content": f"{prompt}\n{ocr_text}"
            }
        ]

        # Try primary model first
        response_text = await self._call_bedrock(messages, self.model_id)

        if not response_text:
            # Try fallback model
            logger.warning("Primary model failed, trying fallback")
            response_text = await self._call_bedrock(messages, self.fallback_model)

        if not response_text:
            logger.error("Both models failed")
            return ParsedReceiptData()

        # Parse response
        return self._parse_response(response_text, user_context)

    async def _call_bedrock(self, messages: list, model_id: str) -> str | None:
        """Call AWS Bedrock with retry logic."""

        max_retries = 3
        retry_delay = 1

        for attempt in range(max_retries):
            try:
                # Prepare the request body for Claude in Bedrock
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4096,
                    "messages": messages,
                    "temperature": 0.1,  # Low temperature for consistency
                })

                # Invoke the model
                response = self.client.invoke_model(
                    modelId=model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=body
                )

                # Parse response
                response_body = json.loads(response['body'].read())
                return response_body.get('content', [{}])[0].get('text', '')

            except ClientError as e:
                error_code = e.response['Error']['Code']

                if error_code in ['ThrottlingException', 'ServiceUnavailableException']:
                    if attempt < max_retries - 1:
                        logger.warning(f"Bedrock throttled, retrying in {retry_delay}s...")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        logger.error(f"Bedrock failed after {max_retries} retries")
                        return None
                else:
                    logger.error(f"Bedrock error: {e}")
                    return None
            except Exception as e:
                logger.error(f"Unexpected Bedrock error: {e}")
                return None

        return None

    def _parse_response(
        self,
        response_text: str,
        user_context: UserCategoryContext | None,
    ) -> ParsedReceiptData:
        """Parse the AI response into structured data."""

        # Extract JSON from response
        json_str = extract_json_from_text(response_text)
        if not json_str:
            logger.error("No JSON found in Bedrock response")
            return ParsedReceiptData()

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse failed, attempting repair: {e}")
            repaired = repair_json(json_str)
            try:
                data = json.loads(repaired)
            except:
                logger.error("Failed to parse JSON from Bedrock response")
                return ParsedReceiptData()

        # Parse items with transaction dates
        items = []
        for item_data in data.get("items", []):
            try:
                # Parse transaction date if present
                transaction_date = None
                if item_data.get("transaction_date"):
                    parsed_date = dateparser.parse(
                        item_data["transaction_date"],
                        languages=['en', 'es', 'pt'],
                        settings={'STRICT_PARSING': False, 'RETURN_AS_TIMEZONE_AWARE': False}
                    )
                    if parsed_date:
                        transaction_date = parsed_date

                items.append(ParsedItemData(
                    name=item_data.get("name", "Unknown"),
                    quantity=Decimal(str(item_data.get("quantity", 1))),
                    unit_price=Decimal(str(item_data.get("unit_price", 0))),
                    total_price=Decimal(str(item_data.get("total_price", 0))),
                    category=item_data.get("category", "other_expense"),
                    transaction_date=transaction_date,
                ))
            except (ValueError, TypeError):
                continue

        # Parse main date
        purchase_date = None
        if data.get("purchase_date"):
            parsed_date = dateparser.parse(
                data["purchase_date"],
                languages=['en', 'es', 'pt'],
                settings={'STRICT_PARSING': False, 'RETURN_AS_TIMEZONE_AWARE': False}
            )
            if parsed_date:
                purchase_date = parsed_date

        # Parse currency
        currency = Currency.USD
        if data.get("currency") in [c.value for c in Currency]:
            currency = Currency(data["currency"])

        # Parse total amount
        total_amount = None
        if data.get("total_amount") is not None:
            try:
                total_amount = Decimal(str(data["total_amount"]))
            except:
                pass

        result = ParsedReceiptData(
            store_name=data.get("store_name"),
            total_amount=total_amount,
            currency=currency,
            purchase_date=purchase_date,
            category=data.get("category", "other"),
            items=items,
        )

        logger.info(f"Bedrock parsed: Store={result.store_name}, Total={result.total_amount}, Items={len(items)}")
        return result

    async def _parse_in_chunks(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None,
    ) -> ParsedReceiptData:
        """Process large documents in chunks."""

        # Split into chunks (similar to original parser)
        chunks = self._split_into_chunks(ocr_text)
        logger.info(f"Split into {len(chunks)} chunks")

        all_items = []
        store_name = None
        currency = Currency.USD
        purchase_date = None

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)}")
            result = await self._parse_single(chunk, user_context)

            all_items.extend(result.items)

            if not store_name and result.store_name:
                store_name = result.store_name
            if result.currency != Currency.USD:
                currency = result.currency
            if not purchase_date and result.purchase_date:
                purchase_date = result.purchase_date

        total_amount = sum(item.total_price for item in all_items) if all_items else None

        return ParsedReceiptData(
            store_name=store_name,
            total_amount=total_amount,
            currency=currency,
            purchase_date=purchase_date,
            category="other",
            items=all_items,
        )

    def _split_into_chunks(self, text: str, max_chunk_size: int = 6000) -> list[str]:
        """Split text into manageable chunks."""
        chunks = []
        current_chunk = ""

        lines = text.split("\n")
        for line in lines:
            if len(current_chunk) + len(line) + 1 <= max_chunk_size:
                current_chunk += line + "\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = line + "\n"

        if current_chunk:
            chunks.append(current_chunk)

        return chunks


def get_bedrock_parser() -> BedrockParser:
    """Get Bedrock parser instance."""
    return BedrockParser()