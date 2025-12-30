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
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useResponsive } from '../../hooks/useResponsive';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const toast = useToastStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isDesktop && styles.desktopContent,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>💰</Text>
            <Text style={styles.title}>AI Finance Manager</Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? '¡Bienvenido de nuevo! Inicia sesión para continuar.'
                : 'Crea una cuenta para comenzar.'}
            </Text>
          </View>

          <Card style={styles.formCard}>
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
            />

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? '¿No tienes una cuenta? '
                  : '¿Ya tienes una cuenta? '}
              </Text>
              <Text style={styles.toggleLink} onPress={toggleMode}>
                {mode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
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
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
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
    color: '#6b7280',
  },
  toggleLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
