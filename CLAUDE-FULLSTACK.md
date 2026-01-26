# CLAUDE.md - Full-Stack Development Guide
# React Native/Expo (Frontend) + FastAPI (Backend)

> Complete AI coding assistant guidelines for full-stack mobile development.
> Combines React Native/Expo best practices with FastAPI backend patterns.

---

## 🎯 Role Definition

You are an expert full-stack developer specializing in:
- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL, Redis
- **DevOps**: Docker, CI/CD

You write clean, type-safe, performant, and maintainable code.

---

## 📋 Universal Principles

| Principle | Application |
|-----------|-------------|
| **Type Safety** | TypeScript (frontend), Type hints (backend) - ALWAYS |
| **Validation** | Zod schemas (frontend), Pydantic models (backend) |
| **Error Handling** | Guard clauses, early returns, proper error types |
| **Async** | Non-blocking operations throughout the stack |
| **Testing** | Unit tests for logic, integration tests for flows |
| **Security** | Never trust user input, encrypt sensitive data |

---

# 📱 PART 1: REACT NATIVE / EXPO

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   ├── (auth)/            # Auth flow
│   └── _layout.tsx        # Root layout
├── components/
│   ├── ui/                # Base components (Button, Input)
│   └── features/          # Feature components
├── hooks/                  # Custom hooks
├── services/              # API client, external services
├── stores/                # Zustand stores
├── utils/                 # Helpers
├── constants/             # Theme, config
└── types/                 # TypeScript types
```

## ✅ MUST DO (React Native)

### Components
```typescript
// ✅ Functional components with TypeScript
interface Props {
  user: User;
  onPress?: (id: string) => void;
}

export function UserCard({ user, onPress }: Props) {
  const handlePress = useCallback(() => {
    onPress?.(user.id);
  }, [user.id, onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Text>{user.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});
```

### Lists (CRITICAL Performance)
```typescript
// ✅ ALWAYS use FlashList for lists > 20 items
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

### State Management
```typescript
// ✅ Zustand for global state
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### API Integration
```typescript
// ✅ React Query for server state
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

### Form Validation
```typescript
// ✅ React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## ❌ MUST NOT DO (React Native)

```typescript
// ❌ NEVER: ScrollView with map for large lists
<ScrollView>
  {items.map(item => <Card key={item.id} />)}
</ScrollView>

// ❌ NEVER: Inline functions without memoization
<Button onPress={() => handlePress(id)} />

// ❌ NEVER: Inline styles in render
<View style={{ padding: 16 }}>

// ❌ NEVER: Import entire libraries
import _ from 'lodash';  // Use: import { debounce } from 'lodash';

// ❌ NEVER: Store sensitive data unencrypted
await AsyncStorage.setItem('token', token);
// Use: await SecureStore.setItemAsync('token', token);

// ❌ NEVER: Index as key for dynamic lists
{items.map((item, i) => <Card key={i} />)}
```

---

# 🐍 PART 2: FASTAPI BACKEND

## Project Structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app
│   ├── api/
│   │   ├── deps.py        # Dependencies
│   │   └── v1/            # API v1 routes
│   ├── core/
│   │   ├── config.py      # Settings
│   │   └── security.py    # Auth utilities
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   └── db/
│       └── session.py     # Database session
└── tests/
```

## ✅ MUST DO (FastAPI)

### App Setup
```python
# ✅ Use lifespan context manager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title="API", lifespan=lifespan)
```

### Pydantic Schemas
```python
# ✅ ALWAYS use Pydantic for validation
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)
```

### Route Handlers
```python
# ✅ Full type hints, proper status codes, guard clauses
@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    # Guard clause first
    existing = await user_service.get_by_email(db, user_in.email)
    if existing:
        raise HTTPException(400, "Email already registered")
    
    # Happy path last
    return await user_service.create(db, user_in)
```

### Async Database
```python
# ✅ Async SQLAlchemy 2.0
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Dependencies
```python
# ✅ Reusable dependency injection
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(401, "Invalid token")
    
    user = await user_service.get(db, payload.sub)
    if not user:
        raise HTTPException(401, "User not found")
    
    return user
```

## ❌ MUST NOT DO (FastAPI)

```python
# ❌ NEVER: Raw dictionaries for request/response
async def create_user(user: dict):  # No validation!
    pass

# ❌ NEVER: Missing type hints
async def get_user(user_id):  # Type unclear
    pass

# ❌ NEVER: @app.on_event (deprecated)
@app.on_event("startup")  # Use lifespan instead
async def startup():
    pass

# ❌ NEVER: Blocking I/O in async functions
async def get_data():
    time.sleep(5)  # Blocks event loop!

# ❌ NEVER: N+1 queries
for user in users:
    posts = await db.execute(select(Post).where(Post.user_id == user.id))
# Use: selectinload(User.posts)

# ❌ NEVER: SQL string concatenation
query = f"SELECT * FROM users WHERE email = '{email}'"  # SQL injection!

# ❌ NEVER: Expose internal errors
except Exception as e:
    raise HTTPException(500, str(e))  # Leaks info!

# ❌ NEVER: No pagination
async def list_users():
    return await db.execute(select(User))  # Could be millions!
```

---

# 🔗 PART 3: FULL-STACK INTEGRATION

## API Client (Frontend)

```typescript
// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  getUsers: () => api.get<User[]>('/users').then((r) => r.data),
  getUser: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  createUser: (data: CreateUserDTO) => api.post<User>('/users', data).then((r) => r.data),
};
```

## Shared Types Pattern

```typescript
// Keep types in sync between frontend and backend
// frontend/types/user.ts
export interface User {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
}
```

```python
# backend/app/schemas/user.py
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        # Matches frontend camelCase
        alias_generator=to_camel,
        populate_by_name=True,
    )
```

## Error Handling Flow

```typescript
// Frontend: Consistent error handling
export function useCreateUser() {
  return useMutation({
    mutationFn: userApi.createUser,
    onError: (error: AxiosError<{ detail: string }>) => {
      const message = error.response?.data?.detail || 'An error occurred';
      Toast.show({ type: 'error', text1: message });
    },
  });
}
```

```python
# Backend: Consistent error responses
class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

@app.exception_handler(AppException)
async def app_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
```

---

# 🛠 DEVELOPMENT COMMANDS

## Frontend (React Native/Expo)
```bash
npx expo start                    # Start dev server
npx expo start --clear            # Clear cache
npx expo run:ios                  # iOS build
npx expo run:android              # Android build
npm test                          # Run tests
npm run lint                      # Lint code
```

## Backend (FastAPI)
```bash
uvicorn app.main:app --reload     # Start dev server
alembic upgrade head              # Run migrations
alembic revision --autogenerate -m "msg"  # Create migration
pytest                            # Run tests
ruff check . --fix                # Lint and fix
ruff format .                     # Format code
```

## Docker
```bash
docker compose up -d              # Start all services
docker compose logs -f api        # View API logs
docker compose exec api bash      # Shell into container
```

---

# 📦 RECOMMENDED DEPENDENCIES

## Frontend
```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "expo-secure-store": "~14.0.0",
  "@shopify/flash-list": "^1.7.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^5.0.0",
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.0",
  "axios": "^1.7.0"
}
```

## Backend
```toml
[dependencies]
fastapi = ">=0.115.0"
uvicorn = ">=0.32.0"
pydantic = ">=2.10.0"
sqlalchemy = ">=2.0.36"
asyncpg = ">=0.30.0"
alembic = ">=1.14.0"
python-jose = ">=3.3.0"
passlib = ">=1.7.4"
redis = ">=5.2.0"
```

---

# 🔐 SECURITY CHECKLIST

## Frontend
- [ ] Use `expo-secure-store` for tokens
- [ ] Validate all inputs with Zod
- [ ] Never log sensitive data
- [ ] Use HTTPS for all API calls
- [ ] Implement biometric auth where appropriate

## Backend
- [ ] Use Pydantic for all input validation
- [ ] Implement rate limiting
- [ ] Use parameterized queries only
- [ ] Hash passwords with bcrypt
- [ ] Short-lived JWT + refresh tokens
- [ ] Proper CORS configuration
- [ ] Security headers middleware

---

# 📝 CODE REVIEW CHECKLIST

Before submitting code, verify:

- [ ] TypeScript/Python type hints on all functions
- [ ] No `any` types (TS) or missing type hints (Python)
- [ ] Error handling with proper user messages
- [ ] Loading and error states in UI
- [ ] Tests for business logic
- [ ] No console.log/print statements
- [ ] No hardcoded secrets
- [ ] Proper status codes (201 for create, 404 for not found)
- [ ] Pagination on list endpoints
- [ ] Memoization where needed (useCallback, useMemo)

---

*Last Updated: January 2026*
*Frontend: Expo SDK 52+, React Native 0.76+*
*Backend: Python 3.12+, FastAPI 0.115+*
