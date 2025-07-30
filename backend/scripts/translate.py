#!/usr/bin/env python3
"""
CLI script for managing translations.

This script provides commands to extract translation keys from frontend files
and translate them using the backend translation API.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import List

import logging
import aiohttp
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)
    logger.debug(f"Loaded environment from {env_file}")
else:
    logger.warning(f"No .env file found at {env_file}")

from src.translations.service import TranslationService


async def make_request(method: str, url: str, data: dict = None) -> dict:
    """Make HTTP request to backend API."""
    async with aiohttp.ClientSession() as session:
        kwargs = {}
        if data:
            kwargs['json'] = data
        
        async with session.request(method, url, **kwargs) as response:
            if response.status >= 400:
                error_text = await response.text()
                raise Exception(f"API error {response.status}: {error_text}")
            
            return await response.json()


async def extract_keys(files: List[str], dry_run: bool = False):
    """Extract translation keys from frontend files."""
    logger.info(f"Extracting translation keys from {len(files)} files")
    
    service = TranslationService()
    result = service.extract_from_files(files, dry_run=dry_run)
    
    logger.info(f"✅ Extraction completed!")
    logger.info(f"   📊 Keys found: {result.keys_found}")
    logger.info(f"   🆕 New keys: {result.new_keys}")
    
    if result.new_keys > 0 and not dry_run:
        logger.info(f"   💾 Added {result.new_keys} new keys to en.json")
    
    return result


async def translate_missing(languages: List[str] = None, force: bool = False, batch_size: int = 50):
    """Translate missing strings using Anthropic Claude."""
    logger.info("Starting translation process...")
    
    service = TranslationService()
    result = await service.translate_missing(
        target_languages=languages,
        force=force,
        batch_size=batch_size
    )
    
    logger.info(f"✅ Translation completed!")
    logger.info(f"   🌐 Languages processed: {', '.join(result.languages_processed)}")
    logger.info(f"   📝 Total translated: {result.total_translated}")
    logger.info(f"   💰 Estimated cost: {result.estimated_cost}")
    
    # Show per-language details
    for language, details in result.details.items():
        status_emoji = "✅" if details['status'] == 'completed' else "⏭️" if details['status'] == 'up_to_date' else "❌"
        logger.info(f"   {status_emoji} {language}: {details['translated']} translated, {details['skipped']} skipped")
    
    return result


async def show_stats():
    """Show translation statistics."""
    logger.info("Fetching translation statistics...")
    
    service = TranslationService()
    languages = service.get_available_languages()
    
    logger.info("📊 Translation Statistics:")
    logger.info("-" * 50)
    
    for lang_code, lang_name in languages.items():
        try:
            data = service.get_translations(lang_code)
            stats = data.stats
            
            status_emoji = "✅" if stats.completion_percentage == 100 else "🚧" if stats.completion_percentage > 0 else "❌"
            logger.info(f"{status_emoji} {lang_name} ({lang_code}):")
            logger.info(f"   Progress: {stats.completion_percentage:.1f}%")
            logger.info(f"   Translated: {stats.translated_keys}/{stats.total_keys}")
            logger.info(f"   Missing: {stats.missing_keys}")
            
            if data.last_updated:
                logger.info(f"   Last updated: {data.last_updated}")
            
            logger.info("")
            
        except Exception as e:
            logger.error(f"❌ Failed to get stats for {lang_code}: {e}")


def get_frontend_files() -> List[str]:
    """Get list of frontend TypeScript/JavaScript files to scan."""
    frontend_dir = Path(__file__).parent.parent.parent / "finance-dashboard" / "src"
    
    if not frontend_dir.exists():
        raise Exception(f"Frontend directory not found: {frontend_dir}")
    
    files = []
    for ext in ["*.tsx", "*.ts", "*.jsx", "*.js"]:
        files.extend(frontend_dir.rglob(ext))
    
    # Convert to relative paths from frontend/src
    relative_files = []
    for file_path in files:
        try:
            relative_path = file_path.relative_to(frontend_dir)
            relative_files.append(str(relative_path))
        except ValueError:
            # Skip files outside frontend/src
            continue
    
    return relative_files


async def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="Translation management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract keys from frontend files
  python scripts/translate.py extract

  # Extract keys (dry run)
  python scripts/translate.py extract --dry-run

  # Translate missing strings for all languages
  python scripts/translate.py translate

  # Translate specific languages
  python scripts/translate.py translate --languages es pt

  # Force re-translate all strings
  python scripts/translate.py translate --force

  # Show translation statistics
  python scripts/translate.py stats

  # Full workflow: extract + translate
  python scripts/translate.py full
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Extract command
    extract_parser = subparsers.add_parser('extract', help='Extract translation keys from frontend files')
    extract_parser.add_argument('--files', nargs='*', help='Specific files to scan (default: all frontend files)')
    extract_parser.add_argument('--dry-run', action='store_true', help='Show what would be extracted without saving')
    
    # Translate command
    translate_parser = subparsers.add_parser('translate', help='Translate missing strings')
    translate_parser.add_argument('--languages', nargs='*', help='Languages to translate (default: all supported)')
    translate_parser.add_argument('--force', action='store_true', help='Re-translate all strings')
    translate_parser.add_argument('--batch-size', type=int, default=50, help='Number of strings per batch')
    
    # Stats command
    subparsers.add_parser('stats', help='Show translation statistics')
    
    # Full workflow command
    full_parser = subparsers.add_parser('full', help='Extract keys and translate (full workflow)')
    full_parser.add_argument('--languages', nargs='*', help='Languages to translate (default: all supported)')
    full_parser.add_argument('--force', action='store_true', help='Re-translate all strings')
    full_parser.add_argument('--batch-size', type=int, default=50, help='Number of strings per batch')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == 'extract':
            files = args.files if args.files else get_frontend_files()
            await extract_keys(files, dry_run=args.dry_run)
            
        elif args.command == 'translate':
            await translate_missing(
                languages=args.languages,
                force=args.force,
                batch_size=args.batch_size
            )
            
        elif args.command == 'stats':
            await show_stats()
            
        elif args.command == 'full':
            # Extract keys first
            files = get_frontend_files()
            logger.info("🔍 Step 1: Extracting translation keys...")
            await extract_keys(files, dry_run=False)
            
            logger.info("")
            logger.info("🌐 Step 2: Translating missing strings...")
            await translate_missing(
                languages=args.languages,
                force=args.force,
                batch_size=args.batch_size
            )
            
            logger.info("")
            logger.info("📊 Step 3: Final statistics...")
            await show_stats()
            
    except KeyboardInterrupt:
        logger.info("❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())