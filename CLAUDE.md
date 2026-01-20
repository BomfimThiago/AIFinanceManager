# AI Finance Manager - Development Guidelines

## Project Overview

A home finance management application with AI-powered receipt scanning that extracts spending details automatically.

### Tech Stack
- **Backend**: FastAPI (Python 3.12+)
- **Frontend**: React Native + Expo (iOS, Android, and Web from single codebase)
- **AI/ML**: OCR + LLM for receipt parsing
- **Database**: PostgreSQL
- **Package Manager**: uv (Python), npm (JavaScript)

### Why React Native + Expo for All Platforms?
- **Single codebase**: Write once, deploy to iOS, Android, and Web
- **Expo Router**: File-based routing that works across all platforms
- **React Native Web**: Compiles React Native components to web-compatible elements
- **Shared logic**: Same hooks, state management, and API calls everywhere
- **Platform flexibility**: Use `Platform.select()` for platform-specific UI when needed

---

## FastAPI Backend Best Practices

### Project Structure
```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Settings and configuration
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Shared dependencies
│   ├── auth/                   # Authentication module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   └── dependencies.py
│   ├── receipts/               # Receipt processing module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   ├── ocr_service.py      # OCR processing
│   │   └── ai_parser.py        # AI extraction logic
│   ├── expenses/               # Expenses module
│   ├── categories/             # Categories module
│   └── shared/                 # Shared utilities
│       ├── exceptions.py
│       ├── constants.py
│       └── models.py
├── tests/
├── alembic/                    # Database migrations
├── pyproject.toml
└── uv.lock
```

### Code Style & Patterns

#### 1. Always Use Type Hints
```python
from typing import Annotated
from fastapi import Depends

async def get_receipt(
    receipt_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReceiptResponse:
    ...
```

#### 2. Use Pydantic Models for All I/O
```python
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime

class ReceiptCreate(BaseModel):
    image_url: str = Field(..., description="URL or base64 of receipt image")

class ReceiptResponse(BaseModel):
    id: int
    store_name: str
    total_amount: Decimal
    currency: str
    purchase_date: datetime
    items: list[ReceiptItemResponse]
    category: str

    model_config = {"from_attributes": True}
```

#### 3. Repository Pattern for Database Access
```python
class ReceiptRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, receipt: ReceiptCreate, user_id: int) -> Receipt:
        db_receipt = Receipt(**receipt.model_dump(), user_id=user_id)
        self.db.add(db_receipt)
        await self.db.commit()
        await self.db.refresh(db_receipt)
        return db_receipt

    async def get_by_id(self, receipt_id: int, user_id: int) -> Receipt | None:
        result = await self.db.execute(
            select(Receipt).where(
                Receipt.id == receipt_id,
                Receipt.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
```

#### 4. Service Layer for Business Logic
```python
class ReceiptService:
    def __init__(
        self,
        repository: ReceiptRepository,
        ocr_service: OCRService,
        ai_parser: AIParser,
    ):
        self.repository = repository
        self.ocr_service = ocr_service
        self.ai_parser = ai_parser

    async def process_receipt(
        self,
        image_data: bytes,
        user_id: int
    ) -> ReceiptResponse:
        # Extract text from image
        raw_text = await self.ocr_service.extract_text(image_data)

        # Parse with AI
        parsed_data = await self.ai_parser.parse_receipt(raw_text)

        # Save to database
        receipt = await self.repository.create(parsed_data, user_id)

        return ReceiptResponse.model_validate(receipt)
```

#### 5. Dependency Injection
```python
# dependencies.py
def get_receipt_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> ReceiptRepository:
    return ReceiptRepository(db)

def get_receipt_service(
    repository: Annotated[ReceiptRepository, Depends(get_receipt_repository)],
    ocr_service: Annotated[OCRService, Depends(get_ocr_service)],
    ai_parser: Annotated[AIParser, Depends(get_ai_parser)],
) -> ReceiptService:
    return ReceiptService(repository, ocr_service, ai_parser)
```

#### 6. Error Handling with Custom Exceptions
```python
# shared/exceptions.py
from fastapi import HTTPException, status

class ReceiptNotFoundError(HTTPException):
    def __init__(self, receipt_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt with ID {receipt_id} not found"
        )

class ReceiptProcessingError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process receipt: {message}"
        )
```

#### 7. Use Enums for Constants
```python
from enum import StrEnum

class ExpenseCategory(StrEnum):
    GROCERIES = "groceries"
    DINING = "dining"
    TRANSPORTATION = "transportation"
    UTILITIES = "utilities"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    SHOPPING = "shopping"
    OTHER = "other"

class Currency(StrEnum):
    USD = "USD"
    EUR = "EUR"
    BRL = "BRL"
```

#### 8. Background Tasks for Heavy Processing
```python
from fastapi import BackgroundTasks

@router.post("/receipts/upload")
async def upload_receipt(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
):
    # Save file and create pending receipt
    receipt_id = await create_pending_receipt(file, current_user.id)

    # Process in background
    background_tasks.add_task(process_receipt_async, receipt_id)

    return {"receipt_id": receipt_id, "status": "processing"}
```

### API Design Guidelines

1. **Use RESTful conventions**:
   - `GET /receipts` - List receipts
   - `POST /receipts` - Create/upload receipt
   - `GET /receipts/{id}` - Get single receipt
   - `PUT /receipts/{id}` - Update receipt
   - `DELETE /receipts/{id}` - Delete receipt

2. **Version your API**: `/api/v1/receipts`

3. **Use query parameters for filtering**:
   ```
   GET /receipts?start_date=2024-01-01&end_date=2024-12-31&category=groceries
   ```

4. **Consistent response format**:
   ```python
   class APIResponse(BaseModel, Generic[T]):
       success: bool = True
       data: T | None = None
       message: str | None = None
   ```

### Testing
```python
import pytest
from httpx import AsyncClient

@pytest.fixture
async def async_client(app):
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_upload_receipt(async_client, auth_headers):
    with open("tests/fixtures/sample_receipt.jpg", "rb") as f:
        response = await async_client.post(
            "/api/v1/receipts/upload",
            files={"file": ("receipt.jpg", f, "image/jpeg")},
            headers=auth_headers,
        )
    assert response.status_code == 201
    assert "receipt_id" in response.json()
```

---

## React Native (Expo) - Web, iOS & Android

### Project Structure
```
app/
├── src/
│   ├── app/                    # Navigation & screens (Expo Router)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx       # Home/Dashboard
│   │   │   ├── receipts.tsx
│   │   │   ├── expenses.tsx
│   │   │   └── settings.tsx
│   │   ├── receipt/
│   │   │   └── [id].tsx
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── receipts/
│   │   │   ├── ReceiptCard.tsx
│   │   │   ├── ReceiptScanner.tsx
│   │   │   └── ReceiptDetails.tsx
│   │   └── expenses/
│   ├── hooks/
│   │   ├── useReceipts.ts
│   │   ├── useCamera.ts
│   │   └── useAuth.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── store/                  # State management (Zustand)
│   │   ├── authStore.ts
│   │   └── receiptsStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── constants/
│       ├── colors.ts
│       ├── categories.ts
│       └── config.ts
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

### Code Style & Patterns

#### 1. Use TypeScript Strictly
```typescript
// types/index.ts
export interface Receipt {
  id: number;
  storeName: string;
  totalAmount: number;
  currency: string;
  purchaseDate: string;
  items: ReceiptItem[];
  category: ExpenseCategory;
  imageUrl: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type ExpenseCategory =
  | 'groceries'
  | 'dining'
  | 'transportation'
  | 'utilities'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'other';
```

#### 2. Functional Components with Proper Types
```typescript
import { View, Text, StyleSheet } from 'react-native';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress: (id: number) => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(receipt.id)}
    >
      <Text style={styles.storeName}>{receipt.storeName}</Text>
      <Text style={styles.amount}>
        {formatCurrency(receipt.totalAmount, receipt.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
});
```

#### 3. React Query for Data Fetching
```typescript
// hooks/useReceipts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '@/services/api';

export function useReceipts() {
  return useQuery({
    queryKey: ['receipts'],
    queryFn: receiptsApi.getAll,
  });
}

export function useReceipt(id: number) {
  return useQuery({
    queryKey: ['receipts', id],
    queryFn: () => receiptsApi.getById(id),
    enabled: !!id,
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: receiptsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
```

#### 4. Zustand for Global State
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { user, token } = await authApi.login(email, password);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

#### 5. Camera & Image Handling
```typescript
// hooks/useCamera.ts
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return null;

    // Compress image for upload
    const compressed = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    return compressed;
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Gallery permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0];
  };

  return { takePhoto, pickFromGallery, isLoading };
}
```

#### 6. API Service with Interceptors
```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL } from '@/constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const receiptsApi = {
  getAll: async (): Promise<Receipt[]> => {
    const { data } = await api.get('/receipts');
    return data;
  },

  getById: async (id: number): Promise<Receipt> => {
    const { data } = await api.get(`/receipts/${id}`);
    return data;
  },

  upload: async (imageUri: string): Promise<Receipt> => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    const { data } = await api.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
```

### Platform-Specific Code
```typescript
import { Platform } from 'react-native';

// Platform-specific styles
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
  }),
});

// Platform-specific component rendering
function ReceiptUploader() {
  if (Platform.OS === 'web') {
    return <WebDropzone />;  // Drag & drop for web
  }
  return <MobileCamera />;    // Camera for mobile
}
```

### Web-Specific: Drag & Drop Upload
```typescript
// components/receipts/WebDropzone.tsx
import { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Only import on web to avoid mobile bundle issues
const Dropzone = Platform.OS === 'web'
  ? require('react-dropzone').default
  : null;

export function WebDropzone({ onUpload }: { onUpload: (file: File) => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  if (!Dropzone) return null;

  return (
    <Dropzone onDrop={onDrop} accept={{ 'image/*': ['.jpeg', '.jpg', '.png'] }}>
      {({ getRootProps, getInputProps, isDragActive }) => (
        <View {...getRootProps()} style={[styles.dropzone, isDragActive && styles.active]}>
          <input {...getInputProps()} />
          <Text>{isDragActive ? 'Drop here...' : 'Drag & drop or click to upload'}</Text>
        </View>
      )}
    </Dropzone>
  );
}
```

### Responsive Design
```typescript
import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// Usage in components
function Dashboard() {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <View style={[styles.container, isDesktop && styles.desktopLayout]}>
      {isDesktop && <Sidebar />}
      <MainContent />
      {isMobile && <BottomNav />}
    </View>
  );
}
```

---

## Konta Design System (REQUIRED FOR ALL UI CHANGES)

**IMPORTANT**: All visual changes to the frontend MUST follow the Konta Design System. Before making any UI modifications, review the full documentation at `app/docs/DESIGN_SYSTEM.md`.

### Quick Reference

#### Theme Colors (ALWAYS use these)
```typescript
import { getThemeColors, GRADIENTS } from '../constants/theme';
import { useColorMode } from '../providers/GluestackUIProvider';

const { isDark } = useColorMode();
const colors = getThemeColors(isDark);

// NEVER hardcode colors - always use:
colors.background    // Screen backgrounds
colors.surface       // Cards, modals
colors.text          // Primary text
colors.textSecondary // Secondary text
colors.primary       // Brand color (#7C3AED)
colors.primaryLight  // Primary tint
colors.success       // Positive states
colors.warning       // Processing states
colors.error         // Error states
```

#### Gradient Backgrounds (Required for all screens)
```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Wrap ALL screens with gradient background
<LinearGradient
  colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#F3E8FF']}
  style={{ flex: 1 }}
>
  <SafeAreaView style={{ flex: 1 }}>
    {/* Screen content */}
  </SafeAreaView>
</LinearGradient>
```

#### Primary Gradient (Buttons, Cards, Headers)
```typescript
// Primary gradient: Purple to Pink
GRADIENTS.primary     // ['#7C3AED', '#A855F7']
GRADIENTS.primaryFull // ['#7C3AED', '#A855F7', '#EC4899']

// Button example
<LinearGradient
  colors={GRADIENTS.primaryFull}
  style={styles.button}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
>
  <Text style={{ color: '#fff' }}>Submit</Text>
</LinearGradient>
```

#### Border Radius Standards
- Small buttons/badges: `4-8px`
- Inputs, small cards: `10-14px`
- Standard cards: `20-24px`
- Hero cards, modals: `28-32px`

#### Platform Shadows
```typescript
// Always include all three for cross-platform support
Platform.OS === 'ios' && styles.shadowIOS,
Platform.OS === 'android' && styles.shadowAndroid,
Platform.OS === 'web' && styles.shadowWeb,

// Standard shadow definitions
shadowIOS: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
},
shadowAndroid: { elevation: 3 },
shadowWeb: { boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
```

#### Status Badges
```typescript
import { getStatusConfig } from '../constants/theme';

const statusConfig = getStatusConfig(receipt.status, isDark);
// Returns: { color, bg, label, icon }
```

### Design Rules

1. **Never hardcode colors** - Always use `getThemeColors(isDark)`
2. **Always support dark mode** - Test both themes
3. **Use gradient backgrounds** - All screens must have the purple gradient
4. **Follow spacing conventions** - Cards: 16-20px padding, Hero: 24-28px
5. **Use consistent border radius** - See standards above
6. **Include platform shadows** - iOS, Android, and Web variants

For complete documentation including typography, components, and examples, see: `app/docs/DESIGN_SYSTEM.md`

---

## AI Receipt Processing Guidelines

### OCR + LLM Pipeline
```python
# receipts/ai_parser.py
from anthropic import Anthropic

class AIParser:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    async def parse_receipt(self, ocr_text: str) -> ParsedReceipt:
        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Extract the following from this receipt:
                - Store name
                - Date of purchase
                - Total amount
                - Currency
                - Individual items with prices
                - Category (groceries, dining, etc.)

                Receipt text:
                {ocr_text}

                Return as JSON."""
            }]
        )
        return self._parse_response(response)
```

### Image Processing for Better OCR
```python
from PIL import Image
import pytesseract

class OCRService:
    def preprocess_image(self, image_data: bytes) -> Image:
        image = Image.open(io.BytesIO(image_data))
        # Convert to grayscale
        image = image.convert('L')
        # Increase contrast
        # Apply thresholding
        return image

    async def extract_text(self, image_data: bytes) -> str:
        processed = self.preprocess_image(image_data)
        return pytesseract.image_to_string(processed)
```

---

## Development Workflow

### Commands
```bash
# Backend
cd backend
uv sync                          # Install dependencies
uv run uvicorn src.main:app --reload  # Run dev server
uv run pytest                    # Run tests
uv run alembic upgrade head      # Run migrations

# Frontend (React Native + Expo - all platforms)
cd app
npm install                      # Install dependencies
npx expo start                   # Start Expo dev server (press w for web, i for iOS, a for Android)
npx expo start --web             # Start web only
npx expo run:ios                 # Run on iOS simulator
npx expo run:android             # Run on Android emulator
npx expo export --platform web   # Build for web production
eas build --platform ios         # Build iOS app for store
eas build --platform android     # Build Android app for store
```

### Environment Variables
```bash
# backend/.env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/finance
ANTHROPIC_API_KEY=sk-...
JWT_SECRET=your-secret-key
CORS_ORIGINS=["http://localhost:8081","http://localhost:19006"]

# app/.env (Expo - shared across all platforms)
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Security Considerations

1. **Never store API keys in client code** - Use environment variables
2. **Validate all file uploads** - Check file type, size limits
3. **Sanitize OCR output** - Before sending to AI or storing
4. **Use HTTPS in production**
5. **Implement rate limiting** for receipt uploads
6. **Secure image storage** - Use signed URLs for S3

---

## Commit Guidelines

Always ask before committing. Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## Documentation

Always ask before creating documentation files. Document:
- API endpoints with OpenAPI/Swagger
- Complex business logic
- Setup instructions in README
