# CLAUDE.md - React Native & Expo Development Guide

> Comprehensive guidelines for AI-assisted React Native/Expo development.
> Based on Callstack's Ultimate Guide to React Native Optimization and community best practices.

---

## 🎯 Role Definition

You are an expert in React Native, Expo, TypeScript, and mobile application development. You write clean, performant, and maintainable code following industry best practices.

---

## 📋 Key Principles

- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`, `canSubmit`)
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Favor named exports for components and utilities
- Use the Receive Object, Return Object (RORO) pattern

---

## 📁 Project Structure

```
src/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation group
│   ├── (auth)/            # Auth flow group
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry screen
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Input, Card)
│   └── features/         # Feature-specific components
├── hooks/                 # Custom React hooks
├── services/              # API calls, external services
├── stores/                # State management (Zustand stores)
├── utils/                 # Helper functions and utilities
├── constants/             # App constants, theme, config
├── types/                 # TypeScript type definitions
└── assets/                # Images, fonts, static files
```

---

## ✅ MUST DO - Critical Rules

### Component Architecture

```typescript
// ✅ CORRECT: Functional component with TypeScript
interface UserCardProps {
  user: User;
  onPress?: (userId: string) => void;
}

export function UserCard({ user, onPress }: UserCardProps) {
  const handlePress = useCallback(() => {
    onPress?.(user.id);
  }, [user.id, onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  name: { fontSize: 16, fontWeight: '600' },
});
```

### Performance - Lists (CRITICAL)

```typescript
// ✅ CORRECT: Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

export function UserList({ users }: { users: User[] }) {
  const renderItem = useCallback(({ item }: { item: User }) => (
    <UserCard user={item} />
  ), []);

  return (
    <FlashList
      data={users}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### State Management

```typescript
// ✅ CORRECT: Zustand store with TypeScript
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

### API Calls with React Query

```typescript
// ✅ CORRECT: React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserDTO) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Animations (UI Thread)

```typescript
// ✅ CORRECT: Reanimated 3 for smooth animations
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function AnimatedCard({ children }: PropsWithChildren) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

### Error Boundaries

```typescript
// ✅ CORRECT: Implement error boundaries
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Button title="Try again" onPress={resetErrorBoundary} />
    </View>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### Form Handling

```typescript
// ✅ CORRECT: React Hook Form with Zod validation
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    // Handle login
  };

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
      
      <Button title="Login" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
```

---

## ❌ MUST NOT DO - Anti-Patterns

### Performance Killers

```typescript
// ❌ WRONG: ScrollView with map for large lists
<ScrollView>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>

// ❌ WRONG: Inline functions without memoization
<Button onPress={() => handlePress(item.id)} />

// ❌ WRONG: Importing entire libraries
import _ from 'lodash';

// ❌ WRONG: Inline styles in hot paths
<View style={{ padding: 16, backgroundColor: 'white' }}>

// ❌ WRONG: Creating objects in render
<Component style={[styles.base, { marginTop: 10 }]} />

// ❌ WRONG: Anonymous arrow functions in FlatList
<FlatList
  renderItem={({ item }) => <Card data={item} />}
/>
```

### Architecture Mistakes

```typescript
// ❌ WRONG: Business logic in components
function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);
  
  // This should be in a custom hook or service
}

// ❌ WRONG: Prop drilling through multiple levels
<App>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
</App>

// ❌ WRONG: Storing derived state
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]); // Derived - compute instead

// ❌ WRONG: Using index as key for dynamic lists
{items.map((item, index) => <Item key={index} {...item} />)}
```

### Security Issues

```typescript
// ❌ WRONG: Storing sensitive data in AsyncStorage unencrypted
await AsyncStorage.setItem('authToken', token);

// ✅ CORRECT: Use expo-secure-store
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token);

// ❌ WRONG: Hardcoded API keys
const API_KEY = 'sk-abc123';

// ✅ CORRECT: Use environment variables
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
```

### Navigation Mistakes

```typescript
// ❌ WRONG: Passing complex objects via navigation params
navigation.navigate('Details', { user: complexUserObject });

// ✅ CORRECT: Pass IDs and fetch data in destination
navigation.navigate('Details', { userId: user.id });
```

---

## 🚀 Performance Optimization Guide

### Impact Priority Matrix

| Priority | Category | Impact | Action |
|----------|----------|--------|--------|
| 1 | **Lists** | CRITICAL | Use FlashList, not FlatList with map() |
| 2 | **Re-renders** | CRITICAL | Enable React Compiler or use memo/useCallback |
| 3 | **Bundle Size** | HIGH | Tree shake imports, enable R8 on Android |
| 4 | **Images** | HIGH | Use expo-image, implement caching |
| 5 | **Navigation** | MEDIUM | Lazy load screens, preload critical routes |
| 6 | **Animations** | MEDIUM | Use Reanimated (UI thread), not Animated API |
| 7 | **State** | MEDIUM | Keep state local, use atomic patterns |

### Bundle Size Optimization

```typescript
// ✅ CORRECT: Named imports for tree shaking
import { format, parseISO } from 'date-fns';

// ❌ WRONG: Default imports prevent tree shaking
import dateFns from 'date-fns';

// ✅ CORRECT: Lazy load heavy screens
const HeavyScreen = lazy(() => import('./screens/HeavyScreen'));
```

### Android R8 Configuration (app/build.gradle)

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Image Optimization

```typescript
// ✅ CORRECT: Use expo-image for performance
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
/>
```

---

## 🧪 Testing Guidelines

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

describe('UserCard', () => {
  const mockUser = { id: '1', name: 'John Doe' };

  it('renders user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('calls onPress with user id', () => {
    const onPress = jest.fn();
    render(<UserCard user={mockUser} onPress={onPress} />);
    
    fireEvent.press(screen.getByText('John Doe'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';

describe('useUsers', () => {
  it('fetches users successfully', async () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });
});
```

---

## 📱 Expo-Specific Guidelines

### Expo Router Structure

```typescript
// app/_layout.tsx - Root layout
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

### Expo Plugins Configuration (app.json)

```json
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "Allow $(PRODUCT_NAME) to access camera" }],
      ["expo-image-picker", { "photosPermission": "Allow $(PRODUCT_NAME) to access photos" }],
      ["expo-notifications", { "sounds": ["./assets/sounds/notification.wav"] }]
    ]
  }
}
```

### EAS Build Configuration (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## 🛠 Development Commands

```bash
# Development
npx expo start                    # Start development server
npx expo start --clear            # Clear cache and start
npx expo start --tunnel           # Start with tunnel (external access)

# Building
npx expo run:ios                  # Build and run on iOS simulator
npx expo run:android              # Build and run on Android emulator
eas build --platform ios          # Build for iOS with EAS
eas build --platform android      # Build for Android with EAS

# Testing
npm test                          # Run tests
npm test -- --coverage            # Run with coverage
npm test -- --watch               # Watch mode

# Code Quality
npm run lint                      # Run ESLint
npm run lint:fix                  # Fix ESLint issues
npm run typecheck                 # TypeScript check

# Utilities
npx expo install package-name     # Install Expo-compatible version
npx expo doctor                   # Check for issues
npx expo-doctor                   # More detailed diagnostics
```

---

## 🔧 Recommended Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-image": "~2.0.0",
    "expo-secure-store": "~14.0.0",
    "@shopify/flash-list": "^1.7.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "react-native-reanimated": "~3.16.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@types/react": "~18.2.0",
    "typescript": "~5.3.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

---

## 📝 Code Style Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserCard`, `AuthProvider` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useFormValidation` |
| Utilities | camelCase | `formatDate`, `parseAmount` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `User`, `AuthState` |
| Files (components) | PascalCase | `UserCard.tsx` |
| Files (utilities) | kebab-case | `date-utils.ts` |
| Directories | kebab-case | `user-profile/` |

### Import Order

```typescript
// 1. React/React Native
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';

// 3. Internal modules (absolute paths)
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';

// 4. Relative imports
import { UserCardProps } from './types';
import { formatUserName } from './utils';

// 5. Types (if separate)
import type { User } from '@/types';
```

---

## 🚨 Error Handling Patterns

```typescript
// API Error Handling
export async function apiCall<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle known API errors
      return { data: null, error };
    }
    // Transform unknown errors
    return { data: null, error: new Error('An unexpected error occurred') };
  }
}

// Component Error Handling
function UserProfile({ userId }: { userId: string }) {
  const { data: user, error, isLoading } = useUser(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound message="User not found" />;

  return <UserDetails user={user} />;
}
```

---

## 🔐 Security Checklist

- [ ] Store sensitive data with `expo-secure-store`
- [ ] Use HTTPS for all API calls
- [ ] Validate all user inputs with Zod
- [ ] Implement proper authentication flow
- [ ] Never log sensitive data
- [ ] Use environment variables for secrets
- [ ] Implement certificate pinning for production
- [ ] Sanitize data before display (XSS prevention)
- [ ] Implement rate limiting awareness
- [ ] Use biometric authentication where appropriate

---

## 📚 References

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Callstack React Native Optimization Guide](https://www.callstack.com/campaigns/download-the-ultimate-guide-to-react-native-optimization)
- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

*Last Updated: January 2026*
*Compatible with: Expo SDK 52+, React Native 0.76+, TypeScript 5.3+*
