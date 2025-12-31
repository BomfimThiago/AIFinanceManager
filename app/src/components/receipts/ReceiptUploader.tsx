import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useCamera, useUploadReceipt } from '../../hooks';
import { PickedFile } from '../../hooks/useCamera';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useColorMode } from '../../providers/GluestackUIProvider';

interface ReceiptUploaderProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function ReceiptUploader({ onSuccess, onError }: ReceiptUploaderProps) {
  const { isDark } = useColorMode();
  const { pickFile, isLoading: isPickerLoading } = useCamera();
  const uploadMutation = useUploadReceipt();

  const colors = {
    background: isDark ? '#1f2937' : '#ffffff',
    surface: isDark ? '#374151' : '#f9fafb',
    text: isDark ? '#f9fafb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    primary: '#7c3aed',
    primaryLight: isDark ? '#7c3aed20' : '#ede9fe',
    border: isDark ? '#4b5563' : '#e5e7eb',
    error: '#ef4444',
  };

  const isLoading = isPickerLoading || uploadMutation.isPending;

  const handleUpload = async (file: PickedFile | null) => {
    if (!file) return;

    try {
      await uploadMutation.mutateAsync({ uri: file.uri, mimeType: file.mimeType });
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handlePickFile = async () => {
    const file = await pickFile();
    await handleUpload(file);
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={[styles.uploadContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingIconContainer, { backgroundColor: colors.primaryLight }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.loadingTitle, { color: colors.text }]}>
              {uploadMutation.isPending ? 'Procesando recibo...' : 'Cargando...'}
            </Text>
            <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
              La IA está extrayendo los datos
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[
        styles.uploadContainer,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.icon}>🧾</Text>
        </View>

        {/* Text */}
        <Text style={[styles.title, { color: colors.text }]}>Subir Recibo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Soporta imágenes (JPG, PNG, WEBP) y archivos PDF
        </Text>

        {/* Supported formats */}
        <View style={styles.formatsContainer}>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.formatText, { color: colors.primary }]}>📷 JPG</Text>
          </View>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.formatText, { color: colors.primary }]}>🖼️ PNG</Text>
          </View>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.formatText, { color: colors.primary }]}>📄 PDF</Text>
          </View>
        </View>

        {/* Upload Button */}
        <Button
          title="📤 Seleccionar Archivo"
          onPress={handlePickFile}
          fullWidth
          size="large"
        />

        {uploadMutation.isError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              ❌ Error al procesar el recibo. Por favor intenta de nuevo.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  uploadContainer: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  formatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
