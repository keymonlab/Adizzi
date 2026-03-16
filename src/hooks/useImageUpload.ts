import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { MAX_IMAGES } from '@/constants/config';

interface UseImageUploadReturn {
  images: string[];
  uploading: boolean;
  pickImages: () => Promise<void>;
  takePhoto: () => Promise<void>;
  removeImage: (index: number) => void;
  uploadImages: (userId: string) => Promise<string[]>;
  clearImages: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = async (): Promise<void> => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
    }
  };

  const takePhoto = async (): Promise<void> => {
    if (images.length >= MAX_IMAGES) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number): void => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploading(true);
    const publicUrls: string[] = [];
    let failedCount = 0;

    try {
      for (const uri of images) {
        try {
          const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const path = `${userId}/${filename}`;

          const response = await fetch(uri);
          const blob = await response.blob();

          const arrayBuffer = await new Response(blob).arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(path, uint8Array, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('post-images')
            .getPublicUrl(path);

          publicUrls.push(data.publicUrl);
        } catch {
          failedCount += 1;
        }
      }
    } finally {
      setUploading(false);
    }

    if (failedCount > 0) {
      Alert.alert(
        '이미지 업로드 실패',
        `${failedCount}개의 이미지 업로드에 실패했어요. 다시 시도해주세요.`,
        [{ text: '확인' }]
      );
    }

    return publicUrls;
  };

  const clearImages = (): void => {
    setImages([]);
  };

  return {
    images,
    uploading,
    pickImages,
    takePhoto,
    removeImage,
    uploadImages,
    clearImages,
  };
}
