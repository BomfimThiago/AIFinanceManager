import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { getTheme, radius, colors } from '../../constants/theme';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AuthForm({ mode, onSubmit, isLoading = false, error }: AuthFormProps) {
  const { isDark } = useColorMode();
  const theme = getTheme(isDark);

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(isLogin ? {} : { fullName: '', confirmPassword: '' }),
    },
  });

  const handleFormSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  return (
    <View style={styles.container}>
      {!isLogin && (
        <>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Nombre completo</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                    errors.fullName && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Juan Pérez"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName.message}</Text>
                )}
              </View>
            )}
          />
        </>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                errors.email && styles.inputError,
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="email@ejemplo.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Contraseña</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                errors.password && styles.inputError,
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              editable={!isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      {!isLogin && (
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Confirmar contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                  errors.confirmPassword && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>
          )}
        />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      <Button
        variant="primary"
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isLoading}
        style={styles.submitButton}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          isLogin ? 'Iniciar sesión' : 'Registrarse'
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger.main,
  },
  errorText: {
    color: colors.danger.main,
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: colors.danger.light,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorMessage: {
    color: colors.danger.main,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});