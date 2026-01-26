import React, { PropsWithChildren } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useColorMode } from '../providers/GluestackUIProvider';
import { getTheme, radius, colors } from '../constants/theme';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.errorCard, { backgroundColor: theme.surface }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.title, { color: theme.text }]}>Oops! Algo salió mal</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {error.message || 'Ha ocurrido un error inesperado'}
        </Text>
        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={resetErrorBoundary}
        >
          <Text style={styles.buttonText}>Intentar de nuevo</Text>
        </Pressable>

        {__DEV__ && (
          <View style={[styles.debugInfo, { backgroundColor: theme.background }]}>
            <Text style={[styles.debugTitle, { color: theme.textMuted }]}>Debug Info:</Text>
            <Text style={[styles.debugText, { color: theme.textMuted }]} numberOfLines={10}>
              {error.stack}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface ErrorBoundaryProps extends PropsWithChildren {
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

export function ErrorBoundary({ children, onError }: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    // Log to error reporting service in production
    if (!__DEV__) {
      console.error('Error caught by boundary:', error, errorInfo);
      // TODO: Send to Sentry or other error reporting service
    }
    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Can add additional reset logic here if needed
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    borderRadius: radius.xl,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
    minWidth: 140,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: 24,
    padding: 12,
    borderRadius: radius.sm,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});