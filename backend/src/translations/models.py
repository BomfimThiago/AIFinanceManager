"""
Translation models and schemas.
"""

from pydantic import Field

from src.shared.models import CustomModel


class TranslationKey(CustomModel):
    """Individual translation key."""

    key: str = Field(description="Translation key (e.g., 'header.title')")
    source: str = Field(description="Source text in English")
    context: str | None = Field(None, description="UI context for better translation")


class ExtractRequest(CustomModel):
    """Request to extract translation keys from files."""

    files: list[str] = Field(description="List of file paths to scan")
    dry_run: bool = Field(False, description="If true, don't save extracted keys")


class ExtractResponse(CustomModel):
    """Response from translation extraction."""

    keys_found: int = Field(description="Number of translation keys found")
    new_keys: int = Field(description="Number of new keys added")
    keys: list[TranslationKey] = Field(description="All found translation keys")


class TranslateRequest(CustomModel):
    """Request to translate missing strings."""

    target_languages: list[str] = Field(
        default=["es", "pt"], description="Languages to translate to"
    )
    force: bool = Field(False, description="Re-translate all strings")
    batch_size: int = Field(50, description="Number of strings per translation batch")


class TranslateResponse(CustomModel):
    """Response from translation."""

    languages_processed: list[str] = Field(description="Languages that were processed")
    total_translated: int = Field(description="Total number of strings translated")
    estimated_cost: str = Field(description="Estimated cost in USD")
    details: dict[str, dict] = Field(description="Per-language translation details")


class TranslationStats(CustomModel):
    """Translation statistics."""

    language: str = Field(description="Language code")
    total_keys: int = Field(description="Total translation keys")
    translated_keys: int = Field(description="Number of translated keys")
    missing_keys: int = Field(description="Number of missing translations")
    completion_percentage: float = Field(
        description="Translation completion percentage"
    )


class TranslationsResponse(CustomModel):
    """Response containing translations for a language."""

    language: str = Field(description="Language code")
    translations: dict = Field(description="Nested translation object")
    stats: TranslationStats = Field(description="Translation statistics")
    last_updated: str | None = Field(None, description="Last update timestamp")
