import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getThemeColors, GRADIENTS } from '../../constants/theme';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { isDesktop, isSmallMobile, horizontalPadding } = useResponsive();
  const { isDark, toggleColorMode } = useColorMode();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const toast = useToastStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const colors = getThemeColors(isDark);

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
        toast.error('Las contrasenas no coinciden');
        return;
      }
      if (password.length < 6) {
        toast.error('La contrasena debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      toast.success(mode === 'login' ? 'Bienvenido de nuevo!' : 'Cuenta creada exitosamente!');
      router.replace('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : error || 'Error de autenticacion';
      toast.error(errorMessage);
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0F0F1A', '#1A1A2E'] : ['#FAFBFF', '#EDE9FE']}
      style={styles.gradient}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Decorative Background Orbs */}
        <View style={[styles.orbTop, { opacity: isDark ? 0.3 : 0.4 }]}>
          <LinearGradient
            colors={['rgba(124,58,237,0.4)', 'rgba(168,85,247,0.1)']}
            style={styles.orbGradient}
          />
        </View>
        <View style={[styles.orbBottom, { opacity: isDark ? 0.3 : 0.4 }]}>
          <LinearGradient
            colors={['rgba(6,182,212,0.3)', 'rgba(59,130,246,0.1)']}
            style={styles.orbGradient}
          />
        </View>

        {/* Dark Mode Toggle */}
        <Pressable
          onPress={toggleColorMode}
          style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </Pressable>

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
            {/* Main Card */}
            <View style={[
              styles.mainCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Platform.OS === 'ios' && styles.shadowIOS,
              Platform.OS === 'android' && styles.shadowAndroid,
              Platform.OS === 'web' && styles.shadowWeb,
            ]}>
              {/* Logo */}
              <View style={styles.logoSection}>
                <LinearGradient
                  colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
                  style={styles.logoContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.logoText}>K</Text>
                </LinearGradient>
                <Text style={[styles.appName, { color: colors.primary }]}>Konta</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {mode === 'login' ? 'Bienvenido de nuevo!' : 'Crea tu cuenta'}
                </Text>
              </View>

              {/* Mode Toggle */}
              <View style={[styles.modeToggle, { backgroundColor: colors.inputBg }]}>
                {(['login', 'register'] as AuthMode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      clearError();
                      setMode(m);
                    }}
                    style={[styles.modeButton]}
                  >
                    {mode === m ? (
                      <LinearGradient
                        colors={GRADIENTS.primary as [string, string]}
                        style={styles.modeButtonActive}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.modeButtonTextActive}>
                          {m === 'login' ? 'Iniciar Sesion' : 'Registrarse'}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.modeButtonInactive}>
                        <Text style={[styles.modeButtonText, { color: colors.textSecondary }]}>
                          {m === 'login' ? 'Iniciar Sesion' : 'Registrarse'}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Nombre Completo
                    </Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                      <Text style={styles.inputIcon}>👤</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Tu nombre"
                        placeholderTextColor={colors.textMuted}
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Correo Electronico
                  </Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="tu@email.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Contrasena
                  </Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                  </View>
                </View>

                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Confirmar Contrasena
                    </Text>
                    <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                      <Text style={styles.inputIcon}>🔐</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoComplete="new-password"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.submitButtonWrapper,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LinearGradient
                  colors={GRADIENTS.primaryFull as [string, string, ...string[]]}
                  style={styles.submitButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o continua con</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Social Login */}
              <View style={styles.socialButtons}>
                {['🔵', '📘', '🍎'].map((icon, i) => (
                  <Pressable
                    key={i}
                    style={[styles.socialButton, { borderColor: colors.border }]}
                  >
                    <Text style={styles.socialIcon}>{icon}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {mode === 'login' ? 'No tienes cuenta? ' : 'Ya tienes cuenta? '}
                </Text>
                <Pressable onPress={toggleMode}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>
                    {mode === 'login' ? 'Registrate' : 'Inicia Sesion'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
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
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  // Decorative orbs
  orbTop: {
    position: 'absolute',
    top: '5%',
    left: '-10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
  },
  orbBottom: {
    position: 'absolute',
    bottom: '5%',
    right: '-10%',
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: 'hidden',
  },
  orbGradient: {
    flex: 1,
  },
  // Theme toggle
  themeToggle: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  themeToggleIcon: {
    fontSize: 20,
  },
  // Main card
  mainCard: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
  },
  shadowIOS: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
  },
  shadowAndroid: {
    elevation: 12,
  },
  shadowWeb: {
    boxShadow: '0 25px 50px rgba(124,58,237,0.15)',
  },
  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
  },
  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
  },
  modeButtonActive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonInactive: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modeButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Form
  form: {
    gap: 16,
  },
  inputGroup: {},
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
  },
  // Submit button
  submitButtonWrapper: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButton: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Divider
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
    paddingHorizontal: 16,
    fontSize: 13,
  },
  // Social buttons
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
