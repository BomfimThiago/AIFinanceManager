import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@konta/color-mode';

type ColorMode = 'light' | 'dark';

interface GluestackUIContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  isDark: boolean;
}

const GluestackUIContext = createContext<GluestackUIContextType | undefined>(undefined);

interface GluestackUIProviderProps {
  children: React.ReactNode;
}

export function GluestackUIProvider({ children }: GluestackUIProviderProps) {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>(systemColorScheme || 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved color mode on mount
  useEffect(() => {
    const loadColorMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode === 'light' || savedMode === 'dark') {
          setColorModeState(savedMode);
        } else if (systemColorScheme) {
          setColorModeState(systemColorScheme);
        }
      } catch (error) {
        console.warn('Failed to load color mode:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadColorMode();
  }, [systemColorScheme]);

  const setColorMode = async (mode: ColorMode) => {
    setColorModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save color mode:', error);
    }
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  };

  const value: GluestackUIContextType = {
    colorMode,
    toggleColorMode,
    setColorMode,
    isDark: colorMode === 'dark',
  };

  // Don't render until we've loaded the saved preference
  if (!isLoaded) {
    return null;
  }

  return (
    <GluestackUIContext.Provider value={value}>
      <View className={`flex-1 ${colorMode === 'dark' ? 'dark' : ''}`}>
        {children}
      </View>
    </GluestackUIContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(GluestackUIContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a GluestackUIProvider');
  }
  return context;
}

export { GluestackUIContext };
