import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useCamera, useUploadReceipt } from '../../hooks';
import { PickedFile } from '../../hooks/useCamera';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useColorMode } from '../../providers/GluestackUIProvider';
import { useResponsive } from '../../hooks/useResponsive';

interface ReceiptUploaderProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function ReceiptUploader({ onSuccess, onError }: ReceiptUploaderProps) {
  const { isDark } = useColorMode();
  const { isSmallMobile, horizontalPadding } = useResponsive();
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
      <View style={[styles.card, { marginHorizontal: horizontalPadding }]}>
        <View style={[styles.uploadContainer, { backgroundColor: colors.surface, borderColor: colors.border }, isSmallMobile && { padding: 16 }]}>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingIconContainer, { backgroundColor: colors.primaryLight }, isSmallMobile && { width: 64, height: 64, borderRadius: 32 }]}>
              <ActivityIndicator size={isSmallMobile ? 'small' : 'large'} color={colors.primary} />
            </View>
            <Text style={[styles.loadingTitle, { color: colors.text }, isSmallMobile && { fontSize: 16 }]}>
              {uploadMutation.isPending ? 'Procesando recibo...' : 'Cargando...'}
            </Text>
            <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }, isSmallMobile && { fontSize: 12 }]}>
              La IA está extrayendo los datos
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { marginHorizontal: horizontalPadding }]}>
      <View style={[
        styles.uploadContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSmallMobile && { padding: 16, borderRadius: 12 }
      ]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }, isSmallMobile && { width: 56, height: 56, borderRadius: 28, marginBottom: 12 }]}>
          <Text style={[styles.icon, isSmallMobile && { fontSize: 28 }]}>🧾</Text>
        </View>

        {/* Text */}
        <Text style={[styles.title, { color: colors.text }, isSmallMobile && { fontSize: 18, marginBottom: 6 }]}>Subir Recibo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }, isSmallMobile && { fontSize: 12, marginBottom: 12 }]}>
          Soporta imágenes (JPG, PNG, WEBP) y archivos PDF
        </Text>

        {/* Supported formats */}
        <View style={[styles.formatsContainer, isSmallMobile && { gap: 6, marginBottom: 16 }]}>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }, isSmallMobile && { paddingHorizontal: 8, paddingVertical: 4 }]}>
            <Text style={[styles.formatText, { color: colors.primary }, isSmallMobile && { fontSize: 10 }]}>📷 JPG</Text>
          </View>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }, isSmallMobile && { paddingHorizontal: 8, paddingVertical: 4 }]}>
            <Text style={[styles.formatText, { color: colors.primary }, isSmallMobile && { fontSize: 10 }]}>🖼️ PNG</Text>
          </View>
          <View style={[styles.formatBadge, { backgroundColor: colors.primaryLight }, isSmallMobile && { paddingHorizontal: 8, paddingVertical: 4 }]}>
            <Text style={[styles.formatText, { color: colors.primary }, isSmallMobile && { fontSize: 10 }]}>📄 PDF</Text>
          </View>
        </View>

        {/* Upload Button */}
        <Button
          title="📤 Seleccionar Archivo"
          onPress={handlePickFile}
          fullWidth
          size={isSmallMobile ? 'medium' : 'large'}
        />

        {uploadMutation.isError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }, isSmallMobile && { marginTop: 12, padding: 10 }]}>
            <Text style={[styles.errorText, { color: colors.error }, isSmallMobile && { fontSize: 12 }]}>
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
    marginVertical: 16,
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
