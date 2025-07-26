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
- **TanStack Query v5** for server state management and caching
- **React Context API** for global state (currency, authentication, toast notifications)

### Backend Technologies
- **FastAPI** for REST API endpoints with OpenAPI documentation
- **SQLAlchemy ORM** with AsyncSession for database operations
- **PostgreSQL** database with Alembic migrations
- **Pydantic** for data validation and serialization with proper response models
- **Anthropic Claude API** for AI receipt processing and insights
- **JWT Authentication** for user authentication and authorization
- **Frankfurter API** for real-time currency conversion
- **Belvo API** for bank integrations and transaction data in Latin America
- **aiohttp** for async HTTP requests
- **uv** for Python dependency management

### Application Structure

#### Frontend
- **Component-based Architecture**: TypeScript components with proper type safety
- **Tab-based Navigation**: Dashboard, Upload, Expenses, Budgets, and AI Insights tabs
- **Global State Management**: React Context for currency selection, authentication, and toast notifications
- **API Integration**: TanStack Query with intelligent caching and background refetching
- **UI Components**: Reusable components including modals, confirmation dialogs, and currency selectors
- **Type Safety**: Full TypeScript coverage with interfaces and proper typing

#### Backend
- **FastAPI Structure**: Organized into api/, models/, services/, utils/, db/, and core/
- **API Endpoints**: RESTful endpoints for expenses, budgets, AI insights, authentication, upload history, and currency conversion
- **Database Layer**: Repository pattern with SQLAlchemy models and Alembic migrations
- **Authentication**: JWT-based authentication with user management and protected routes
- **Currency Service**: Real-time exchange rates with historical rate freezing
- **AI Service**: Centralized AI processing service using Anthropic Claude with currency detection
- **Data Models**: Pydantic models for request/response validation with multi-currency support

### Core Features

#### 1. User Authentication & Privacy
- **JWT-based Authentication**: Secure login/signup system with password hashing
- **Privacy Mode**: Toggle to hide all financial amounts across the application
- **User Management**: Profile management with secure session handling

#### 2. Multi-Currency Support
- **Currency Selection**: Global currency selector (USD, EUR, BRL) with country flags
- **AI Currency Detection**: Automatic currency detection from uploaded receipts
- **Real-time Conversion**: Live exchange rates via Frankfurter API
- **Historical Rate Freezing**: Exchange rates stored at transaction time for accuracy
- **Pre-calculated Amounts**: All expenses store amounts in multiple currencies

#### 3. Dashboard & Analytics
- **Financial Overview**: Summary cards with total income, expenses, net savings, and budget count
- **Interactive Charts**: Line charts for income vs expenses, pie charts for category breakdown
- **Currency-aware Calculations**: All amounts displayed in selected currency with conversion notices
- **Real-time Updates**: Automatic data refresh with TanStack Query caching

#### 4. Receipt Upload & Processing
- **Drag-and-drop Upload**: Support for PDF receipts and images (JPG, PNG)
- **AI-powered Extraction**: Automatic expense data extraction using Anthropic Claude
- **Currency Detection**: AI identifies receipt currency and applies appropriate conversion
- **Upload History**: Complete tracking of upload status, success/failure states, and file details
- **Bulk Processing**: Handle multiple file uploads simultaneously

#### 5. Expense Management
- **Full CRUD Operations**: Create, read, update, delete expenses with proper validation
- **Advanced Filtering**: Filter by month, year, category with frontend and backend support
- **Edit Modal**: In-place editing with form validation and currency conversion
- **Category Management**: Predefined categories with icons and color coding
- **Add New Expenses**: Manual expense creation with category selection
- **Confirmation Modals**: Safe deletion with custom confirmation dialogs
- **Running Totals**: Real-time calculation of filtered expense totals

#### 6. Budget Management
- **Category-based Budgets**: Set spending limits for each expense category
- **Real-time Spending Calculation**: Backend-calculated actual spending vs stored amounts
- **Visual Progress Tracking**: Progress bars with percentage indicators and color coding
- **Overspending Alerts**: Visual warnings and indicators for budget overruns
- **Currency Conversion**: Budget amounts and spending displayed in selected currency
- **Budget Creation**: Easy budget setup with category selection and limit setting

#### 7. AI Insights & Analysis
- **Personalized Recommendations**: AI-generated financial insights and spending analysis
- **Loading States**: Visual feedback during AI processing with spinners and disabled states
- **Financial Health Score**: Automated scoring based on spending patterns and savings
- **Actionable Advice**: Specific recommendations for financial improvement
- **Interactive Generation**: Manual and automatic insight generation with progress indicators

#### 8. Bank Integration System (Belvo)
- **Widget Integration**: Secure Belvo widget for bank connections in Brazil and Mexico
- **Institution Management**: Automated synchronization of bank institution data from Belvo API
- **Multi-Bank Support**: Users can connect multiple banks with individual management
- **Transaction Sync**: Manual and automated transaction fetching with currency conversion
- **Connection Management**: Complete CRUD operations for bank integrations
- **Real-time Status**: Live connection status with institution logos and metadata
- **Webhook Support**: Asynchronous transaction processing via Belvo webhooks

### Data Flow
- **Frontend → Backend**: REST API communication via TanStack Query for intelligent caching
- **Currency Conversion**: Real-time exchange rates with Frankfurter API integration
- **AI Processing**: Server-side processing with Anthropic Claude API for security and performance
- **Data Storage**: PostgreSQL with SQLAlchemy ORM and AsyncSession for database operations
- **State Management**: TanStack Query handles server state, React Context for global state
- **Real-time Updates**: Automatic cache invalidation and background refetching
- **Multi-currency Flow**: Pre-calculated amounts stored, fallback to real-time conversion

### Technical Implementation Details

#### Currency System
- **Base Currency**: EUR used as base currency for storage and calculations
- **Supported Currencies**: USD, EUR, BRL with extensible enum system
- **Exchange Rate API**: Frankfurter API for free, unlimited currency conversion
- **Rate Storage**: Historical exchange rates frozen at transaction time
- **Conversion Logic**: Pre-calculated amounts preferred, current rates as fallback
- **Frontend Integration**: Global currency context with localStorage persistence

#### Authentication Flow
- **JWT Tokens**: Secure token-based authentication with expiration
- **Protected Routes**: Middleware-based route protection on backend
- **Frontend Guards**: Automatic redirect to login for unauthorized access
- **Password Security**: bcrypt hashing with salt for password storage
- **Session Management**: Token storage in localStorage with automatic cleanup

#### Database Architecture
- **Repository Pattern**: Clean separation between data access and business logic
- **Async Operations**: Full async/await support for database operations
- **Migration System**: Alembic for database schema versioning and migrations
- **Connection Pooling**: Async connection pooling with proper resource management
- **Data Validation**: Pydantic models for request/response validation

#### Performance Optimizations
- **Query Caching**: TanStack Query with intelligent cache invalidation
- **Background Refetching**: Automatic data updates in background
- **Lazy Loading**: Components and data loaded on demand
- **Optimistic Updates**: Immediate UI updates with server reconciliation
- **Debounced Search**: Efficient filtering with debounced input
- **Connection Pooling**: Database connection optimization

### Development Notes
- **Frontend**: TypeScript + React 19 + TanStack Query v5 + Tailwind CSS v4
- **Backend**: FastAPI + Python 3.12 + SQLAlchemy ORM + PostgreSQL + uv
- **Database**: Async SQLAlchemy with repository pattern and migration support
- **Authentication**: JWT tokens with secure password hashing and protected routes
- **API Communication**: RESTful design with automatic OpenAPI documentation
- **Error Handling**: Comprehensive error boundaries and API error handling with toast notifications
- **Type Safety**: Full TypeScript frontend and Pydantic backend validation
- **Development Experience**: Hot reload, automatic type checking, and modern tooling
- **Code Quality**: ESLint, TypeScript strict mode, and consistent code formatting

### Database Schema

#### Core Tables
- **Users**: Authentication and user management with email/username, password hashing
- **Expenses**: Transaction records with multi-currency support, categories, amounts, and metadata
- **Budgets**: Category-based spending limits with actual spending calculation
- **Insights**: AI-generated financial recommendations and alerts with type classification
- **Upload History**: File upload tracking with status, error messages, and file metadata

#### Multi-Currency Fields
- **original_currency**: Currency of the original transaction
- **amounts**: JSON field storing amounts in all supported currencies
- **exchange_rates**: JSON field storing historical exchange rates
- **exchange_date**: Timestamp when exchange rates were captured

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

#### Expenses
- `GET /api/expenses` - List expenses with filtering (month, year)
- `POST /api/expenses` - Create single expense
- `POST /api/expenses/bulk` - Create multiple expenses
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `POST /api/expenses/upload` - Upload and process receipt files
- `GET /api/expenses/category-spending` - Get spending by category with currency conversion
- `GET /api/expenses/summary` - Get expense summary data
- `GET /api/expenses/charts/categories` - Get category chart data
- `GET /api/expenses/charts/monthly` - Get monthly trend data

#### Budgets
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Create or update budget
- `PUT /api/budgets/{category}/spent` - Update spent amount
- `DELETE /api/budgets/{category}` - Delete budget

#### AI Insights
- `POST /api/insights/generate` - Generate AI insights

#### Upload History
- `GET /api/upload-history` - Get upload history
- `DELETE /api/upload-history/{id}` - Delete upload record

### UI Components

#### Reusable Components
- **ConfirmationModal**: Generic confirmation dialog with variants (danger, warning, info)
- **CurrencySelector**: Dropdown with country flags for currency selection
- **EditExpenseModal**: Modal for editing expense details with validation
- **Toast**: Notification system for success/error messages
- **SummaryCard**: Dashboard cards for financial metrics
- **Chart Components**: Line and pie charts with currency formatting

#### Context Providers
- **CurrencyContext**: Global currency state with formatting and conversion functions
- **AuthContext**: Authentication state and user management
- **ToastContext**: Toast notification management

### Key Features Implemented
1. ✅ Multi-currency support with real-time conversion
2. ✅ AI-powered receipt processing with currency detection
3. ✅ Advanced expense filtering and management
4. ✅ Budget tracking with real-time spending calculation
5. ✅ Confirmation modals for safe operations
6. ✅ Privacy mode for hiding amounts
7. ✅ Upload history tracking
8. ✅ AI insights with loading states
9. ✅ Currency conversion rate displays
10. ✅ Backend budget calculations for performance