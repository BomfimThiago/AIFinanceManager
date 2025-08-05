"""
Translation service using Anthropic Claude.
"""

import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

import anthropic

from src.translations.models import (
    ExtractResponse,
    TranslateResponse,
    TranslationKey,
    TranslationsResponse,
    TranslationStats,
)

logger = logging.getLogger(__name__)


class TranslationService:
    """Service for handling translations using Anthropic Claude."""

    # Supported languages with their full names for better translation context
    SUPPORTED_LANGUAGES = {
        "es": "Spanish (Spain/Latin America)",
        "pt": "Portuguese (Brazilian)",
    }

    # Translation key pattern: t('key') or t("key")
    TRANSLATION_PATTERN = re.compile(r't\([\'"]([^\'"]+)[\'"]\)')

    def __init__(self):
        """Initialize translation service."""
        self.anthropic_client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        # Get the backend directory dynamically
        backend_dir = Path(__file__).parent.parent.parent
        self.locales_dir = backend_dir / "src" / "translations" / "locales"
        self.locales_dir.mkdir(parents=True, exist_ok=True)

        # Initialize master English file if it doesn't exist
        self._ensure_master_file()

    def _ensure_master_file(self) -> None:
        """Ensure the master English translation file exists."""
        en_file = self.locales_dir / "en.json"
        if not en_file.exists():
            initial_translations = {
                "header": {
                    "title": "Konta",
                    "hideAmounts": "Hide amounts",
                    "showAmounts": "Show amounts",
                    "preferences": "Preferences",
                    "signOut": "Sign out",
                },
                "navigation": {
                    "dashboard": "Dashboard",
                    "upload": "Upload",
                    "expenses": "Expenses",
                    "budgets": "Budgets",
                    "categories": "Categories",
                    "insights": "AI Insights",
                    "integrations": "Integrations",
                },
                "common": {
                    "loading": "Loading...",
                    "error": "Error",
                    "success": "Success",
                    "cancel": "Cancel",
                    "save": "Save",
                    "delete": "Delete",
                    "edit": "Edit",
                    "add": "Add",
                    "close": "Close",
                },
            }
            self._save_json(en_file, initial_translations)
            logger.info("Created initial English translation file")

    def _load_json(self, file_path: Path) -> dict:
        """Load JSON file safely."""
        try:
            if file_path.exists():
                with open(file_path, encoding="utf-8") as f:
                    content = f.read().strip()
                    return json.loads(content) if content else {}
            return {}
        except Exception as e:
            logger.warning(f"Could not load {file_path}: {e}")
            return {}

    def _save_json(self, file_path: Path, data: dict) -> None:
        """Save JSON file with pretty formatting."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    def _get_all_keys(self, obj: dict, prefix: str = "") -> list[str]:
        """Get all keys from nested object."""
        keys = []
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, dict):
                keys.extend(self._get_all_keys(value, full_key))
            else:
                keys.append(full_key)
        return keys

    def _get_value(self, obj: dict, key: str) -> str | None:
        """Get value from nested object using dot notation."""
        try:
            keys = key.split(".")
            current = obj
            for k in keys:
                current = current[k]
            return current
        except (KeyError, TypeError):
            return None

    def _set_value(self, obj: dict, key: str, value: str) -> None:
        """Set value in nested object using dot notation."""
        keys = key.split(".")
        current = obj
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value

    def extract_from_files(
        self, file_paths: list[str], dry_run: bool = False
    ) -> ExtractResponse:
        """Extract translation keys from source files."""
        logger.info(f"Extracting translation keys from {len(file_paths)} files")

        all_keys = set()
        key_details = []

        for file_path in file_paths:
            try:
                # Convert to absolute path
                abs_path = Path(file_path)
                if not abs_path.is_absolute():
                    # Assume relative to frontend src directory
                    backend_dir = Path(__file__).parent.parent.parent
                    frontend_src = backend_dir.parent / "finance-dashboard" / "src"
                    abs_path = frontend_src / file_path

                if not abs_path.exists():
                    logger.warning(f"File not found: {abs_path}")
                    continue

                with open(abs_path, encoding="utf-8") as f:
                    content = f.read()

                # Find all translation keys
                matches = self.TRANSLATION_PATTERN.findall(content)
                for match in matches:
                    all_keys.add(match)

                logger.debug(f"Found {len(matches)} keys in {abs_path.name}")

            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")

        # Load existing translations
        en_file = self.locales_dir / "en.json"
        existing_translations = self._load_json(en_file)
        existing_keys = set(self._get_all_keys(existing_translations))

        # Find new keys
        new_keys = all_keys - existing_keys

        # Create key details
        key_details = [
            TranslationKey(
                key=key,
                source=self._get_value(existing_translations, key) or f"TODO: {key}",
                context=self._infer_context(key),
            )
            for key in sorted(all_keys)
        ]

        if not dry_run and new_keys:
            # Add new keys to master file with placeholder values
            updated_translations = existing_translations.copy()
            for key in new_keys:
                placeholder = f"TODO: {key.split('.')[-1].replace('_', ' ').title()}"
                self._set_value(updated_translations, key, placeholder)

            self._save_json(en_file, updated_translations)
            logger.info(f"Added {len(new_keys)} new keys to {en_file}")

        return ExtractResponse(
            keys_found=len(all_keys), new_keys=len(new_keys), keys=key_details
        )

    def _infer_context(self, key: str) -> str:
        """Infer UI context from translation key."""
        parts = key.split(".")

        context_map = {
            "header": "Header/Navigation bar",
            "navigation": "Navigation menu",
            "dashboard": "Dashboard page",
            "expenses": "Expenses page",
            "budgets": "Budgets page",
            "common": "Common UI elements",
            "button": "Button label",
            "modal": "Modal dialog",
            "form": "Form field",
            "error": "Error message",
            "success": "Success message",
        }

        for part in parts:
            if part in context_map:
                return context_map[part]

        return "UI element"

    async def translate_missing(
        self,
        target_languages: list[str] | None = None,
        force: bool = False,
        batch_size: int = 50,
    ) -> TranslateResponse:
        """Translate missing strings using Anthropic Claude."""
        if target_languages is None:
            target_languages = list(self.SUPPORTED_LANGUAGES.keys())

        logger.info(f"Starting translation for languages: {target_languages}")

        # Load source translations
        en_file = self.locales_dir / "en.json"
        source_data = self._load_json(en_file)

        if not source_data:
            raise ValueError("No source translations found in en.json")

        total_translated = 0
        details = {}

        for language in target_languages:
            if language not in self.SUPPORTED_LANGUAGES:
                logger.warning(f"Unsupported language: {language}")
                continue

            lang_file = self.locales_dir / f"{language}.json"
            target_data = self._load_json(lang_file)

            # Find missing translations
            missing_keys = []
            source_keys = self._get_all_keys(source_data)

            for key in source_keys:
                if force or not self._get_value(target_data, key):
                    source_text = self._get_value(source_data, key)
                    if (
                        source_text
                        and isinstance(source_text, str)
                        and not source_text.startswith("TODO:")
                    ):
                        missing_keys.append(
                            {
                                "key": key,
                                "source": source_text,
                                "context": self._infer_context(key),
                            }
                        )

            logger.info(
                f"Found {len(missing_keys)} strings to translate for {language}"
            )

            if not missing_keys:
                details[language] = {
                    "translated": 0,
                    "skipped": 0,
                    "status": "up_to_date",
                }
                continue

            # Process in batches
            translated_count = 0
            updated_data = target_data.copy()

            for i in range(0, len(missing_keys), batch_size):
                batch = missing_keys[i : i + batch_size]
                logger.info(
                    f"Translating batch {i // batch_size + 1}/{(len(missing_keys) + batch_size - 1) // batch_size} for {language}"
                )

                try:
                    translations = await self._translate_batch(batch, language)

                    # Apply translations
                    for key, translation in translations.items():
                        self._set_value(updated_data, key, translation)
                        translated_count += 1

                except Exception as e:
                    logger.error(f"Failed to translate batch for {language}: {e}")
                    continue

            # Save updated translations
            if translated_count > 0:
                self._save_json(lang_file, updated_data)
                logger.info(f"Saved {translated_count} translations for {language}")

            total_translated += translated_count
            details[language] = {
                "translated": translated_count,
                "skipped": len(missing_keys) - translated_count,
                "status": "completed" if translated_count > 0 else "failed",
            }

        # Estimate cost (roughly $0.25 per 1M input tokens, $1.25 per 1M output tokens for Haiku)
        estimated_tokens = total_translated * 20  # Rough estimate
        estimated_cost = (
            estimated_tokens / 1_000_000
        ) * 1.50  # Combined input/output cost

        return TranslateResponse(
            languages_processed=target_languages,
            total_translated=total_translated,
            estimated_cost=f"${estimated_cost:.4f}",
            details=details,
        )

    async def _translate_batch(
        self, batch: list[dict], target_language: str
    ) -> dict[str, str]:
        """Translate a batch of strings using Anthropic Claude."""
        strings_obj = {item["key"]: item["source"] for item in batch}

        # Add context information
        context_info = "\n".join(
            [
                f"- {item['key']}: {item['context']}"
                for item in batch
                if item.get("context")
            ]
        )

        prompt = f"""You are a professional translator for a personal finance web application.
Translate the following UI strings from English to {self.SUPPORTED_LANGUAGES[target_language]}.

Context: This is a personal finance management application where users track expenses, budgets, and view financial insights.

UI Context for better translation:
{context_info}

Important guidelines:
- Keep technical terms consistent (e.g., "Dashboard" can stay as "Dashboard")
- For financial terms, use commonly understood terms in the target language
- Maintain professional but friendly tone
- Keep placeholders and special characters exactly as they are
- For button labels, use imperative form when appropriate
- Consider cultural context for financial terminology

Strings to translate:
{json.dumps(strings_obj, indent=2, ensure_ascii=False)}

Return ONLY a valid JSON object with the translations (same keys, translated values):"""

        try:
            message = self.anthropic_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text

            # Extract JSON from response
            json_match = re.search(r"\{[\s\S]*\}", response_text)
            if not json_match:
                raise ValueError("No valid JSON found in response")

            translations = json.loads(json_match.group(0))
            logger.debug(f"Successfully translated {len(translations)} strings")

            return translations

        except Exception as e:
            logger.error(f"Translation API call failed: {e}")
            raise

    def get_translations(self, language: str) -> TranslationsResponse:
        """Get translations for a specific language."""
        if language not in ["en", *list(self.SUPPORTED_LANGUAGES.keys())]:
            raise ValueError(f"Unsupported language: {language}")

        lang_file = self.locales_dir / f"{language}.json"
        translations = self._load_json(lang_file)

        # Calculate statistics
        if language == "en":
            stats = TranslationStats(
                language=language,
                total_keys=len(self._get_all_keys(translations)),
                translated_keys=len(self._get_all_keys(translations)),
                missing_keys=0,
                completion_percentage=100.0,
            )
        else:
            en_file = self.locales_dir / "en.json"
            source_data = self._load_json(en_file)
            source_keys = set(self._get_all_keys(source_data))
            target_keys = set(self._get_all_keys(translations))

            total_keys = len(source_keys)
            translated_keys = len(target_keys.intersection(source_keys))
            missing_keys = total_keys - translated_keys
            completion_percentage = (
                (translated_keys / total_keys * 100) if total_keys > 0 else 0
            )

            stats = TranslationStats(
                language=language,
                total_keys=total_keys,
                translated_keys=translated_keys,
                missing_keys=missing_keys,
                completion_percentage=completion_percentage,
            )

        # Get last modified time
        last_updated = None
        if lang_file.exists():
            mtime = lang_file.stat().st_mtime
            last_updated = datetime.fromtimestamp(mtime).isoformat()

        return TranslationsResponse(
            language=language,
            translations=translations,
            stats=stats,
            last_updated=last_updated,
        )

    def get_available_languages(self) -> dict[str, str]:
        """Get list of available languages."""
        return {"en": "English", **self.SUPPORTED_LANGUAGES}
