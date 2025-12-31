import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useColorMode } from '../../providers/GluestackUIProvider';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { isDesktop, isSmallMobile, horizontalPadding } = useResponsive();
  const { isDark } = useColorMode();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const toast = useToastStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const colors = {
    background: isDark ? '#111827' : '#f3f4f6',
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#7c3aed',
  };

  const handleSubmit = async () => {
    clearError();

    if (!email || !password) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (mode === 'register') {
      if (!fullName) {
        toast.error('Por favor ingresa tu nombre completo');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      toast.success(mode === 'login' ? '¡Bienvenido de nuevo!' : '¡Cuenta creada exitosamente!');
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : error || 'Error de autenticación';
      toast.error(errorMessage);
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
            isDesktop && styles.desktopContent,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, isSmallMobile && { marginBottom: 24 }]}>
            <Logo size={isSmallMobile ? 48 : 64} variant="vertical" textColor={colors.text} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }, isSmallMobile && { fontSize: 14, marginTop: 12 }]}>
              {mode === 'login'
                ? '¡Bienvenido de nuevo! Inicia sesión para continuar.'
                : 'Crea una cuenta para comenzar.'}
            </Text>
          </View>

          <View style={[
            styles.formCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isSmallMobile && { padding: 16, borderRadius: 12 },
            Platform.OS === 'ios' && styles.shadowIOS,
            Platform.OS === 'android' && styles.shadowAndroid,
            Platform.OS === 'web' && styles.shadowWeb,
          ]}>
            {mode === 'register' && (
              <Input
                label="Nombre Completo"
                placeholder="Ingresa tu nombre completo"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}

            <Input
              label="Correo Electrónico"
              placeholder="Ingresa tu correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {mode === 'register' && (
              <Input
                label="Confirmar Contraseña"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            )}

            <Button
              title={mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
              fullWidth
            />

            <View style={[styles.toggleContainer, isSmallMobile && { marginTop: 16 }]}>
              <Text style={[styles.toggleText, { color: colors.textSecondary }, isSmallMobile && { fontSize: 13 }]}>
                {mode === 'login'
                  ? '¿No tienes una cuenta? '
                  : '¿Ya tienes una cuenta? '}
              </Text>
              <Text style={[styles.toggleLink, { color: colors.primary }, isSmallMobile && { fontSize: 13 }]} onPress={toggleMode}>
                {mode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  desktopContent: {
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  formCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  shadowIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  shadowAndroid: {
    elevation: 4,
  },
  shadowWeb: {
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  submitButton: {
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
