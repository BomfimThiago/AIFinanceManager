"""
Translation API endpoints.
"""

from typing import Dict, List

import logging
from fastapi import APIRouter, HTTPException, status

logger = logging.getLogger(__name__)

from .models import (
    ExtractRequest,
    ExtractResponse,
    TranslateRequest,
    TranslateResponse,
    TranslationsResponse,
)
from .service import TranslationService

router = APIRouter(prefix="/api", tags=["translations"])

# Initialize translation service
translation_service = TranslationService()


@router.post("/admin/translations/extract", response_model=ExtractResponse)
async def extract_translation_keys(request: ExtractRequest) -> ExtractResponse:
    """
    Extract translation keys from frontend source files.
    
    This endpoint scans the provided files for t('key') patterns and
    adds any new keys to the master English translation file.
    """
    try:
        logger.info(f"Extracting translation keys from {len(request.files)} files")
        
        result = translation_service.extract_from_files(
            file_paths=request.files,
            dry_run=request.dry_run
        )
        
        logger.info(f"Extraction completed: {result.new_keys} new keys found")
        return result
        
    except Exception as e:
        logger.error(f"Translation extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract translation keys: {str(e)}"
        )


@router.post("/admin/translations/translate", response_model=TranslateResponse)
async def translate_missing_strings(request: TranslateRequest) -> TranslateResponse:
    """
    Translate missing strings using Anthropic Claude.
    
    This endpoint finds untranslated strings and uses AI to translate them
    into the specified target languages.
    """
    try:
        logger.info(f"Starting translation for languages: {request.target_languages}")
        
        result = await translation_service.translate_missing(
            target_languages=request.target_languages,
            force=request.force,
            batch_size=request.batch_size
        )
        
        logger.info(f"Translation completed: {result.total_translated} strings translated")
        return result
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to translate strings: {str(e)}"
        )


@router.get("/translations/{language}", response_model=TranslationsResponse)
async def get_translations(language: str) -> TranslationsResponse:
    """
    Get translations for a specific language.
    
    This endpoint returns the complete translation object for the frontend
    to use at runtime.
    """
    try:
        result = translation_service.get_translations(language)
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get translations for {language}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get translations: {str(e)}"
        )


@router.get("/translations", response_model=Dict[str, str])
async def get_available_languages() -> Dict[str, str]:
    """
    Get list of available languages.
    
    Returns a mapping of language codes to language names.
    """
    try:
        return translation_service.get_available_languages()
    except Exception as e:
        logger.error(f"Failed to get available languages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available languages"
        )


@router.get("/admin/translations/stats")
async def get_translation_stats() -> Dict[str, Dict]:
    """
    Get translation statistics for all languages.
    
    Returns completion percentages and other stats for each language.
    """
    try:
        stats = {}
        languages = translation_service.get_available_languages()
        
        for lang_code in languages.keys():
            translation_data = translation_service.get_translations(lang_code)
            stats[lang_code] = {
                "language_name": languages[lang_code],
                "completion_percentage": translation_data.stats.completion_percentage,
                "total_keys": translation_data.stats.total_keys,
                "translated_keys": translation_data.stats.translated_keys,
                "missing_keys": translation_data.stats.missing_keys,
                "last_updated": translation_data.last_updated
            }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get translation stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get translation statistics"
        )