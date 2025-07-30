#!/usr/bin/env python3
"""
Script to populate translations for existing default categories.

This script updates the database to add translations to default categories
that may have been created before the translation system was implemented.
"""

import asyncio
import logging
import sys
import os

# Add the parent directory to Python path to import from src
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from src.database import engine, AsyncSessionLocal
from src.categories.models import CategoryModel
from src.categories.translation_service import CategoryTranslationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def populate_default_category_translations():
    """Populate translations for existing default categories."""
    # Create translation service
    translation_service = CategoryTranslationService()
    
    async with AsyncSessionLocal() as session:
        try:
            # Get all default categories that need description translations
            # (categories that have name translations but no description translations)
            stmt = select(CategoryModel).where(
                CategoryModel.is_default == True
            )
            result = await session.execute(stmt)
            categories = result.scalars().all()
            
            if not categories:
                logger.info("No default categories found")
                return
            
            logger.info(f"Found {len(categories)} default categories to update with descriptions")
            
            # Get predefined translations for default categories
            default_translations = translation_service.populate_default_category_translations()
            
            for category in categories:
                if category.name in default_translations:
                    # Use predefined translations
                    translations = default_translations[category.name]
                    logger.info(f"Using predefined translations for '{category.name}': {translations}")
                else:
                    # Generate translations using AI (for any unexpected categories)
                    logger.info(f"Generating AI translations for '{category.name}'...")
                    try:
                        translations = await translation_service.translate_category_content(
                            category.name, 
                            category.description
                        )
                        logger.info(f"Generated translations for '{category.name}': {translations}")
                    except Exception as e:
                        logger.error(f"Failed to generate translations for '{category.name}': {e}")
                        # Use fallback translations (same name for all languages)
                        fallback = {
                            "name": {"en": category.name, "es": category.name, "pt": category.name}
                        }
                        if category.description:
                            fallback["description"] = {"en": category.description, "es": category.description, "pt": category.description}
                        translations = fallback
                
                # Update the category with translations
                stmt = update(CategoryModel).where(
                    CategoryModel.id == category.id
                ).values(translations=translations)
                
                await session.execute(stmt)
                logger.info(f"Updated translations for category '{category.name}'")
            
            # Commit all changes
            await session.commit()
            logger.info(f"Successfully updated translations for {len(categories)} categories")
            
        except Exception as e:
            logger.error(f"Error updating category translations: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(populate_default_category_translations())