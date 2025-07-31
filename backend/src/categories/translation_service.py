"""
Category translation service using AI.

This module handles automatic translation of user-created category names
into all supported languages using the Anthropic Claude API.
"""

import json
import logging

import anthropic

from src.config import settings

logger = logging.getLogger(__name__)

# Supported languages for translation
SUPPORTED_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "pt": "Portuguese"
}

class CategoryTranslationService:
    """Service for translating category names using AI."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def translate_category_content(
        self,
        category_name: str,
        category_description: str = None,
        source_language: str = "auto"
    ) -> dict[str, dict[str, str]]:
        """
        Translate a category name and description into all supported languages.
        
        Args:
            category_name: The category name to translate
            category_description: The category description to translate (optional)
            source_language: Source language code (or "auto" for detection)
            
        Returns:
            Dictionary with 'name' and 'description' keys containing language translations
            Example: {
                "name": {"en": "Food", "es": "Alimentación", "pt": "Alimentação"},
                "description": {"en": "Food expenses", "es": "Gastos de alimentación", "pt": "Despesas de alimentação"}
            }
        """
        try:
            # Create translation prompt
            prompt = self._create_content_translation_prompt(category_name, category_description, source_language)

            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-haiku-20241022",  # Use cheaper model for simple translations
                max_tokens=400,  # Increased for descriptions
                temperature=0.1,  # Low temperature for consistent translations
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse the response
            translations = self._parse_content_translation_response(response.content[0].text)

            # Validate we have all required languages for name
            for lang_code in SUPPORTED_LANGUAGES:
                if lang_code not in translations.get("name", {}):
                    logger.warning(f"Missing name translation for language {lang_code}, using original name")
                    if "name" not in translations:
                        translations["name"] = {}
                    translations["name"][lang_code] = category_name

                # Validate descriptions if provided
                if category_description and lang_code not in translations.get("description", {}):
                    logger.warning(f"Missing description translation for language {lang_code}, using original description")
                    if "description" not in translations:
                        translations["description"] = {}
                    translations["description"][lang_code] = category_description

            return translations

        except Exception as e:
            logger.error(f"Failed to translate category '{category_name}': {e}")
            # Fallback: use original content for all languages
            fallback = {
                "name": dict.fromkeys(SUPPORTED_LANGUAGES.keys(), category_name)
            }
            if category_description:
                fallback["description"] = dict.fromkeys(SUPPORTED_LANGUAGES.keys(), category_description)
            return fallback

    def _create_content_translation_prompt(self, category_name: str, category_description: str = None, source_language: str = "auto") -> str:
        """Create a prompt for translating the category name and description."""
        language_list = ", ".join([f"{code} ({name})" for code, name in SUPPORTED_LANGUAGES.items()])

        content_info = f'Category name: "{category_name}"'
        if category_description:
            content_info += f'\nCategory description: "{category_description}"'

        example_response = {
            "name": {"en": "Dining Out", "es": "Comidas Fuera", "pt": "Refeições Fora"}
        }
        if category_description:
            example_response["description"] = {
                "en": "Meals and dining at restaurants",
                "es": "Comidas y cenas en restaurantes",
                "pt": "Refeições e jantares em restaurantes"
            }

        return f"""You are a financial category translation expert. Translate the expense category content into the following languages: {language_list}.

The category represents a type of expense that users track in their personal finance app. Provide translations that are:
1. Appropriate for personal finance/expense categorization
2. Commonly used terms that users would recognize  
3. Concise for names (1-2 words when possible), descriptive for descriptions
4. Culturally appropriate for each language

Source language: {source_language if source_language != "auto" else "auto-detect"}

{content_info}

Respond with ONLY a valid JSON object in this exact format:
{json.dumps(example_response, ensure_ascii=False)}{"" if not category_description else ""}

Note: Always include the "name" field. Only include "description" field if a description was provided.
"""

    def _parse_content_translation_response(self, response_text: str) -> dict[str, dict[str, str]]:
        """Parse the AI response and extract content translations."""
        try:
            # Clean up the response (remove any markdown or extra text)
            response_text = response_text.strip()

            # Find JSON object in response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON object found in response")

            json_str = response_text[start_idx:end_idx]
            translations = json.loads(json_str)

            # Validate the structure
            if not isinstance(translations, dict):
                raise ValueError("Response is not a dictionary")

            # Validate required 'name' field
            if "name" not in translations:
                raise ValueError("Missing 'name' field in translations")

            # Clean up translations (title case for names, proper case for descriptions)
            cleaned_translations = {}

            # Process name translations
            if isinstance(translations["name"], dict):
                cleaned_translations["name"] = {}
                for lang_code, translation in translations["name"].items():
                    if lang_code in SUPPORTED_LANGUAGES:
                        cleaned_translations["name"][lang_code] = str(translation).strip().title()

            # Process description translations if present
            if "description" in translations and isinstance(translations["description"], dict):
                cleaned_translations["description"] = {}
                for lang_code, translation in translations["description"].items():
                    if lang_code in SUPPORTED_LANGUAGES:
                        # Don't title case descriptions, just clean them
                        cleaned_translations["description"][lang_code] = str(translation).strip()

            return cleaned_translations

        except Exception as e:
            logger.error(f"Failed to parse content translation response: {e}")
            logger.error(f"Response text: {response_text}")
            raise ValueError(f"Invalid translation response format: {e}")

    def get_category_name_translation(self, category_name: str, language: str, translations: dict[str, dict[str, str]] = None) -> str:
        """
        Get a specific language translation for a category name.
        
        Args:
            category_name: Original category name
            language: Target language code
            translations: Pre-computed translations dictionary (optional)
            
        Returns:
            Translated category name or original if translation not available
        """
        if not translations or "name" not in translations:
            return category_name

        return translations["name"].get(language, category_name)

    def get_category_description_translation(self, category_description: str, language: str, translations: dict[str, dict[str, str]] = None) -> str:
        """
        Get a specific language translation for a category description.
        
        Args:
            category_description: Original category description
            language: Target language code
            translations: Pre-computed translations dictionary (optional)
            
        Returns:
            Translated category description or original if translation not available
        """
        if not translations or "description" not in translations or not category_description:
            return category_description

        return translations["description"].get(language, category_description)

    def populate_default_category_translations(self) -> dict[str, dict[str, dict[str, str]]]:
        """
        Get translations for default categories with names and descriptions.
        
        Returns:
            Dictionary mapping category names to their content translations
        """
        # These translations match what we have in the frontend translation files
        default_translations = {
            "Food": {
                "name": {"en": "Food", "es": "Alimentación", "pt": "Alimentação"},
                "description": {"en": "Food and dining expenses", "es": "Gastos de alimentación y restaurantes", "pt": "Despesas de alimentação e restaurantes"}
            },
            "Transport": {
                "name": {"en": "Transport", "es": "Transporte", "pt": "Transporte"},
                "description": {"en": "Transportation and travel costs", "es": "Costos de transporte y viajes", "pt": "Custos de transporte e viagens"}
            },
            "Shopping": {
                "name": {"en": "Shopping", "es": "Compras", "pt": "Compras"},
                "description": {"en": "Shopping and retail purchases", "es": "Compras y adquisiciones en tiendas", "pt": "Compras e aquisições em lojas"}
            },
            "Entertainment": {
                "name": {"en": "Entertainment", "es": "Entretenimiento", "pt": "Entretenimento"},
                "description": {"en": "Entertainment and leisure activities", "es": "Entretenimiento y actividades de ocio", "pt": "Entretenimento e atividades de lazer"}
            },
            "Utilities": {
                "name": {"en": "Utilities", "es": "Servicios", "pt": "Serviços"},
                "description": {"en": "Utilities and bills (electricity, water, internet)", "es": "Servicios y facturas (electricidad, agua, internet)", "pt": "Serviços e contas (eletricidade, água, internet)"}
            },
            "Healthcare": {
                "name": {"en": "Healthcare", "es": "Salud", "pt": "Saúde"},
                "description": {"en": "Healthcare and medical expenses", "es": "Gastos de salud y médicos", "pt": "Despesas de saúde e médicas"}
            },
            "Education": {
                "name": {"en": "Education", "es": "Educación", "pt": "Educação"},
                "description": {"en": "Education and learning expenses", "es": "Gastos de educación y aprendizaje", "pt": "Despesas de educação e aprendizagem"}
            },
            "Home": {
                "name": {"en": "Home", "es": "Hogar", "pt": "Casa"},
                "description": {"en": "Home and household expenses", "es": "Gastos del hogar y domésticos", "pt": "Despesas de casa e domésticas"}
            },
            "Clothing": {
                "name": {"en": "Clothing", "es": "Ropa", "pt": "Vestuário"},
                "description": {"en": "Clothing and fashion expenses", "es": "Gastos de ropa y moda", "pt": "Despesas de roupas e moda"}
            },
            "Technology": {
                "name": {"en": "Technology", "es": "Tecnología", "pt": "Tecnologia"},
                "description": {"en": "Technology and gadgets", "es": "Tecnología y dispositivos", "pt": "Tecnologia e dispositivos"}
            },
            "Fitness": {
                "name": {"en": "Fitness", "es": "Fitness", "pt": "Fitness"},
                "description": {"en": "Fitness and sports activities", "es": "Actividades de fitness y deportes", "pt": "Atividades de fitness e esportes"}
            },
            "Travel": {
                "name": {"en": "Travel", "es": "Viajes", "pt": "Viagem"},
                "description": {"en": "Travel and vacation expenses", "es": "Gastos de viajes y vacaciones", "pt": "Despesas de viagens e férias"}
            },
            "Gifts": {
                "name": {"en": "Gifts", "es": "Regalos", "pt": "Presentes"},
                "description": {"en": "Gifts and donations", "es": "Regalos y donaciones", "pt": "Presentes e doações"}
            },
            "Pets": {
                "name": {"en": "Pets", "es": "Mascotas", "pt": "Animais"},
                "description": {"en": "Pet care and expenses", "es": "Cuidado y gastos de mascotas", "pt": "Cuidados e despesas com animais"}
            },
            "Other": {
                "name": {"en": "Other", "es": "Otros", "pt": "Outros"},
                "description": {"en": "Other miscellaneous expenses", "es": "Otros gastos diversos", "pt": "Outras despesas diversas"}
            }
        }

        return default_translations
