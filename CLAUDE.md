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
- **SQLAlchemy ORM** with AsyncSession for database operations
- **Pydantic** for data validation and serialization
- **Anthropic Claude API** for AI receipt processing and insights
- **JWT Authentication** for user authentication and authorization
- **uv** for Python dependency management

### Application Structure

#### Frontend
- **Component-based Architecture**: TypeScript components with proper type safety
- **Tab-based Navigation**: Dashboard, Upload, Expenses, Budgets, and AI Insights tabs
- **API Integration**: Communicates with backend via REST API calls
- **Type Safety**: Full TypeScript coverage with interfaces and proper typing

#### Backend
- **FastAPI Structure**: Organized into api/, models/, services/, utils/, db/, and core/
- **API Endpoints**: RESTful endpoints for expenses, budgets, AI insights, authentication, and upload history
- **Database Layer**: Repository pattern with SQLAlchemy models for expenses, budgets, users, insights, and upload history
- **Authentication**: JWT-based authentication with user management and protected routes
- **AI Service**: Centralized AI processing service using Anthropic Claude
- **Data Models**: Pydantic models for request/response validation

### Core Features
1. **User Authentication**: JWT-based login/signup system with secure password hashing
2. **Dashboard**: Financial overview with charts showing income vs expenses and category breakdowns
3. **Receipt Upload**: Drag-and-drop file upload with AI-powered expense extraction from PDFs and images
4. **Upload History**: Track upload status and history with success/failure states
5. **Expense Management**: Full CRUD operations for expenses with edit modal and filtering
6. **Budget Management**: Category-based budgets with visual progress tracking and overspending alerts
7. **AI Insights**: Personalized financial recommendations and spending analysis

### Data Flow
- **Frontend → Backend**: REST API communication via TanStack Query for intelligent caching
- **AI Processing**: Server-side processing with Anthropic Claude API for security and performance
- **Data Storage**: SQLAlchemy ORM with AsyncSession for database operations
- **State Management**: TanStack Query handles server state, React hooks for local state
- **Real-time Updates**: Automatic cache invalidation and background refetching

### Development Notes
- **Frontend**: TypeScript + React 19 + TanStack Query v5 for robust state management
- **Backend**: FastAPI + Python 3.12 + SQLAlchemy ORM + uv for ultra-fast dependency management
- **Database**: Async SQLAlchemy with repository pattern for clean data access
- **Authentication**: JWT tokens with secure password hashing and protected routes
- **API Communication**: RESTful design with automatic OpenAPI documentation
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Performance**: Optimized with query caching, async/await, and lazy loading
- **Type Safety**: Full TypeScript frontend and Pydantic backend validation
- **Development Experience**: Hot reload, automatic type checking, and modern tooling

### Database Schema
- **Users**: Authentication and user management with email/username
- **Expenses**: Transaction records with categories, amounts, and metadata
- **Budgets**: Category-based spending limits and tracking
- **Insights**: AI-generated financial recommendations and alerts  
- **Upload History**: File upload tracking with status and error messages