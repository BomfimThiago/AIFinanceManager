import { Platform } from 'react-native';

// API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8003/api/v1';
  }
  // For mobile, use your machine's IP address or ngrok URL
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8003/api/v1';
};

export const API_URL = getApiUrl();

export const APP_NAME = 'AI Finance Manager';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
