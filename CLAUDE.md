# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (finance-dashboard/)
```bash
cd finance-dashboard
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

The development server runs on http://localhost:5173

### Environment Setup
Create `.env` file in `finance-dashboard/` directory:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Architecture Overview

This is a single-page React application for AI-powered personal finance management. The entire frontend is contained within a single main component.

### Key Technologies
- **React 19.1.0** with Vite 6.x for development
- **Tailwind CSS v4** for styling
- **Recharts** for data visualizations
- **Lucide React** for icons
- **Anthropic Claude API** for AI receipt processing and insights

### Application Structure
- **Single Component Architecture**: The entire app is built as one large `FinanceManager` component in `src/App.jsx`
- **Tab-based Navigation**: Dashboard, Upload, Expenses, Budgets, and AI Insights tabs
- **State Management**: All state is managed locally with React hooks
- **AI Integration**: Direct API calls to Anthropic Claude for receipt processing and financial insights

### Core Features
1. **Dashboard**: Financial overview with charts showing income vs expenses and category breakdowns
2. **Receipt Upload**: Drag-and-drop file upload with AI-powered expense extraction from PDFs and images
3. **Expense Tracking**: Transaction history with categorization and filtering
4. **Budget Management**: Category-based budgets with visual progress tracking and overspending alerts
5. **AI Insights**: Personalized financial recommendations and spending analysis

### Data Flow
- Expenses are stored in local state as an array of transaction objects
- Budgets are stored as an object mapping categories to limit/spent amounts
- AI processing converts uploaded files to base64 and sends to Claude API
- All data is ephemeral (no backend persistence)

### Key Functions
- `processFileWithAI()`: Handles receipt processing via Claude API
- `generateAIInsights()`: Creates personalized financial recommendations
- File handling with drag-and-drop support for PDFs and images

### Development Notes
- The app uses environment variables for API keys (VITE_ prefixed)
- All UI components are inline within the main component
- Privacy mode functionality to hide/show financial amounts
- Responsive design with Tailwind CSS utilities