import base64
import json
import logging
from typing import Optional, List, Dict
from anthropic import Anthropic
from app.models.expense import Expense, AIInsight
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process_file_with_ai(self, file_content: bytes, file_type: str) -> Optional[Expense]:
        """Process uploaded file (receipt/document) and extract expense information."""
        try:
            # Convert file to base64
            base64_data = base64.b64encode(file_content).decode()

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": file_type,
                                    "data": base64_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": """Please analyze this receipt/financial document and extract the following information in JSON format:
                                {
                                  "amount": number,
                                  "date": "YYYY-MM-DD",
                                  "merchant": "string",
                                  "category": "string (Groceries, Utilities, Transport, Dining, Entertainment, Healthcare, or Other)",
                                  "description": "string",
                                  "items": ["list of items if receipt"]
                                }
                                
                                Your entire response MUST be a single, valid JSON object. DO NOT include any text outside of the JSON structure."""
                            }
                        ]
                    }
                ]
            )

            response_text = message.content[0].text
            response_text = response_text.replace("```json\n", "").replace("```", "").strip()
            expense_data = json.loads(response_text)
            
            return Expense(
                id=0,  # Will be set by the API endpoint
                amount=expense_data["amount"],
                date=expense_data["date"],
                merchant=expense_data["merchant"],
                category=expense_data["category"],
                description=expense_data["description"],
                items=expense_data.get("items"),
                type="expense",
                source="ai-processed"
            )

        except Exception as error:
            logger.error(f"Error processing file with AI: {error}")
            return None

    async def generate_insights(self, expenses: List[Expense], budgets: Dict[str, Dict[str, float]]) -> List[AIInsight]:
        """Generate AI-powered financial insights based on expenses and budgets."""
        try:
            # Convert expenses to dict for JSON serialization
            expenses_data = [expense.dict() for expense in expenses]

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Analyze this financial data and provide 3-5 personalized insights and recommendations in JSON format:

                        Expenses: {json.dumps(expenses_data)}
                        Budgets: {json.dumps(budgets)}

                        Respond with:
                        {{
                          "insights": [
                            {{
                              "title": "string",
                              "message": "string",
                              "type": "warning|success|info",
                              "actionable": "string (specific recommendation)"
                            }}
                          ]
                        }}

                        Your entire response MUST be a single, valid JSON object."""
                    }
                ]
            )

            response_text = message.content[0].text
            response_text = response_text.replace("```json\n", "").replace("```", "").strip()
            insights_data = json.loads(response_text)
            
            return [AIInsight(**insight) for insight in insights_data.get("insights", [])]

        except Exception as error:
            logger.error(f"Error generating AI insights: {error}")
            return []


# Global instance
ai_service = AIService()