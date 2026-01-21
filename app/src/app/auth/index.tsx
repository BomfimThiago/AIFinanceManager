// src/app/auth/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, getShadow, colors } from '../../constants/theme';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { isDesktop, isSmallMobile, horizontalPadding } = useResponsive();
  const { isDark } = useColorMode();
  const { login, register, isLoading, clearError } = useAuthStore();
  const toast = useToastStore();
  const theme = getTheme(isDark);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      toast.success(mode === 'login' ? '¡Bienvenido!' : '¡Cuenta creada!');
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación';
      toast.error(errorMessage);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

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
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={[styles.header, isSmallMobile && { marginBottom: 24 }]}>
            <LinearGradient
              colors={['#7C3AED', '#A855F7', '#EC4899']}
              style={[styles.logoContainer, getShadow('primary')]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>K</Text>
            </LinearGradient>
            <Text style={[styles.appName, { color: theme.primary }]}>Konta</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {mode === 'login'
                ? '¡Bienvenido de nuevo!'
                : 'Crea tu cuenta para comenzar'}
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              getShadow('lg'),
            ]}
          >
            {/* Mode Toggle */}
            <View
              style={[
                styles.modeToggle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)' },
              ]}
            >
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { clearError(); setMode(m); }}
                  style={[styles.modeButton]}
                >
                  {mode === m ? (
                    <LinearGradient
                      colors={['#7C3AED', '#A855F7']}
                      style={styles.modeButtonActive}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.modeButtonTextActive}>
                        {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.modeButtonText, { color: theme.textSecondary }]}>
                      {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {mode === 'register' && (
                <Input
                  label="Nombre Completo"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  icon="👤"
                />
              )}

              <Input
                label="Correo Electrónico"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                icon="✉️"
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                icon="🔒"
                rightIcon={showPassword ? '👁️' : '🙈'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {mode === 'register' && (
                <Input
                  label="Confirmar Contraseña"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  icon="🔐"
                />
              )}
            </View>

            {/* Submit Button */}
            <Button
              title={mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="large"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
                o continúa con
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Social Login */}
            <View style={styles.socialButtons}>
              {['🔵', '📘', '🍎'].map((icon, i) => (
                <Pressable
                  key={i}
                  style={[styles.socialButton, { borderColor: theme.border }]}
                >
                  <Text style={styles.socialIcon}>{icon}</Text>
                </Pressable>
              ))}
            </View>

            {/* Toggle Link */}
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
                {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              </Text>
              <Pressable onPress={() => { clearError(); setMode(mode === 'login' ? 'register' : 'login'); }}>
                <Text style={[styles.toggleLink, { color: theme.primary }]}>
                  {mode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
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
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.5,
  },
  orb1: {
    top: '10%',
    left: '-20%',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  orb2: {
    bottom: '10%',
    right: '-20%',
    width: 250,
    height: 250,
    backgroundColor: 'rgba(6,182,212,0.15)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    borderRadius: radius['3xl'],
    borderWidth: 1,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
  },
  modeButtonActive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modeButtonText: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    paddingHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    fontSize: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
