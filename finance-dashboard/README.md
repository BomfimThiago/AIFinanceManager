# Frontend - AI Finance Manager

A modern React TypeScript frontend application with TanStack Query for state management, Tailwind CSS for styling, and comprehensive TypeScript integration.

## 🏗️ Architecture Overview

This frontend follows modern React best practices with a component-based architecture:

```
src/
├── components/              # React components
│   ├── layout/             # Layout components (Header, Navigation)
│   ├── pages/              # Page-level components (Dashboard, Upload, etc.)
│   └── ui/                 # Reusable UI components (Chart, SummaryCard)
├── hooks/                  # Custom React hooks
│   ├── queries/            # TanStack Query hooks
│   │   ├── useExpensesQuery.ts
│   │   ├── useBudgetsQuery.ts
│   │   └── useInsightsQuery.ts
│   └── usePrivacyMode.ts   # Custom hooks
├── services/               # API communication layer
│   └── apiService.ts       # Centralized API calls
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared interfaces and types
├── utils/                  # Utility functions
│   ├── calculations.ts     # Financial calculations
│   └── formatters.ts       # Data formatting helpers
├── constants/              # Application constants
│   └── categories.ts       # Expense categories with icons
├── App.tsx                 # Main application component
└── main.tsx                # Application entry point
```

## 🛠️ Technology Stack

- **Framework**: React 19.1.0 with TypeScript for type safety
- **Build Tool**: Vite 6.x for fast development and building
- **Styling**: Tailwind CSS v4 for utility-first styling
- **State Management**: TanStack Query v5 for server state management
- **Data Visualization**: Recharts for interactive charts
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Native Fetch API with TypeScript wrappers

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Backend API running on http://localhost:8001

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

3. **Configure environment** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:8001
```

4. **Start development server**:
```bash
npm run dev
```

5. **Open application**: http://localhost:5173

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run dev --host   # Start dev server accessible from network

# Building
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run typecheck    # Run TypeScript compiler checks
npm run lint         # Run ESLint for code quality
npm run lint --fix   # Fix auto-fixable ESLint issues

# Dependencies
npm install          # Install all dependencies
npm update           # Update dependencies to latest versions
```

## 🎨 Development Best Practices

### TypeScript Usage

**✅ Do:**
```typescript
// Define proper interfaces
interface ExpenseProps {
  expenses: Expense[];
  hideAmounts: boolean;
  onDelete?: (id: number) => void;
}

// Use React.FC with proper typing
const ExpenseList: React.FC<ExpenseProps> = ({ expenses, hideAmounts }) => {
  // Component logic
};

// Type API responses
const { data: expenses = [], isLoading, error } = useExpenses();
```

**❌ Don't:**
```typescript
// Avoid 'any' types
const data: any = fetchData();

// Don't ignore TypeScript errors
// @ts-ignore
const result = someFunction();
```

### Component Structure

**✅ Recommended Pattern:**
```typescript
import React from 'react';
import type { ComponentProps } from '../types';

interface Props {
  // Define props interface
}

const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // 1. Hooks at the top
  const [state, setState] = useState();
  const { data, isLoading } = useQuery();

  // 2. Event handlers
  const handleClick = () => {
    // Handle events
  };

  // 3. Effects and derived state
  useEffect(() => {
    // Side effects
  }, []);

  // 4. Early returns for loading/error states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // 5. Main render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
};

export default Component;
```

### TanStack Query Best Practices

**✅ Query Hooks:**
```typescript
// Use specific query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  summary: () => [...expenseKeys.all, 'summary'] as const,
};

// Implement proper error handling
const { data, isLoading, error, refetch } = useExpenses();

if (error) {
  console.error('Failed to fetch expenses:', error);
}
```

**✅ Mutation Hooks:**
```typescript
const createExpenseMutation = useCreateExpense();

const handleSubmit = async (expense: ExpenseCreate) => {
  try {
    await createExpenseMutation.mutateAsync(expense);
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### Styling Guidelines

**✅ Tailwind CSS Usage:**
```typescript
// Use semantic class combinations
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
  Submit
</button>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Dark mode support (when implemented)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Content */}
</div>
```

**❌ Avoid:**
```typescript
// Don't use arbitrary values unnecessarily
<div className="w-[327px] h-[421px]"> {/* Use standard sizes when possible */}

// Don't mix Tailwind with inline styles
<div className="p-4" style={{ padding: '20px' }}> {/* Conflicting styles */}
```

## 🔄 State Management

### TanStack Query Integration

The application uses TanStack Query for all server state management:

**Query Organization:**
```typescript
// hooks/queries/useExpensesQuery.ts
export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: expenseApi.getAll,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}
```

**Usage in Components:**
```typescript
const Dashboard: React.FC = () => {
  const { data: expenses = [], isLoading, error } = useExpenses();
  const { data: summary } = useExpenseSummary();
  
  // Component logic
};
```

### Local State Management

For component-specific state, use standard React hooks:

```typescript
// Simple state
const [isOpen, setIsOpen] = useState(false);

// Complex state with useReducer
const [state, dispatch] = useReducer(reducer, initialState);

// Custom hooks for reusable logic
const { hideAmounts, togglePrivacyMode } = usePrivacyMode();
```

## 🎯 Component Guidelines

### Page Components (`components/pages/`)

Page components should:
- Handle data fetching with TanStack Query
- Manage page-specific state
- Compose smaller UI components
- Handle loading and error states

```typescript
const Dashboard: React.FC<DashboardProps> = ({ hideAmounts }) => {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: categoryData = [] } = useCategoryChartData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <SummaryCards data={expenses} hideAmounts={hideAmounts} />
      <Charts categoryData={categoryData} />
    </div>
  );
};
```

### UI Components (`components/ui/`)

UI components should be:
- Reusable and composable
- Accept all necessary props
- Handle their own styling
- Be framework-agnostic when possible

```typescript
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor,
  textColor
}) => (
  <div className={`${bgColor} p-6 rounded-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
  </div>
);
```

## 🔌 API Integration

### Service Layer (`services/apiService.ts`)

Centralized API calls with error handling:

```typescript
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export const expenseApi = {
  getAll: (): Promise<Expense[]> => 
    apiRequest<Expense[]>('/api/expenses'),
    
  create: (expense: Omit<Expense, 'id'>): Promise<Expense> =>
    apiRequest<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
};
```

### Error Handling

Implement comprehensive error handling:

```typescript
// In components
const { data, error, isLoading } = useExpenses();

if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <p className="text-red-800">
        Failed to load expenses: {error.message}
      </p>
      <button 
        onClick={() => refetch()}
        className="mt-2 text-red-600 hover:text-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
```

## 🧪 Testing (Future Implementation)

Recommended testing setup:

```bash
# Testing dependencies (to be added)
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event vitest jsdom
```

**Test Structure:**
```typescript
// __tests__/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../components/pages/Dashboard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

test('renders dashboard with loading state', () => {
  const queryClient = createTestQueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <Dashboard hideAmounts={false} />
    </QueryClientProvider>
  );
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const Upload = lazy(() => import('./components/pages/Upload'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### TanStack Query Optimization

```typescript
// Optimal cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Memoization

```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexMetrics(expenses);
}, [expenses]);

// Event handlers
const handleClick = useCallback((id: number) => {
  onDelete(id);
}, [onDelete]);
```

## 🐛 Debugging

### React DevTools

Install browser extensions:
- React Developer Tools
- TanStack Query DevTools (in development)

### Debug Configuration

```typescript
// Add to main.tsx for development
if (import.meta.env.DEV) {
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
    // Add devtools to your app
  });
}
```

### Console Debugging

```typescript
// Debug API calls
console.group('API Request');
console.log('Endpoint:', endpoint);
console.log('Options:', options);
console.groupEnd();
```

## 🔧 Environment Configuration

### Development vs Production

```typescript
// Environment-specific behavior
const isDevelopment = import.meta.env.DEV;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (isDevelopment) {
  console.log('Running in development mode');
}
```

### Environment Variables

All environment variables must be prefixed with `VITE_`:

```env
# .env
VITE_API_BASE_URL=http://localhost:8001
VITE_APP_VERSION=1.0.0
```

## 📦 Build Configuration

### Vite Configuration

The build process is configured in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow network access
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Build with specific environment
NODE_ENV=production npm run build
```

## 🚨 Common Issues & Solutions

### TypeScript Errors

**Issue**: Property does not exist on type
```typescript
// Solution: Define proper interfaces
interface ApiResponse {
  data: Expense[];
  total: number;
}
```

**Issue**: Cannot find module
```typescript
// Solution: Check import paths and file extensions
import { Component } from './Component'; // ✅
import { Component } from './Component.tsx'; // ❌ Don't include extension
```

### TanStack Query Issues

**Issue**: Data not updating
```typescript
// Solution: Check query keys and invalidation
queryClient.invalidateQueries({ queryKey: expenseKeys.all });
```

**Issue**: Loading states not showing
```typescript
// Solution: Check query configuration
const { data, isLoading, error } = useExpenses();
if (isLoading) return <div>Loading...</div>;
```

### API Communication

**Issue**: CORS errors
```bash
# Solution: Ensure backend CORS is configured for http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Issue**: API endpoint not found
```typescript
// Solution: Verify API base URL in environment
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

## 🤝 Contributing

When contributing to the frontend:

1. **Follow TypeScript standards**: All components should be properly typed
2. **Use TanStack Query**: For all server state management
3. **Follow component patterns**: Use the established component structure
4. **Test your changes**: Ensure both TypeScript compilation and runtime work
5. **Update documentation**: Keep README and comments current

### Pull Request Checklist

- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Application builds successfully (`npm run build`)
- [ ] All features work in development mode
- [ ] Components follow established patterns
- [ ] API integration is properly implemented

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

For backend-related issues, see the [Backend README](../backend/README.md).
For general project information, see the [Main README](../README.md).