import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCamera, useUploadReceipt } from '../../hooks';
import { PickedFile } from '../../hooks/useCamera';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ReceiptUploaderProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function ReceiptUploader({ onSuccess, onError }: ReceiptUploaderProps) {
  const { pickFile, isLoading: isPickerLoading } = useCamera();
  const uploadMutation = useUploadReceipt();

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
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>
            {uploadMutation.isPending ? 'Processing receipt...' : 'Loading...'}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Upload Receipt</Text>
      <Text style={styles.subtitle}>
        Supports images (JPG, PNG, WEBP) and PDF files
      </Text>

      <Button
        title="📤 Select File"
        onPress={handlePickFile}
        style={styles.button}
        size="large"
      />

      {uploadMutation.isError && (
        <Text style={styles.errorText}>
          Failed to process receipt. Please try again.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
});
