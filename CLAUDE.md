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
npm run typecheck    # Run TypeScript type checking
npm run preview      # Preview production build
```

The development server runs on http://localhost:5173

### Backend (backend/)
```bash
cd backend
uv sync              # Install dependencies with uv
uv run python run.py # Start FastAPI server
```

The backend server runs on http://localhost:8001

### Environment Setup

#### Frontend
Create `.env` file in `finance-dashboard/` directory:
```env
VITE_API_BASE_URL=http://localhost:8001
```

#### Backend
Create `.env` file in `backend/` directory:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Architecture Overview

This is a full-stack application with a React TypeScript frontend and FastAPI Python backend for AI-powered personal finance management.

### Frontend Technologies
- **React 19.1.0** with TypeScript and Vite 6.x for development
- **Tailwind CSS v4** for styling
- **Recharts** for data visualizations
- **Lucide React** for icons

### Backend Technologies
- **FastAPI** for REST API endpoints
- **Pydantic** for data validation and serialization
- **Anthropic Claude API** for AI receipt processing and insights
- **uv** for Python dependency management

### Application Structure

#### Frontend
- **Component-based Architecture**: TypeScript components with proper type safety
- **Tab-based Navigation**: Dashboard, Upload, Expenses, Budgets, and AI Insights tabs
- **API Integration**: Communicates with backend via REST API calls
- **Type Safety**: Full TypeScript coverage with interfaces and proper typing

#### Backend
- **FastAPI Structure**: Organized into api/, models/, services/, and utils/
- **API Endpoints**: RESTful endpoints for expenses, budgets, and AI insights
- **AI Service**: Centralized AI processing service using Anthropic Claude
- **Data Models**: Pydantic models for request/response validation

### Core Features
1. **Dashboard**: Financial overview with charts showing income vs expenses and category breakdowns
2. **Receipt Upload**: Drag-and-drop file upload with AI-powered expense extraction from PDFs and images
3. **Expense Tracking**: Transaction history with categorization and filtering
4. **Budget Management**: Category-based budgets with visual progress tracking and overspending alerts
5. **AI Insights**: Personalized financial recommendations and spending analysis

### Data Flow
- Frontend communicates with backend via REST API
- AI processing is handled server-side with Anthropic Claude API
- Data is stored in-memory (backend) - no persistent database yet
- All calculations and AI logic moved from frontend to backend

### Development Notes
- Frontend uses TypeScript for type safety and better development experience
- Backend uses FastAPI with async/await patterns
- CORS configured for cross-origin requests between frontend and backend
- Privacy mode functionality to hide/show financial amounts
- Responsive design with Tailwind CSS utilities