import { Expense, AIInsight, Budgets } from '../types';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

interface AIExpenseResponse {
  amount: number;
  date: string;
  merchant: string;
  category: string;
  description: string;
  items?: string[];
}

export const processFileWithAI = async (file: File): Promise<Expense | null> => {
  try {
    const base64Data = await convertFileToBase64(file);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: file.type,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `Please analyze this receipt/financial document and extract the following information in JSON format:
                {
                  "amount": number,
                  "date": "YYYY-MM-DD",
                  "merchant": "string",
                  "category": "string (Groceries, Utilities, Transport, Dining, Entertainment, Healthcare, or Other)",
                  "description": "string",
                  "items": ["list of items if receipt"]
                }
                
                Your entire response MUST be a single, valid JSON object. DO NOT include any text outside of the JSON structure.`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    let responseText = data.content[0].text;
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const expenseData: AIExpenseResponse = JSON.parse(responseText);
    
    return {
      id: Date.now(),
      ...expenseData,
      type: 'expense' as const,
      source: 'ai-processed' as const
    };
  } catch (error) {
    console.error('Error processing file with AI:', error);
    return null;
  }
};

interface AIInsightsResponse {
  insights: AIInsight[];
}

export const generateAIInsights = async (expenses: Expense[], budgets: Budgets): Promise<AIInsight[]> => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Analyze this financial data and provide 3-5 personalized insights and recommendations in JSON format:

            Expenses: ${JSON.stringify(expenses)}
            Budgets: ${JSON.stringify(budgets)}

            Respond with:
            {
              "insights": [
                {
                  "title": "string",
                  "message": "string",
                  "type": "warning|success|info",
                  "actionable": "string (specific recommendation)"
                }
              ]
            }

            Your entire response MUST be a single, valid JSON object.`
          }
        ]
      })
    });

    const data = await response.json();
    let responseText = data.content[0].text;
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const insightsData: AIInsightsResponse = JSON.parse(responseText);
    
    return insightsData.insights || [];
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [];
  }
};