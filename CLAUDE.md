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
./scripts/lint.sh    # Run linter and formatter (Ruff)
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
ENVIRONMENT=development
DATABASE_URL=postgresql://user:password@localhost:5433/finance_db
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
- **Ruff** for code linting and formatting

### Application Structure

#### Frontend
- **Component-based Architecture**: TypeScript components with proper type safety
- **Tab-based Navigation**: Dashboard, Upload, Expenses, Budgets, and AI Insights tabs
- **Global State Management**: React Context for currency selection, authentication, and toast notifications
- **API Integration**: TanStack Query with intelligent caching and background refetching
- **UI Components**: Reusable components including modals, confirmation dialogs, and currency selectors
- **Type Safety**: Full TypeScript coverage with interfaces and proper typing

#### Backend
- **Modular Structure**: Organized using `src/` package with domain modules:
  - `src/auth/` - Authentication (JWT, users, permissions)
  - `src/expenses/` - Expense management and processing
  - `src/budgets/` - Budget tracking and calculations
  - `src/insights/` - AI-powered financial insights
  - `src/integrations/` - Bank integration system (Belvo)
  - `src/currency/` - Multi-currency support and conversion
  - `src/user_preferences/` - Unified user preferences management
  - `src/categories/` - Category management and operations
  - `src/upload_history/` - File upload tracking and history
  - `src/shared/` - Shared models, constants, and utilities
  - `src/database/` - Database configuration and connection
- **API Layer**: RESTful endpoints with proper HTTP status codes and error handling
- **Repository Pattern**: Clean separation between data access and business logic
- **Authentication**: JWT-based authentication with dependency injection
- **Environment-based Configuration**: Development vs production settings
- **Code Quality**: Ruff linting and formatting with comprehensive rules

### Core Features

#### 1. User Authentication & Privacy
- **JWT-based Authentication**: Secure login/signup system with password hashing
- **Privacy Mode**: Toggle to hide all financial amounts across the application
- **User Management**: Profile management with secure session handling
- **User Preferences**: Unified preference management system for currency, language, UI settings, and category preferences

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
- **User-aware AI Processing**: AI learns from user's category preferences for better categorization
- **Currency Detection**: AI identifies receipt currency and applies appropriate conversion
- **Upload History**: Complete tracking of upload status, success/failure states, and file details
- **Bulk Processing**: Handle multiple file uploads simultaneously

#### 5. Expense Management
- **Full CRUD Operations**: Create, read, update, delete expenses with proper validation
- **Advanced Filtering**: Filter by month, year, category with frontend and backend support
- **Edit Modal**: In-place editing with form validation and currency conversion
- **Category Management**: Predefined categories with icons and color coding (all capitalized)
- **User Category Preferences**: AI learns from user's merchant-category mappings for intelligent auto-categorization
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

#### 8. User Preferences System
- **Unified Management**: Centralized system for all user preference types
- **General Preferences**: Currency, language, and UI settings with validation
- **Category Preferences**: Merchant-category mappings for AI learning and auto-categorization
- **User Data Isolation**: Proper user-scoped data access and security
- **Extensible Architecture**: Ready for future preference types (notifications, privacy, etc.)
- **RESTful API**: Complete CRUD operations with proper validation and error handling
- **Database-backed**: Persistent storage with proper foreign key relationships

#### 9. Bank Integration System (Belvo)
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

### Backend Coding Standards & Best Practices

#### Code Organization
- **Absolute Imports**: Always use `from src.module` instead of relative imports
- **Domain Modules**: Group related functionality (auth, expenses, budgets, etc.)
- **Separation of Concerns**: Models, schemas, repositories, and services in separate files
- **Dependency Injection**: Use FastAPI's dependency system for database sessions and auth

#### Code Quality Tools
- **Ruff**: Primary linter and formatter - run `./scripts/lint.sh` before commits
- **Type Hints**: All functions must have proper type annotations
- **Pydantic Models**: Use for all API request/response validation
- **Docstrings**: Document all public functions and classes

#### Database Practices
- **Async Operations**: Always use `AsyncSession` for database operations
- **Repository Pattern**: Separate data access logic from business logic
- **Migrations**: Use Alembic for all schema changes with proper naming conventions
- **Connection Management**: Proper session handling with context managers

#### Migration Standards
- **Naming Convention**: Use `YYYY-MM-DD_descriptive_slug.py` format (e.g., `2025-01-29_add_user_preferences.py`)
- **Static & Revertable**: Migrations must be static and fully revertable
- **Descriptive Names**: Use clear, descriptive slugs that explain the changes
- **Data Independence**: If migrations depend on dynamic data, only the data should be dynamic, not the structure
- **Generation Command**: `uv run alembic revision --autogenerate -m "descriptive_slug"`

#### API Design
- **HTTP Status Codes**: Use appropriate status codes (200, 201, 400, 401, 404, 500)
- **Error Responses**: Consistent error format with proper error messages
- **Request/Response Models**: Pydantic schemas for all endpoints
- **OpenAPI Documentation**: Proper endpoint descriptions and examples
- **Environment Configuration**: Show docs only in development mode

#### Security
- **Authentication**: JWT tokens with proper expiration and validation
- **Password Hashing**: bcrypt for password storage
- **CORS Configuration**: Proper CORS settings for frontend integration
- **Input Validation**: Validate all inputs using Pydantic models
- **Error Messages**: Don't expose sensitive information in error responses

### Database Schema

#### Core Tables
- **Users**: Authentication and user management with email/username, password hashing
- **User Preferences**: General user settings (currency, language, UI preferences)
- **User Category Preferences**: Merchant-category mappings for AI learning
- **Categories**: Expense categories with user-scoped custom categories
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

#### User Preferences
- `GET /api/user/preferences/` - Get user preferences with available options
- `PUT /api/user/preferences/` - Update user preferences
- `PUT /api/user/preferences/currency/{currency}` - Update currency preference
- `PUT /api/user/preferences/language/{language}` - Update language preference
- `PUT /api/user/preferences/ui` - Update UI preferences
- `GET /api/user/preferences/categories` - List category preferences
- `POST /api/user/preferences/categories` - Create category preference
- `PUT /api/user/preferences/categories/{id}` - Update category preference
- `DELETE /api/user/preferences/categories/{id}` - Delete category preference
- `PUT /api/user/preferences/categories/merchant/{merchant_name}` - Quick merchant mapping
- `DELETE /api/user/preferences/categories/merchant/{merchant_name}` - Delete merchant mapping

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
11. ✅ Unified user preferences system with category learning
12. ✅ Auto-capitalized category names for consistency
13. ✅ User-aware AI processing with preference learning
14. ✅ Database-backed preference storage with proper isolation

### Frontend Coding Standards & Best Practices (React 19 + TypeScript)

#### Modern Component Architecture
- **Function Components Only**: Use function components exclusively over class components for better hooks integration and simpler code
- **Component Responsibility**: Components should only render elements based on data and trigger events - business logic belongs elsewhere
- **Small & Reusable**: Keep components small, focused, and reusable across the application
- **Single Responsibility**: Each component should have one clear purpose and render based on props/state

#### State Management Principles
- **State Colocation**: Keep state as close to the components that use it - avoid lifting state higher than necessary
- **Granular State**: Manage dependencies granularly - split large objects into specific state pieces to minimize re-renders
- **Single Source of Truth**: Same data should never exist in multiple state management solutions (Context + Redux, etc.)
- **Context for Global State**: Use Context API for application-wide state (theme, auth, locale) with React 19's `use()` API

#### Custom Hooks & Logic Separation
- **Custom Hooks as Ports**: Use custom hooks as abstraction layers between business logic and UI components
- **Logic Extraction**: Extract complex stateful logic into reusable custom hooks following the DRY principle
- **Business Logic Isolation**: Keep business logic separate from React-specific code for better testability
- **Hexagonal-Inspired Architecture**: Decouple domain logic from UI rendering using custom hooks as adapters

#### TypeScript Integration
- **Type-Safe Components**: Define clear interfaces for all component props with proper TypeScript typing
- **Generic Components**: Use TypeScript generics for highly reusable components that work with different data types
- **Type-Safe Hooks**: Implement custom hooks with proper generic typing and return type definitions
- **Strict Type Checking**: Enable strict TypeScript mode and avoid `any` types - use union types and proper interfaces

#### Performance Optimization
- **Monitor First, Optimize Later**: Use React Profiler, Core Web Vitals, and React Scan before optimizing
- **Strategic Memoization**: Use `React.memo`, `useCallback`, and `useMemo` only after identifying performance bottlenecks
- **React 19 Compiler**: Leverage React 19's automatic memoization when available
- **Key Optimization**: Always use unique, stable keys when rendering lists to prevent unnecessary re-renders

#### Data Fetching & Rendering Strategies
- **"Don't Make Me Wait" Philosophy**: Prioritize fast user interactions and perceived performance
- **Hybrid Rendering**: Combine different rendering strategies (SSR, SSG, CSR, ISR) based on content requirements
- **Server Components**: Use React Server Components for data-heavy, non-interactive content
- **Client Components**: Mark interactive components with `"use client"` directive
- **Streaming with Suspense**: Implement loading states with Suspense boundaries and skeleton components
- **SWR Pattern**: Use stale-while-revalidate for dynamic content that needs periodic updates

#### React 19 Modern Patterns
- **New Hooks**: Utilize `useActionState`, `useFormStatus`, `useOptimistic`, and `use()` API for better UX
- **Server Actions**: Implement server-side functions for form submissions and data mutations
- **Optimistic Updates**: Use `useOptimistic` for immediate UI feedback before server confirmation
- **Form Enhancement**: Leverage `useFormStatus` and `useActionState` for better form handling

#### Code Quality & Structure
- **Absolute Imports**: Use absolute imports with path mapping (e.g., `@/components/Button`)
- **Consistent Naming**: Follow consistent naming conventions (PascalCase for components, camelCase for functions)
- **Component Organization**: Group related components, hooks, and utilities in feature-based folders
- **Barrel Exports**: Use index.ts files for clean component exports from folders

#### Error Handling & Resilience
- **Error Boundaries**: Implement Error Boundaries to catch and handle component errors gracefully
- **Fallback UI**: Provide meaningful fallback components for error states and loading states
- **Graceful Degradation**: Ensure app functionality degrades gracefully when features fail
- **User Feedback**: Display clear error messages and loading indicators to users

#### Security Best Practices
- **XSS Prevention**: Always sanitize user input and avoid `dangerouslySetInnerHTML`
- **Environment Variables**: Use environment variables for API keys and sensitive configuration
- **Dependency Updates**: Keep npm packages updated to patch security vulnerabilities
- **CSP Headers**: Implement Content Security Policy headers for additional protection

#### Accessibility Standards
- **Semantic HTML**: Use proper HTML elements for their intended purpose
- **ARIA Attributes**: Implement ARIA attributes correctly without redundancy
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Screen Reader Support**: Test with screen readers and provide proper labels
- **AA Compliance**: Target WCAG 2.1 AA accessibility standards minimum

#### Testing Strategy
- **Comprehensive Testing**: Include unit tests, integration tests, E2E tests, and accessibility tests
- **80%+ Coverage**: Maintain test coverage above 80% for critical application paths
- **User-Focused Tests**: Write tests that reflect real user interactions and workflows
- **Component Testing**: Test components in isolation and integration with their dependencies

#### Performance Monitoring
- **Core Web Vitals**: Monitor LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift)
- **Bundle Analysis**: Regularly analyze and optimize JavaScript bundle sizes
- **Image Optimization**: Use Next.js `<Image/>` component with proper sizing and lazy loading
- **Code Splitting**: Implement dynamic imports and route-based code splitting

#### Development Workflow
- **Linting**: Use ESLint with React-specific rules and accessibility plugins
- **Formatting**: Implement Prettier for consistent code formatting
- **Type Checking**: Run TypeScript checks in CI/CD pipeline
- **Documentation**: Document components with JSDoc and maintain up-to-date README files