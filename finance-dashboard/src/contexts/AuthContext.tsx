import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, LoginCredentials, SignupCredentials } from '../types';
import { authApi, getAuthToken, setAuthToken } from '../services/apiService';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          setTokenState(storedToken);
        } catch (error) {
          console.error('Failed to get current user:', error);
          // Token might be expired, clear it silently
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
          // Don't show error for expired tokens during initialization
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const response = await authApi.login(credentials);
      console.log('Login successful:', { user: response.user });
      setUser(response.user);
      setTokenState(response.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting signup with:', { email: credentials.email, username: credentials.username });
      const response = await authApi.signup(credentials);
      console.log('Signup successful:', { user: response.user });
      setUser(response.user);
      setTokenState(response.access_token);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authApi.logout();
    setUser(null);
    setTokenState(null);
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;