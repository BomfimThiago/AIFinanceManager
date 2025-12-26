import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform, Alert } from 'react-native';

export interface PickedFile {
  uri: string;
  mimeType?: string;
}

interface UseCamera {
  isLoading: boolean;
  takePhoto: () => Promise<PickedFile | null>;
  pickFromGallery: () => Promise<PickedFile | null>;
  pickDocument: () => Promise<PickedFile | null>;
  pickFile: () => Promise<PickedFile | null>;
}

export function useCamera(): UseCamera {
  const [isLoading, setIsLoading] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos of receipts.'
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Gallery permission is needed to select receipt images.'
      );
      return false;
    }
    return true;
  };

  const compressImage = async (uri: string): Promise<string> => {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return result.uri;
  };

  const takePhoto = useCallback(async (): Promise<PickedFile | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets[0]) return null;

      const compressedUri = await compressImage(result.assets[0].uri);
      return { uri: compressedUri, mimeType: 'image/jpeg' };
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickFromGallery = useCallback(async (): Promise<PickedFile | null> => {
    setIsLoading(true);
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets[0]) return null;

      const compressedUri = await compressImage(result.assets[0].uri);
      return { uri: compressedUri, mimeType: 'image/jpeg' };
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickDocument = useCallback(async (): Promise<PickedFile | null> => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || undefined,
      };
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Universal file picker - picks any supported file type
  const pickFile = useCallback(async (): Promise<PickedFile | null> => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || undefined,
      };
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select file');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, takePhoto, pickFromGallery, pickDocument, pickFile };
}
