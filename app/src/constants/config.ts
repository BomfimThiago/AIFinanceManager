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
